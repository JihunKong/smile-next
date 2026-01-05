import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { MemberList } from '@/components/groups/MemberList'
import { LeaveGroupButton, DeleteGroupButton } from './actions-client'
import { getRoleLabel, getGradientColors, getGroupInitials, canManageGroup } from '@/lib/groups/utils'
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
        select: { activities: true },
      },
    },
  })

  if (!group) {
    notFound()
  }

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

  const canEdit = canManageGroup(userRole, 'edit')
  const canDelete = canManageGroup(userRole, 'delete')
  const canInvite = canManageGroup(userRole, 'invite')

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
              {canInvite && (
                <Link
                  href={`/groups/${group.id}/invite`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Invite Members
                </Link>
              )}
              {canEdit && (
                <Link
                  href={`/groups/${group.id}/settings`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              )}
              {userRole !== GroupRoles.OWNER && (
                <LeaveGroupButton groupId={group.id} />
              )}
              {canDelete && (
                <DeleteGroupButton groupId={group.id} groupName={group.name} />
              )}
            </div>
          )}

          {/* Non-member: Join Button */}
          {!currentUserMembership && !group.isPrivate && (
            <div className="mt-6">
              <Link
                href={`/groups/${group.id}/join`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Join This Group
              </Link>
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
                <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
                {canEdit && (
                  <Link
                    href={`/groups/${group.id}/activities/create`}
                    className="text-sm text-[var(--stanford-cardinal)] hover:underline"
                  >
                    Create Activity
                  </Link>
                )}
              </div>
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No activities yet.</p>
                {canEdit && (
                  <p className="text-sm mt-2">Create your first activity to get started!</p>
                )}
              </div>
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
                {canInvite && group.inviteCode && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-500">Invite Code</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded font-mono text-sm">{group.inviteCode}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(group.inviteCode!)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="Copy invite code"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Members */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Members ({group.members.length})
                </h2>
                {canManageGroup(userRole, 'manageMember') && (
                  <Link
                    href={`/groups/${group.id}/members`}
                    className="text-sm text-[var(--stanford-cardinal)] hover:underline"
                  >
                    Manage
                  </Link>
                )}
              </div>
              <MemberList
                members={group.members}
                currentUserRole={userRole}
                showActions={false}
                limit={5}
              />
              {group.members.length > 5 && (
                <Link
                  href={`/groups/${group.id}/members`}
                  className="block text-center text-sm text-[var(--stanford-cardinal)] hover:underline mt-4"
                >
                  View all members
                </Link>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
