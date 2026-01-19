'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { GroupRoles, type GroupRole } from '@/types/groups'
import { getRoleLabel, getRoleBadgeColor, getGradientColors, getGroupInitials, canManageGroup, canChangeUserRole } from '@/lib/groups/utils'
import { LoadingState } from '@/components/ui'

interface Member {
  id: string
  userId: string
  role: number
  joinedAt: string
  isSuspended: boolean
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    email: string | null
    avatarUrl: string | null
  }
}

interface GroupData {
  id: string
  name: string
  autoIconGradient: string | null
  groupImageUrl: string | null
}

export default function GroupMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [group, setGroup] = useState<GroupData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<GroupRole | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all')

  // Modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (session) {
      loadMembers()
    }
  }, [session, groupId])

  async function loadMembers() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/groups/${groupId}/members`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/groups')
          return
        }
        throw new Error('Failed to load members')
      }

      const data = await res.json()
      setGroup(data.group)
      setMembers(data.members)
      setCurrentUserRole(data.currentUserRole as GroupRole)

      // Check permissions
      if (!canManageGroup(data.currentUserRole as GroupRole, 'manageMember')) {
        router.push(`/groups/${groupId}`)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(memberId: string, userId: string, newRole: number) {
    try {
      setError(null)
      const res = await fetch(`/api/groups/${groupId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )
      setSuccess(`Role updated successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return

    setRemoving(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberToRemove.userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      // Update local state
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id))
      setShowRemoveModal(false)
      setMemberToRemove(null)
      setSuccess('Member removed successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setRemoving(false)
    }
  }

  async function handleSuspendMember(userId: string, suspend: boolean) {
    try {
      setError(null)
      const res = await fetch(`/api/groups/${groupId}/members/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update member status')
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, isSuspended: suspend } : m))
      )
      setSuccess(suspend ? 'Member suspended' : 'Member unsuspended')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member status')
    }
  }

  // Filter members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchQuery === '' ||
      `${member.user.firstName} ${member.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.username?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || member.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Group members by role
  const membersByRole = {
    owners: filteredMembers.filter((m) => m.role === GroupRoles.OWNER),
    coOwners: filteredMembers.filter((m) => m.role === GroupRoles.CO_OWNER),
    admins: filteredMembers.filter((m) => m.role === GroupRoles.ADMIN),
    members: filteredMembers.filter((m) => m.role === GroupRoles.MEMBER),
  }

  if (loading) {
    return (
      <LoadingState fullPage message="Loading members..." />
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Group not found</p>
          <Link href="/groups" className="text-indigo-600 hover:underline mt-2 inline-block">
            Back to Groups
          </Link>
        </div>
      </div>
    )
  }

  const gradientIndex = parseInt(group.autoIconGradient || '0') || 0
  const gradient = getGradientColors(gradientIndex)
  const initials = getGroupInitials(group.name)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section
        className="relative py-8 px-4 text-white"
        style={{
          background: group.groupImageUrl
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${group.groupImageUrl}) center/cover`
            : `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <Link
            href={`/groups/${groupId}`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Group
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manage Members</h1>
              <p className="text-white/80">{group.name} - {members.length} members</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              >
                <option value="all">All Roles</option>
                <option value={GroupRoles.OWNER}>Owner</option>
                <option value={GroupRoles.CO_OWNER}>Co-Owner</option>
                <option value={GroupRoles.ADMIN}>Admin</option>
                <option value={GroupRoles.MEMBER}>Member</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No members found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => {
                  const canModify = currentUserRole !== null && member.role < currentUserRole
                  const canPromote = canModify && member.role < GroupRoles.CO_OWNER && currentUserRole >= GroupRoles.CO_OWNER
                  const canDemote = canModify && member.role > GroupRoles.MEMBER && member.role < GroupRoles.OWNER
                  const canRemove = canModify && member.role !== GroupRoles.OWNER

                  return (
                    <tr key={member.id} className={member.isSuspended ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium text-sm flex-shrink-0">
                            {member.user.avatarUrl ? (
                              <img
                                src={member.user.avatarUrl}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <>
                                {member.user.firstName?.[0] || ''}
                                {member.user.lastName?.[0] || ''}
                              </>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.user.email || `@${member.user.username || 'unknown'}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role as GroupRole)}`}>
                          {getRoleLabel(member.role as GroupRole)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.isSuspended ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Promote Button */}
                          {canPromote && (
                            <button
                              onClick={() => handleRoleChange(member.id, member.userId, member.role + 1)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                              title={`Promote to ${getRoleLabel((member.role + 1) as GroupRole)}`}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                          )}

                          {/* Demote Button */}
                          {canDemote && (
                            <button
                              onClick={() => handleRoleChange(member.id, member.userId, member.role - 1)}
                              className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition"
                              title={`Demote to ${getRoleLabel((member.role - 1) as GroupRole)}`}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}

                          {/* Suspend/Unsuspend Button */}
                          {canModify && (
                            <button
                              onClick={() => handleSuspendMember(member.userId, !member.isSuspended)}
                              className={`p-1.5 rounded transition ${
                                member.isSuspended
                                  ? 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                  : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                              }`}
                              title={member.isSuspended ? 'Unsuspend' : 'Suspend'}
                            >
                              {member.isSuspended ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Remove Button */}
                          {canRemove && (
                            <button
                              onClick={() => {
                                setMemberToRemove(member)
                                setShowRemoveModal(true)
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Remove from group"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{membersByRole.owners.length}</p>
            <p className="text-sm text-gray-500">Owners</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{membersByRole.coOwners.length}</p>
            <p className="text-sm text-gray-500">Co-Owners</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{membersByRole.admins.length}</p>
            <p className="text-sm text-gray-500">Admins</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{membersByRole.members.length}</p>
            <p className="text-sm text-gray-500">Members</p>
          </div>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveModal && memberToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Remove Member</h3>
              <p className="text-gray-600 mt-2">
                Are you sure you want to remove{' '}
                <strong>
                  {memberToRemove.user.firstName} {memberToRemove.user.lastName}
                </strong>{' '}
                from this group?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemoveModal(false)
                  setMemberToRemove(null)
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={removing}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                {removing ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
