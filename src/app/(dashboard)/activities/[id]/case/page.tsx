import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCaseAttemptStatus } from './actions'
import { CaseStartButton } from './case-client'
import { AttemptHistoryList } from '@/components/modes/AttemptHistoryList'
import { LeaderboardSection } from '@/components/modes/LeaderboardSection'
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
      {/* Header - Flask indigo theme */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-8 px-4">
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
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{caseSettings.scenarios.length}</p>
              <p className="text-sm text-gray-600">Scenarios</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{caseSettings.timePerCase}</p>
              <p className="text-sm text-gray-600">Min Per Case</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{caseSettings.totalTimeLimit}</p>
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
                    <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
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

          {/* 4-Criteria Grading Rubric (Flask-style) */}
          <div className="bg-white border border-indigo-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Evaluation Criteria (0-10 points each)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Understanding */}
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">1. Understanding</p>
                  <p className="text-xs text-gray-600">Identify core problems and implications</p>
                </div>
              </div>

              {/* Ingenuity */}
              <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">2. Ingenuity</p>
                  <p className="text-xs text-gray-600">Creative and practical solutions</p>
                </div>
              </div>

              {/* Critical Thinking */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">3. Critical Thinking</p>
                  <p className="text-xs text-gray-600">Multiple perspectives and logical reasoning</p>
                </div>
              </div>

              {/* Real-World Application */}
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">4. Real-World Application</p>
                  <p className="text-xs text-gray-600">Practical and implementable suggestions</p>
                </div>
              </div>
            </div>

            <div className="mt-3 bg-indigo-50 border border-indigo-200 rounded-lg p-2">
              <p className="text-sm text-indigo-900 text-center">
                <svg className="w-4 h-4 text-indigo-600 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <strong>Pass Threshold:</strong> Average of <span className="font-semibold">{caseSettings.passThreshold}</span> or higher
              </p>
            </div>
          </div>

          {/* Previous Attempts */}
          {attemptStatus && attemptStatus.allAttempts && attemptStatus.allAttempts.length > 0 && (
            <div className="mb-6">
              <AttemptHistoryList
                attempts={attemptStatus.allAttempts}
                activityId={activityId}
                mode="case"
                passThreshold={caseSettings.passThreshold}
              />
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

        {/* Leaderboard */}
        <LeaderboardSection
          activityId={activityId}
          mode="case"
          title="Top Problem Solvers"
        />
      </div>
    </div>
  )
}
