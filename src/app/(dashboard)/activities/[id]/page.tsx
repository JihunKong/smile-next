import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { QuestionList } from '@/components/activities/QuestionList'
import { DeleteActivityButton, QRCodeSection, ActionButtons } from './actions-client'
import { getModeLabel, getModeBadgeColor, canManageActivity } from '@/lib/activities/utils'
import { ActivityModes, type ActivityMode } from '@/types/activities'
import { StudentProgressWidget } from '@/components/activities/StudentProgressWidget'

// Helper to get education level label
function getEducationLevelLabel(level: string | null): string {
  const labels: Record<string, string> = {
    elementary: 'Elementary School',
    middle: 'Middle School',
    high: 'High School',
    college: 'College/University',
    graduate: 'Graduate School',
    professional: 'Professional',
  }
  return level ? labels[level] || level : 'Not specified'
}

// Helper to get grade label
function getGradeLabel(grade: number): string {
  if (grade === -1) return 'Not specified'
  if (grade >= 1 && grade <= 12) return `Grade ${grade}`
  if (grade >= 13) return `Year ${grade - 12}`
  return `Grade ${grade}`
}

interface ActivityDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const activity = await prisma.activity.findUnique({
    where: { id, isDeleted: false },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
      },
      owningGroup: {
        select: {
          id: true,
          name: true,
          creatorId: true,
          inviteCode: true,
          members: {
            where: { userId: session.user.id },
            select: { userId: true, role: true },
          },
        },
      },
      questions: {
        where: { isDeleted: false },
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
          },
          evaluation: {
            select: {
              id: true,
              bloomsLevel: true,
              overallScore: true,
              clarityScore: true,
              relevanceScore: true,
              creativityScore: true,
              evaluationText: true,
            },
          },
          _count: {
            select: { responses: true, likes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { questions: true },
      },
    },
  })

  if (!activity) {
    notFound()
  }

  // Check if user is a member of the group
  const currentMembership = activity.owningGroup.members[0]
  if (!currentMembership) {
    notFound()
  }

  // Fetch user's likes for these questions
  const questionIds = activity.questions.map((q) => q.id)
  const userLikes = await prisma.like.findMany({
    where: {
      userId: session.user.id,
      questionId: { in: questionIds },
    },
    select: { questionId: true },
  })
  const likedQuestionIds = new Set(userLikes.map((l) => l.questionId))

  const mode = activity.mode as ActivityMode
  const isManager = canManageActivity(session.user.id, activity.creatorId, activity.owningGroup.creatorId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href={`/groups/${activity.owningGroupId}`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {activity.owningGroup.name}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{activity.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getModeBadgeColor(mode)}`}>
                  {getModeLabel(mode)}
                </span>
              </div>

              {activity.description && (
                <p className="text-white/80 max-w-2xl">{activity.description}</p>
              )}

              <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {activity._count.questions} questions
                </span>
                {activity.aiRatingEnabled && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Rating Enabled
                  </span>
                )}
                <span>Created {new Date(activity.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Creator avatar */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium">
                {activity.creator.avatarUrl ? (
                  <img
                    src={activity.creator.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <>
                    {activity.creator.firstName?.[0] || ''}
                    {activity.creator.lastName?.[0] || ''}
                  </>
                )}
              </div>
              <div className="text-sm">
                <p className="font-medium">{activity.creator.firstName} {activity.creator.lastName}</p>
                <p className="text-white/70">Creator</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            {/* Management buttons (Flask-style) */}
            {isManager && (
              <>
                <Link
                  href={`/activities/${activity.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition border border-white/30"
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </Link>
                <Link
                  href={`/activities/${activity.id}/analytics`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition border border-white/30"
                >
                  <i className="fas fa-chart-bar"></i>
                  Analytics
                </Link>
                <Link
                  href={`/activities/${activity.id}/results`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition border border-white/30"
                >
                  <i className="fas fa-file-alt"></i>
                  Results
                </Link>
              </>
            )}

            {/* Mode-specific start buttons */}
            {mode === ActivityModes.EXAM && (
              <Link
                href={`/activities/${activity.id}/exam`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
              >
                <i className="fas fa-clipboard-check"></i>
                Take Exam
              </Link>
            )}

            {mode === ActivityModes.INQUIRY && (
              <Link
                href={`/activities/${activity.id}/inquiry`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition"
              >
                <i className="fas fa-lightbulb"></i>
                Start Inquiry
              </Link>
            )}

            {mode === ActivityModes.CASE && (
              <Link
                href={`/activities/${activity.id}/case`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
              >
                <i className="fas fa-briefcase"></i>
                Start Case Study
              </Link>
            )}

            {/* Open mode: Ask a Question */}
            {mode === ActivityModes.OPEN && (
              <Link
                href={`/activities/${activity.id}/questions/create`}
                data-testid="ask-question"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition"
              >
                <i className="fas fa-plus"></i>
                Ask a Question
              </Link>
            )}

            {isManager && (
              <DeleteActivityButton activityId={activity.id} activityName={activity.name} />
            )}
          </div>

          {/* Additional Action Buttons (Flask-style) */}
          {isManager && (
            <div className="mt-4">
              <ActionButtons
                activityId={activity.id}
                activityName={activity.name}
                groupId={activity.owningGroupId}
                isManager={isManager}
              />
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Questions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Questions ({activity.questions.length})
              </h2>
              <QuestionList
                questions={activity.questions}
                activityId={activity.id}
                currentUserId={session.user.id}
                activityCreatorId={activity.creatorId}
                groupCreatorId={activity.owningGroup.creatorId}
                showActions={true}
                likedQuestionIds={likedQuestionIds}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Custom Instructions (Open Mode only) */}
            {mode === ActivityModes.OPEN && activity.openModeSettings && (
              <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <i className="fas fa-info-circle"></i>
                  Instructions
                </h2>
                <p className="text-sm text-blue-700">
                  {(activity.openModeSettings as { instructions?: string })?.instructions ||
                   'Ask thoughtful questions related to the topic.'}
                </p>
              </section>
            )}

            {/* Student Progress Widget (Open Mode Pass/Fail) */}
            {mode === ActivityModes.OPEN && (
              <StudentProgressWidget activityId={activity.id} />
            )}

            {/* QR Code Invite Section */}
            <QRCodeSection
              activityId={activity.id}
              inviteUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'https://smile.example.com'}/activities/join?code=${activity.owningGroup.inviteCode || activity.id}`}
            />

            {/* Academic Information */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-graduation-cap mr-2 text-indigo-500"></i>
                Academic Information
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Subject</span>
                  <span className="font-medium">{activity.schoolSubject || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Topic</span>
                  <span className="font-medium">{activity.topic || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Education Level</span>
                  <span className="font-medium">{getEducationLevelLabel(activity.educationLevel)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Grade</span>
                  <span className="font-medium">{getGradeLabel(activity.schoolGrade)}</span>
                </div>
              </div>
            </section>

            {/* Activity Info */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-info-circle mr-2 text-gray-500"></i>
                Activity Info
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Group</span>
                  <Link
                    href={`/groups/${activity.owningGroupId}`}
                    className="font-medium text-[var(--stanford-cardinal)] hover:underline"
                  >
                    {activity.owningGroup.name}
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Mode</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getModeBadgeColor(mode)}`}>
                    {getModeLabel(mode)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">AI Rating</span>
                  <span className="font-medium">{activity.aiRatingEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Anonymous</span>
                  <span className="font-medium">{activity.isAnonymousAuthorAllowed ? 'Allowed' : 'Not Allowed'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{new Date(activity.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-chart-pie mr-2 text-green-500"></i>
                Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-[var(--stanford-cardinal)]">{activity._count.questions}</p>
                  <p className="text-xs text-gray-500">Questions</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-[var(--stanford-pine)]">{activity.numberOfLikes}</p>
                  <p className="text-xs text-gray-500">Likes</p>
                </div>
              </div>
            </section>

            {/* Pass/Fail Progress (Open Mode with evaluation) */}
            {mode === ActivityModes.OPEN && activity.aiRatingEnabled && activity.questions.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  <i className="fas fa-tasks mr-2 text-purple-500"></i>
                  Evaluation Progress
                </h2>
                <div className="space-y-3">
                  {(() => {
                    const evaluated = activity.questions.filter(q => q.evaluation).length
                    const passing = activity.questions.filter(q => q.evaluation && (q.evaluation.overallScore || 0) >= 7).length
                    const total = activity.questions.length
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Evaluated</span>
                          <span className="font-medium text-blue-600">{evaluated} / {total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${total > 0 ? (evaluated / total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-3">
                          <span className="text-gray-500">Passing (7+)</span>
                          <span className="font-medium text-green-600">{passing} / {evaluated}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${evaluated > 0 ? (passing / evaluated) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
