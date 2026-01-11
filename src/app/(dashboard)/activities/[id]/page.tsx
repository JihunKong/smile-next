import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { QuestionList } from '@/components/activities/QuestionList'
import { DeleteActivityButton, QRCodeSection, ActionButtons } from './actions-client'
import { getModeLabel, getModeBadgeColor, canManageActivity } from '@/lib/activities/utils'
import { ActivityModes, type ActivityMode } from '@/types/activities'
import { StudentProgressWidget } from '@/components/activities/StudentProgressWidget'
import { ExamModeCard, InquiryModeCard, CaseModeCard } from '@/components/activities/ModeInfoCards'
import { ActivityStatsCard } from '@/components/activities/ActivityStatsCard'

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
          isPrivate: true,
          members: {
            where: { userId: session.user.id },
            select: { userId: true, role: true },
          },
          _count: {
            select: { members: true },
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

  // Fetch mode-specific user attempts and data
  let userExamAttempt: {
    id: string
    passed: boolean
    score_percentage: number
    submitted_at: string
  } | null = null
  let allExamAttempts: Array<{
    id: string
    passed: boolean
    score_percentage: number
    submitted_at: string
    student_id: string
    student_name: string
    student_email: string
  }> = []
  let userInquiryAttempt: {
    id: string
    passed: boolean
    submitted_at: string
  } | null = null
  let userCaseAttempt: {
    id: string
    passed: boolean
    submitted_at: string
  } | null = null
  let caseConfig: {
    num_cases_to_show?: number
    time_per_case?: number
    pass_threshold?: number
    difficulty_level?: string
    is_finalized?: boolean
    max_attempts?: number
  } | null = null
  let caseAttemptsRemaining = 0
  let canRetakeCase = false

  if (mode === ActivityModes.EXAM) {
    // Fetch user's exam attempt
    const examAttempt = await prisma.examAttempt.findFirst({
      where: {
        activityId: activity.id,
        userId: session.user.id,
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
    })
    if (examAttempt) {
      // Calculate score percentage from correctAnswers / totalQuestions
      const scorePercentage = examAttempt.totalQuestions > 0
        ? (examAttempt.correctAnswers / examAttempt.totalQuestions) * 100
        : (examAttempt.score ?? 0)
      userExamAttempt = {
        id: examAttempt.id,
        passed: examAttempt.passed ?? false,
        score_percentage: scorePercentage,
        submitted_at: examAttempt.completedAt?.toISOString() || '',
      }
    }

    // Fetch all exam attempts for managers
    if (isManager) {
      const attempts = await prisma.examAttempt.findMany({
        where: {
          activityId: activity.id,
          completedAt: { not: null },
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { completedAt: 'desc' },
      })
      allExamAttempts = attempts.map((a) => {
        const scorePercentage = a.totalQuestions > 0
          ? (a.correctAnswers / a.totalQuestions) * 100
          : (a.score ?? 0)
        return {
          id: a.id,
          passed: a.passed ?? false,
          score_percentage: scorePercentage,
          submitted_at: a.completedAt?.toISOString() || '',
          student_id: a.user.id,
          student_name: `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || 'Unknown',
          student_email: a.user.email || '',
        }
      })
    }
  }

  if (mode === ActivityModes.INQUIRY) {
    // Fetch user's inquiry attempt
    const inquiryAttempt = await prisma.inquiryAttempt.findFirst({
      where: {
        activityId: activity.id,
        userId: session.user.id,
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
    })
    if (inquiryAttempt) {
      // Determine pass status based on questionsGenerated vs questionsRequired
      const passed = inquiryAttempt.questionsGenerated >= inquiryAttempt.questionsRequired
      userInquiryAttempt = {
        id: inquiryAttempt.id,
        passed,
        submitted_at: inquiryAttempt.completedAt?.toISOString() || '',
      }
    }
  }

  if (mode === ActivityModes.CASE) {
    // Case settings are stored in activity.openModeSettings or a separate JSON structure
    // Check if there's case-specific settings in the activity
    const activityCaseSettings = activity.openModeSettings as Record<string, unknown> | null
    if (activityCaseSettings) {
      caseConfig = {
        num_cases_to_show: activityCaseSettings.num_cases_to_show as number | undefined,
        time_per_case: activityCaseSettings.time_per_case as number | undefined,
        pass_threshold: activityCaseSettings.pass_threshold as number | undefined,
        difficulty_level: activityCaseSettings.difficulty_level as string | undefined,
        is_finalized: activityCaseSettings.is_finalized as boolean | undefined ?? true,
        max_attempts: activityCaseSettings.max_attempts as number | undefined,
      }
    } else {
      // Default case config
      caseConfig = {
        num_cases_to_show: 3,
        pass_threshold: 7,
        is_finalized: true,
        max_attempts: 3,
      }
    }

    // Fetch user's case attempts
    const caseAttempts = await prisma.caseAttempt.findMany({
      where: {
        activityId: activity.id,
        userId: session.user.id,
      },
      orderBy: { completedAt: 'desc' },
    })

    const completedAttempt = caseAttempts.find((a) => a.completedAt)
    if (completedAttempt) {
      userCaseAttempt = {
        id: completedAttempt.id,
        passed: completedAttempt.passed ?? false,
        submitted_at: completedAttempt.completedAt?.toISOString() || '',
      }
    }

    // Calculate remaining attempts
    const maxAttempts = caseConfig?.max_attempts || 1
    const attemptCount = caseAttempts.filter((a) => a.completedAt).length
    caseAttemptsRemaining = Math.max(0, maxAttempts - attemptCount)
    canRetakeCase = caseAttemptsRemaining > 0 && !!completedAttempt
  }

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
        {/* Activity Stats Card */}
        <div className="mb-8">
          <ActivityStatsCard
            questionCount={activity._count.questions}
            memberCount={activity.owningGroup._count.members}
            likeCount={activity.numberOfLikes}
            isPrivate={activity.owningGroup.isPrivate}
          />
        </div>

        {/* Mode-specific Info Card (Full Width) */}
        {mode === ActivityModes.EXAM && (
          <div className="mb-8">
            <ExamModeCard
              activityId={activity.id}
              activityName={activity.name}
              examSettings={activity.examSettings as Record<string, unknown> | undefined}
              userAttempt={userExamAttempt}
              isCreatorOrAdmin={isManager}
              isPublished={true}
              examAttempts={allExamAttempts}
            />
          </div>
        )}

        {mode === ActivityModes.INQUIRY && (
          <div className="mb-8">
            <InquiryModeCard
              activityId={activity.id}
              activityName={activity.name}
              inquirySettings={activity.inquirySettings as Record<string, unknown> | undefined}
              userAttempt={userInquiryAttempt}
              isCreatorOrAdmin={isManager}
            />
          </div>
        )}

        {mode === ActivityModes.CASE && (
          <div className="mb-8">
            <CaseModeCard
              activityId={activity.id}
              activityName={activity.name}
              caseConfig={caseConfig ?? undefined}
              userAttempt={userCaseAttempt}
              isCreatorOrAdmin={isManager}
              attemptsRemaining={caseAttemptsRemaining}
              canRetake={canRetakeCase}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Questions (Open Mode only shows questions) */}
          <div className="lg:col-span-2">
            {mode === ActivityModes.OPEN ? (
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
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                  About This Activity
                </h2>
                <div className="prose prose-sm max-w-none">
                  {activity.description ? (
                    <p className="text-gray-600 whitespace-pre-wrap">{activity.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided.</p>
                  )}
                </div>

                {/* Show custom instructions if available */}
                {mode === ActivityModes.EXAM && activity.examSettings && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">
                      <i className="fas fa-clipboard-list mr-2"></i>Exam Instructions
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>Answer all questions to the best of your ability</li>
                      <li>You can navigate between questions during the exam</li>
                      <li>Make sure to submit before time runs out</li>
                    </ul>
                  </div>
                )}

                {mode === ActivityModes.INQUIRY && activity.inquirySettings && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-medium text-purple-900 mb-2">
                      <i className="fas fa-lightbulb mr-2"></i>Inquiry Guidelines
                    </h3>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>Use the provided keywords to generate questions</li>
                      <li>Focus on higher-order thinking (Bloom&apos;s Taxonomy)</li>
                      <li>Quality is more important than quantity</li>
                    </ul>
                  </div>
                )}

                {mode === ActivityModes.CASE && caseConfig && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-medium text-green-900 mb-2">
                      <i className="fas fa-briefcase mr-2"></i>Case Study Guidelines
                    </h3>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>Read each scenario carefully before answering</li>
                      <li>Identify the key issues and propose solutions</li>
                      <li>Consider real-world implications of your answers</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
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
