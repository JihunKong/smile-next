import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getInquiryAttemptStatus } from './actions'
import { InquiryStartButton } from './inquiry-client'
import { AttemptHistoryList } from '@/components/modes/AttemptHistoryList'
import { LeaderboardSection } from '@/components/modes/LeaderboardSection'
import type { InquirySettings } from '@/types/activities'

interface InquiryPageProps {
  params: Promise<{ id: string }>
}

export default async function InquiryPage({ params }: InquiryPageProps) {
  const { id: activityId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId, isDeleted: false, mode: 2 },
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

  const inquirySettings = (activity.inquirySettings as unknown as InquirySettings) || {
    questionsRequired: 5,
    timePerQuestion: 240,
    keywordPool1: [],
    keywordPool2: [],
    passThreshold: 6.0,
  }

  const attemptStatus = await getInquiryAttemptStatus(activityId)
  const hasInProgress = attemptStatus?.status === 'in_progress'
  const isCompleted = attemptStatus?.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-8 px-4">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h1 className="text-2xl font-bold">Inquiry Mode</h1>
          </div>
          <p className="text-white/80">{activity.name}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Inquiry Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{inquirySettings.questionsRequired}</p>
              <p className="text-sm text-gray-600">Questions to Generate</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{Math.floor(inquirySettings.timePerQuestion / 60)}</p>
              <p className="text-sm text-gray-600">Minutes Per Question</p>
            </div>
          </div>

          {activity.description && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{activity.description}</p>
            </div>
          )}

          {/* Keywords */}
          {(inquirySettings.keywordPool1.length > 0 || inquirySettings.keywordPool2.length > 0) && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Keyword Pools</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-100 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Pool 1: Concepts</h4>
                  <div className="flex flex-wrap gap-2">
                    {inquirySettings.keywordPool1.map((kw, i) => (
                      <span key={i} className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-sm">
                        {kw}
                      </span>
                    ))}
                    {inquirySettings.keywordPool1.length === 0 && (
                      <span className="text-sm text-yellow-700">No keywords set</span>
                    )}
                  </div>
                </div>
                <div className="bg-orange-100 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Pool 2: Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {inquirySettings.keywordPool2.map((kw, i) => (
                      <span key={i} className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-sm">
                        {kw}
                      </span>
                    ))}
                    {inquirySettings.keywordPool2.length === 0 && (
                      <span className="text-sm text-orange-700">No keywords set</span>
                    )}
                  </div>
                </div>
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
              <li>Create questions that connect concepts from both keyword pools</li>
              <li>You have {Math.floor(inquirySettings.timePerQuestion / 60)} minutes per question</li>
              <li>Each question will be evaluated by AI for quality</li>
              <li>Score of {inquirySettings.passThreshold} or higher is considered passing</li>
            </ul>
          </div>

          {/* Previous Attempts */}
          {attemptStatus && attemptStatus.allAttempts && attemptStatus.allAttempts.length > 0 && (
            <div className="mb-6">
              <AttemptHistoryList
                attempts={attemptStatus.allAttempts}
                activityId={activityId}
                mode="inquiry"
                passThreshold={inquirySettings.passThreshold}
                showViewLink={false}
              />
            </div>
          )}

          {/* Start Button */}
          {!isCompleted && (
            <InquiryStartButton
              activityId={activityId}
              hasInProgress={hasInProgress}
            />
          )}

          {isCompleted && (
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-600">You have completed this inquiry session.</p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <LeaderboardSection
          activityId={activityId}
          mode="inquiry"
          title="Top Question Creators"
        />
      </div>
    </div>
  )
}
