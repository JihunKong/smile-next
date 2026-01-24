import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { QuestionList } from '@/components/activities/QuestionList'
import { DeleteActivityButton, QRCodeSection, ActionButtons } from './actions-client'
import { canManageActivity } from '@/lib/activities/utils'
import { ActivityModes, type ActivityMode } from '@/types/activities'
import { StudentProgressWidget } from '@/components/activities/StudentProgressWidget'
import { ExamModeCard, InquiryModeCard, CaseModeCard } from '@/components/activities/ModeInfoCards'
import { ActivityHeader, ActivityStats, ActivityActions } from '@/features/activities/components/ActivityDetail'

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
          _count: { select: { members: true } },
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
              id: true, bloomsLevel: true, overallScore: true, clarityScore: true,
              relevanceScore: true, creativityScore: true, evaluationText: true,
            },
          },
          _count: { select: { responses: true, likes: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { questions: true } },
    },
  })

  if (!activity || !activity.owningGroup.members[0]) {
    notFound()
  }

  const mode = activity.mode as ActivityMode
  const isManager = canManageActivity(session.user.id, activity.creatorId, activity.owningGroup.creatorId)

  // Fetch user likes
  const userLikes = await prisma.like.findMany({
    where: { userId: session.user.id, questionId: { in: activity.questions.map((q) => q.id) } },
    select: { questionId: true },
  })
  const likedQuestionIds = new Set(userLikes.map((l) => l.questionId))

  // Mode-specific data fetching
  const modeData = await fetchModeData(activity.id, session.user.id, mode, isManager)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
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

          <ActivityHeader activity={{
            id: activity.id,
            name: activity.name,
            description: activity.description,
            mode,
            createdAt: activity.createdAt,
            aiRatingEnabled: activity.aiRatingEnabled,
            creator: {
              id: activity.creator.id,
              firstName: activity.creator.firstName,
              lastName: activity.creator.lastName,
              avatarUrl: activity.creator.avatarUrl,
            },
            owningGroup: {
              id: activity.owningGroup.id,
              name: activity.owningGroup.name,
            },
            _count: { questions: activity._count.questions },
          }} />

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <ActivityActions activityId={activity.id} mode={mode} isManager={isManager} />

            {isManager && (
              <>
                <ActionButtons
                  activityId={activity.id}
                  activityName={activity.name}
                  groupId={activity.owningGroupId}
                  isManager={isManager}
                />
                <DeleteActivityButton activityId={activity.id} activityName={activity.name} />
              </>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats + QR Code Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ActivityStats
            questionCount={activity._count.questions}
            memberCount={activity.owningGroup._count.members}
            likeCount={activity.numberOfLikes}
            isPrivate={activity.owningGroup.isPrivate}
          />
          <QRCodeSection
            activityId={activity.id}
            inviteUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'https://smile.example.com'}/activities/join?code=${activity.owningGroup.inviteCode || activity.id}`}
          />
        </div>

        {/* Mode-specific Content Cards */}
        <ModeContentSection
          mode={mode}
          activity={activity}
          isManager={isManager}
          modeData={modeData}
        />

        {/* Open Mode: Student Progress + Questions */}
        {mode === ActivityModes.OPEN && (
          <>
            <div className="mb-6">
              <StudentProgressWidget activityId={activity.id} />
            </div>
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
          </>
        )}

        {/* Manager-only Details Section */}
        {isManager && (
          <ActivityDetailsSection activity={activity} />
        )}
      </div>
    </div>
  )
}

// Helper to fetch mode-specific data
async function fetchModeData(activityId: string, userId: string, mode: ActivityMode, isManager: boolean) {
  if (mode === ActivityModes.EXAM) {
    const examAttempt = await prisma.examAttempt.findFirst({
      where: { activityId, userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
    })

    let allAttempts: Array<{ id: string; passed: boolean; score_percentage: number; submitted_at: string; student_id: string; student_name: string; student_email: string }> = []
    if (isManager) {
      const attempts = await prisma.examAttempt.findMany({
        where: { activityId, completedAt: { not: null } },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { completedAt: 'desc' },
      })
      allAttempts = attempts.map((a) => ({
        id: a.id,
        passed: a.passed ?? false,
        score_percentage: a.totalQuestions > 0 ? (a.correctAnswers / a.totalQuestions) * 100 : (a.score ?? 0),
        submitted_at: a.completedAt?.toISOString() || '',
        student_id: a.user.id,
        student_name: `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || 'Unknown',
        student_email: a.user.email || '',
      }))
    }

    return {
      userExamAttempt: examAttempt ? {
        id: examAttempt.id,
        passed: examAttempt.passed ?? false,
        score_percentage: examAttempt.totalQuestions > 0 ? (examAttempt.correctAnswers / examAttempt.totalQuestions) * 100 : (examAttempt.score ?? 0),
        submitted_at: examAttempt.completedAt?.toISOString() || '',
      } : null,
      allExamAttempts: allAttempts,
    }
  }

  if (mode === ActivityModes.INQUIRY) {
    const inquiryAttempt = await prisma.inquiryAttempt.findFirst({
      where: { activityId, userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
    })
    return {
      userInquiryAttempt: inquiryAttempt ? {
        id: inquiryAttempt.id,
        passed: inquiryAttempt.questionsGenerated >= inquiryAttempt.questionsRequired,
        submitted_at: inquiryAttempt.completedAt?.toISOString() || '',
      } : null,
    }
  }

  if (mode === ActivityModes.CASE) {
    const caseAttempts = await prisma.caseAttempt.findMany({
      where: { activityId, userId },
      orderBy: { completedAt: 'desc' },
    })
    const completedAttempt = caseAttempts.find((a) => a.completedAt)
    return {
      userCaseAttempt: completedAttempt ? {
        id: completedAttempt.id,
        passed: completedAttempt.passed ?? false,
        submitted_at: completedAttempt.completedAt?.toISOString() || '',
      } : null,
      attemptsRemaining: Math.max(0, 3 - caseAttempts.filter((a) => a.completedAt).length),
      canRetake: caseAttempts.filter((a) => a.completedAt).length < 3 && !!completedAttempt,
    }
  }

  return {}
}

// Mode-specific content section component
function ModeContentSection({ mode, activity, isManager, modeData }: {
  mode: ActivityMode
  activity: { id: string; name: string; examSettings: unknown; inquirySettings: unknown; openModeSettings: unknown }
  isManager: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modeData: any
}) {
  if (mode === ActivityModes.EXAM) {
    return (
      <div className="mb-8">
        <ExamModeCard
          activityId={activity.id}
          activityName={activity.name}
          examSettings={activity.examSettings as Record<string, unknown> | undefined}
          userAttempt={modeData.userExamAttempt}
          isCreatorOrAdmin={isManager}
          isPublished={true}
          examAttempts={modeData.allExamAttempts || []}
        />
      </div>
    )
  }

  if (mode === ActivityModes.INQUIRY) {
    return (
      <div className="mb-8">
        <InquiryModeCard
          activityId={activity.id}
          activityName={activity.name}
          inquirySettings={activity.inquirySettings as Record<string, unknown> | undefined}
          userAttempt={modeData.userInquiryAttempt}
          isCreatorOrAdmin={isManager}
        />
      </div>
    )
  }

  if (mode === ActivityModes.CASE) {
    const caseConfig = (activity.openModeSettings as Record<string, unknown> | null) || {
      num_cases_to_show: 3, pass_threshold: 7, is_finalized: true, max_attempts: 3,
    }
    return (
      <div className="mb-8">
        <CaseModeCard
          activityId={activity.id}
          activityName={activity.name}
          caseConfig={caseConfig}
          userAttempt={modeData.userCaseAttempt}
          isCreatorOrAdmin={isManager}
          attemptsRemaining={modeData.attemptsRemaining ?? 0}
          canRetake={modeData.canRetake ?? false}
        />
      </div>
    )
  }

  return null
}

// Activity details section for managers
function ActivityDetailsSection({ activity }: {
  activity: {
    schoolSubject: string | null
    topic: string | null
    educationLevel: string | null
    schoolGrade: number
    aiRatingEnabled: boolean
    isAnonymousAuthorAllowed: boolean
    createdAt: Date
    owningGroup: { name: string; isPrivate: boolean; _count: { members: number } }
  }
}) {
  const getEducationLevelLabel = (level: string | null): string => {
    const labels: Record<string, string> = {
      elementary: 'Elementary School', middle: 'Middle School', high: 'High School',
      college: 'College/University', graduate: 'Graduate School', professional: 'Professional',
    }
    return level ? labels[level] || level : 'Not specified'
  }

  const getGradeLabel = (grade: number): string => {
    if (grade === -1) return 'Not specified'
    if (grade >= 1 && grade <= 12) return `Grade ${grade}`
    if (grade >= 13) return `Year ${grade - 12}`
    return `Grade ${grade}`
  }

  return (
    <details className="mt-8 bg-white rounded-lg shadow-sm">
      <summary className="p-4 cursor-pointer font-semibold text-gray-700 hover:bg-gray-50 rounded-lg">
        <i className="fas fa-cog mr-2"></i>
        Activity Details & Settings
      </summary>
      <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-3">
            <i className="fas fa-graduation-cap mr-2 text-indigo-500"></i>Academic Info
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subject</span><span>{activity.schoolSubject || 'Not specified'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Topic</span><span>{activity.topic || 'Not specified'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Level</span><span>{getEducationLevelLabel(activity.educationLevel)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Grade</span><span>{getGradeLabel(activity.schoolGrade)}</span></div>
          </div>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-3">
            <i className="fas fa-sliders-h mr-2 text-gray-500"></i>Settings
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">AI Rating</span><span>{activity.aiRatingEnabled ? 'Enabled' : 'Disabled'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Anonymous</span><span>{activity.isAnonymousAuthorAllowed ? 'Allowed' : 'Not Allowed'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(activity.createdAt).toLocaleDateString()}</span></div>
          </div>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-3">
            <i className="fas fa-users mr-2 text-blue-500"></i>Group Info
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Group</span><span>{activity.owningGroup.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Members</span><span>{activity.owningGroup._count.members}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Privacy</span><span>{activity.owningGroup.isPrivate ? 'Private' : 'Public'}</span></div>
          </div>
        </div>
      </div>
    </details>
  )
}
