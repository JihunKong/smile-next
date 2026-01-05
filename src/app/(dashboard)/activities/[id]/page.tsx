import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { QuestionList } from '@/components/activities/QuestionList'
import { DeleteActivityButton } from './actions-client'
import { getModeLabel, getModeBadgeColor, canManageActivity } from '@/lib/activities/utils'
import type { ActivityMode } from '@/types/activities'

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
          <div className="flex items-center gap-3 mt-6">
            <Link
              href={`/activities/${activity.id}/questions/create`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ask a Question
            </Link>

            {isManager && (
              <DeleteActivityButton activityId={activity.id} activityName={activity.name} />
            )}
          </div>
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
                currentUserId={session.user.id}
                activityCreatorId={activity.creatorId}
                groupCreatorId={activity.owningGroup.creatorId}
                showActions={true}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity Info */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Info</h2>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
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
          </div>
        </div>
      </div>
    </div>
  )
}
