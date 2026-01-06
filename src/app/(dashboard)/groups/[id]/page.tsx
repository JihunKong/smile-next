import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { MemberList } from '@/components/groups/MemberList'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { LeaveGroupButton, DeleteGroupButton } from './actions-client'
import { getRoleLabel, getGradientColors, getGroupInitials } from '@/lib/groups/utils'
import { GroupRoles, type GroupRole } from '@/types/groups'

interface GroupDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const group = await prisma.group.findUnique({
    where: { id, isDeleted: false },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true, email: true },
          },
        },
        orderBy: { role: 'desc' },
      },
      _count: {
        select: {
          activities: { where: { isDeleted: false } },
        },
      },
    },
  })

  if (!group) {
    notFound()
  }

  // Fetch activities for this group
  const activities = await prisma.activity.findMany({
    where: {
      owningGroupId: id,
      isDeleted: false,
    },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
      },
      owningGroup: {
        select: { id: true, name: true, creatorId: true },
      },
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6, // Limit to 6 activities on group page
  })

  // Check if user is a member
  const currentUserMembership = group.members.find((m) => m.userId === session.user.id)
  const userRole = currentUserMembership?.role as GroupRole | undefined

  // Non-members can only view public groups
  if (!currentUserMembership && group.isPrivate) {
    notFound()
  }

  const gradientIndex = parseInt(group.autoIconGradient || '0') || 0
  const gradient = getGradientColors(gradientIndex)
  const initials = getGroupInitials(group.name)

  const canDelete = userRole === GroupRoles.OWNER

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section
        className="relative py-12 px-4 text-white"
        style={{
          background: group.groupImageUrl
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${group.groupImageUrl}) center/cover`
            : `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <Link href="/groups" className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Groups
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center text-3xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{group.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${group.isPrivate ? 'bg-white/20' : 'bg-green-500/80'}`}>
                  {group.isPrivate ? 'Private' : 'Public'}
                </span>
              </div>
              {group.description && (
                <p className="mt-2 text-white/80 max-w-2xl">{group.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
                <span>{group.members.length} members</span>
                <span>{group._count.activities} activities</span>
                <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {currentUserMembership && (
            <div className="flex items-center gap-3 mt-6">
              {userRole !== GroupRoles.OWNER && (
                <LeaveGroupButton groupId={group.id} />
              )}
              {canDelete && (
                <DeleteGroupButton groupId={group.id} groupName={group.name} />
              )}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activities Section */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Activities ({group._count.activities})
                </h2>
                {currentUserMembership && (
                  <Link
                    href={`/groups/${group.id}/activities/create`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:bg-[var(--stanford-cardinal-dark)] transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Activity
                  </Link>
                )}
              </div>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No activities yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} showGroup={false} />
                  ))}
                  {group._count.activities > 6 && (
                    <Link
                      href={`/activities?groupId=${group.id}`}
                      className="block text-center text-sm text-[var(--stanford-cardinal)] hover:underline mt-4"
                    >
                      View all {group._count.activities} activities
                    </Link>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Group Info */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Owner</span>
                  <span className="font-medium">{group.creator.firstName} {group.creator.lastName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Privacy</span>
                  <span className="font-medium">{group.isPrivate ? 'Private' : 'Public'}</span>
                </div>
                {currentUserMembership && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Your Role</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      userRole === GroupRoles.OWNER ? 'bg-yellow-100 text-yellow-800' :
                      userRole === GroupRoles.CO_OWNER ? 'bg-blue-100 text-blue-800' :
                      userRole === GroupRoles.ADMIN ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getRoleLabel(userRole!)}
                    </span>
                  </div>
                )}
                {canDelete && group.inviteCode && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500">Invite Code</span>
                    </div>
                    <code className="block px-3 py-2 bg-gray-100 rounded font-mono text-sm text-center">{group.inviteCode}</code>
                  </div>
                )}
              </div>
            </section>

            {/* Members */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Members ({group.members.length})
              </h2>
              <MemberList
                members={group.members}
                currentUserRole={userRole}
                showActions={false}
                limit={10}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
