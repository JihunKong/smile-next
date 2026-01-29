'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { GroupRoles, type GroupRole } from '@/types/groups'
import { canManageGroup } from '@/lib/groups/utils'
import { LoadingState } from '@/components/ui'
import {
  MembersHeader,
  MemberFilters,
  MembersTable,
  MemberStatsGrid,
  RemoveMemberModal,
} from '@/features/groups'

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

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<number | 'all'>('all')

  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (session) loadMembers()
  }, [session, groupId])

  async function loadMembers() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/groups/${groupId}/members`)
      if (!res.ok) {
        if (res.status === 404) { router.push('/groups'); return }
        throw new Error('Failed to load members')
      }
      const data = await res.json()
      setGroup(data.group)
      setMembers(data.members)
      setCurrentUserRole(data.currentUserRole as GroupRole)
      if (!canManageGroup(data.currentUserRole as GroupRole, 'manageMember')) {
        router.push(`/groups/${groupId}`)
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
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
      setSuccess('Role updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberToRemove.userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove member')
      }
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
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, isSuspended: suspend } : m)))
      setSuccess(suspend ? 'Member suspended' : 'Member unsuspended')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member status')
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch = searchQuery === '' ||
      `${member.user.firstName} ${member.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  const membersByRole = {
    owners: filteredMembers.filter((m) => m.role === GroupRoles.OWNER),
    coOwners: filteredMembers.filter((m) => m.role === GroupRoles.CO_OWNER),
    admins: filteredMembers.filter((m) => m.role === GroupRoles.ADMIN),
    members: filteredMembers.filter((m) => m.role === GroupRoles.MEMBER),
  }

  if (loading) return <LoadingState fullPage message="Loading members..." />

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Group not found</p>
          <Link href="/groups" className="text-indigo-600 hover:underline mt-2 inline-block">Back to Groups</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MembersHeader
        groupId={groupId}
        groupName={group.name}
        memberCount={members.length}
        autoIconGradient={group.autoIconGradient}
        groupImageUrl={group.groupImageUrl}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
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

        <MemberFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
        />

        <MembersTable
          members={filteredMembers}
          currentUserRole={currentUserRole}
          onRoleChange={handleRoleChange}
          onSuspend={handleSuspendMember}
          onRemoveClick={(member) => { setMemberToRemove(member); setShowRemoveModal(true) }}
        />

        <MemberStatsGrid
          ownerCount={membersByRole.owners.length}
          coOwnerCount={membersByRole.coOwners.length}
          adminCount={membersByRole.admins.length}
          memberCount={membersByRole.members.length}
        />
      </div>

      {showRemoveModal && memberToRemove && (
        <RemoveMemberModal
          memberName={`${memberToRemove.user.firstName} ${memberToRemove.user.lastName}`}
          isRemoving={removing}
          onConfirm={handleRemoveMember}
          onCancel={() => { setShowRemoveModal(false); setMemberToRemove(null) }}
        />
      )}
    </div>
  )
}
