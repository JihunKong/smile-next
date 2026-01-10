import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getExamAttemptStatus } from './actions'
import { ExamStartButton } from './exam-client'
import { AttemptHistoryList } from '@/components/modes/AttemptHistoryList'
import { LeaderboardSection } from '@/components/modes/LeaderboardSection'
import type { ExamSettings } from '@/types/activities'

interface ExamPageProps {
  params: Promise<{ id: string }>
}

interface ExamSettingsWithPublish extends ExamSettings {
  is_published?: boolean
  instructions?: string
}

export default async function ExamPage({ params }: ExamPageProps) {
  const { id: activityId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const activity = await prisma.activity.findUnique({
    where: { id: activityId, isDeleted: false, mode: 1 },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
      owningGroup: {
        select: {
          id: true,
          name: true,
          creatorId: true,
          members: {
            where: { userId: session.user.id },
            select: { userId: true, role: true },
          },
        },
      },
      _count: {
        select: { questions: true },
      },
    },
  })

  if (!activity) {
    notFound()
  }

  if (activity.owningGroup.members.length === 0) {
    notFound()
  }

  // Check if user is admin/creator
  const membership = activity.owningGroup.members[0]
  const isCreator = activity.creatorId === session.user.id
  const isGroupOwner = activity.owningGroup.creatorId === session.user.id
  const isAdmin = membership?.role && membership.role >= 2
  const canManage = isCreator || isGroupOwner || isAdmin

  const examSettings = (activity.examSettings as unknown as ExamSettingsWithPublish) || {
    timeLimit: 30,
    questionsToShow: 10,
    passThreshold: 60,
    maxAttempts: 1,
  }

  // Check if exam is published (default to true for backwards compatibility)
  const isPublished = examSettings.is_published !== false

  const attemptStatus = await getExamAttemptStatus(activityId)
  const remainingAttempts = examSettings.maxAttempts - (attemptStatus?.attemptCount || 0)
  const hasInProgress = !!attemptStatus?.inProgress
  const bestScore = attemptStatus?.completed.length
    ? Math.max(...attemptStatus.completed.map((a) => a.score || 0))
    : null

  // If not published and not admin, show unavailable message
  if (!isPublished && !canManage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-red-600 to-red-800 text-white py-8 px-4">
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
            <h1 className="text-2xl font-bold">Exam Mode</h1>
            <p className="text-white/80">{activity.name}</p>
          </div>
        </section>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">Exam Not Available</h2>
            <p className="text-yellow-700">
              This exam has not been published yet. Please check back later or contact your instructor.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unpublished Banner (for admins) */}
      {!isPublished && canManage && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-yellow-800 font-medium">This exam is not published yet</span>
            </div>
            <Link
              href={`/activities/${activityId}/edit`}
              className="text-sm text-yellow-700 hover:text-yellow-900 underline"
            >
              Edit Settings
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="bg-gradient-to-r from-red-600 to-red-800 text-white py-8 px-4">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h1 className="text-2xl font-bold">Exam Mode</h1>
          </div>
          <p className="text-white/80">{activity.name}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Exam Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Information</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{examSettings.timeLimit}</p>
              <p className="text-sm text-gray-600">Minutes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">
                {Math.min(examSettings.questionsToShow, activity._count.questions)}
              </p>
              <p className="text-sm text-gray-600">Questions</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{examSettings.passThreshold}%</p>
              <p className="text-sm text-gray-600">Pass Threshold</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{remainingAttempts}</p>
              <p className="text-sm text-gray-600">Attempts Left</p>
            </div>
          </div>

          {activity.description && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{activity.description}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Important Instructions
            </h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>The timer starts as soon as you begin the exam</li>
              <li>Your answers are saved automatically</li>
              <li>The exam will auto-submit when time expires</li>
              <li>You cannot pause or restart once you begin</li>
            </ul>
          </div>

          {/* Previous Attempts */}
          {attemptStatus && attemptStatus.allAttempts && attemptStatus.allAttempts.length > 0 && (
            <div className="mb-6">
              <AttemptHistoryList
                attempts={attemptStatus.allAttempts}
                activityId={activityId}
                mode="exam"
                passThreshold={examSettings.passThreshold}
              />
            </div>
          )}

          {/* Best Score */}
          {bestScore !== null && (
            <div className="text-center mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600">Your Best Score</p>
              <p className="text-3xl font-bold text-blue-700">{bestScore.toFixed(1)}%</p>
            </div>
          )}

          {/* Start Button */}
          {remainingAttempts > 0 ? (
            <ExamStartButton
              activityId={activityId}
              hasInProgress={hasInProgress}
            />
          ) : (
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-600">You have used all your attempts for this exam.</p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <LeaderboardSection
          activityId={activityId}
          mode="exam"
          title="Top Performers"
        />
      </div>
    </div>
  )
}
