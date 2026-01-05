import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCaseAttemptStatus } from './actions'
import { CaseStartButton } from './case-client'
import type { CaseSettings } from '@/types/activities'

interface CasePageProps {
  params: Promise<{ id: string }>
}

export default async function CasePage({ params }: CasePageProps) {
  const { id: activityId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId, isDeleted: false, mode: 3 },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
      owningGroup: {
        select: {
          id: true,
          name: true,
          members: {
            where: { userId: session.user.id },
            select: { userId: true },
          },
        },
      },
    },
  })

  if (!activity) {
    notFound()
  }

  if (activity.owningGroup.members.length === 0) {
    notFound()
  }

  const caseSettings = (activity.openModeSettings as unknown as CaseSettings) || {
    scenarios: [],
    timePerCase: 10,
    totalTimeLimit: 60,
    maxAttempts: 1,
    passThreshold: 6.0,
  }

  const attemptStatus = await getCaseAttemptStatus(activityId)
  const hasInProgress = attemptStatus?.status === 'in_progress'
  const isCompleted = attemptStatus?.status === 'completed'
  const canRetry = isCompleted && (attemptStatus?.attemptsUsed || 0) < (attemptStatus?.maxAttempts || 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/activities/${activityId}`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Activity
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h1 className="text-2xl font-bold">Case Study Mode</h1>
          </div>
          <p className="text-white/80">{activity.name}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Case Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{caseSettings.scenarios.length}</p>
              <p className="text-sm text-gray-600">Scenarios</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{caseSettings.timePerCase}</p>
              <p className="text-sm text-gray-600">Min Per Case</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{caseSettings.totalTimeLimit}</p>
              <p className="text-sm text-gray-600">Min Total</p>
            </div>
          </div>

          {activity.description && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{activity.description}</p>
            </div>
          )}

          {/* Scenario Previews */}
          {caseSettings.scenarios.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Scenarios Preview</h3>
              <div className="space-y-2">
                {caseSettings.scenarios.map((scenario, index) => (
                  <div key={scenario.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-800">{scenario.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Instructions
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>Read each scenario carefully before answering</li>
              <li>For each case, identify the key issues and propose solutions</li>
              <li>You have {caseSettings.timePerCase} minutes per scenario</li>
              <li>Total time limit: {caseSettings.totalTimeLimit} minutes</li>
              <li>Score of {caseSettings.passThreshold} or higher is considered passing</li>
            </ul>
          </div>

          {/* Grading Criteria */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Grading Criteria</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Problem Identification</span>
                <span className="font-medium">40%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Solution Quality</span>
                <span className="font-medium">40%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Clarity & Organization</span>
                <span className="font-medium">20%</span>
              </div>
            </div>
          </div>

          {/* Status / Previous Attempts */}
          {attemptStatus && (
            <div className={`p-4 rounded-lg mb-6 ${
              attemptStatus.status === 'completed'
                ? 'bg-green-50 border border-green-200'
                : attemptStatus.status === 'in_progress'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <h3 className={`font-medium mb-2 ${
                attemptStatus.status === 'completed'
                  ? 'text-green-800'
                  : attemptStatus.status === 'in_progress'
                  ? 'text-yellow-800'
                  : 'text-gray-800'
              }`}>
                {attemptStatus.status === 'completed'
                  ? 'Completed'
                  : attemptStatus.status === 'in_progress'
                  ? 'In Progress'
                  : 'Not Started'}
              </h3>
              {attemptStatus.status === 'in_progress' && (
                <p className="text-sm text-yellow-700">
                  Scenarios completed: {attemptStatus.scenariosCompleted} / {attemptStatus.totalScenarios}
                </p>
              )}
              {attemptStatus.status === 'completed' && (
                <div className="text-sm text-green-700">
                  <p>Best Score: {attemptStatus.bestScore?.toFixed(1)} / 10</p>
                  <p>Attempts Used: {attemptStatus.attemptsUsed} / {attemptStatus.maxAttempts}</p>
                </div>
              )}
            </div>
          )}

          {/* Start/Continue Button */}
          {(!isCompleted || canRetry) && caseSettings.scenarios.length > 0 && (
            <CaseStartButton
              activityId={activityId}
              hasInProgress={hasInProgress}
            />
          )}

          {isCompleted && !canRetry && (
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-600">You have completed all available attempts for this case study.</p>
            </div>
          )}

          {caseSettings.scenarios.length === 0 && (
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700">No scenarios have been added to this case study yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
