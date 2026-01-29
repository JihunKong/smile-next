'use client'

import { getRoleLabel, getRoleBadgeColor } from '@/lib/groups/utils'
import type { GroupRole } from '@/types/groups'
import { GroupRoles } from '@/types/groups'

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

interface MembersTableProps {
  members: Member[]
  currentUserRole: GroupRole | null
  onRoleChange: (memberId: string, userId: string, newRole: number) => void
  onSuspend: (userId: string, suspend: boolean) => void
  onRemoveClick: (member: Member) => void
}

export function MembersTable({
  members,
  currentUserRole,
  onRoleChange,
  onSuspend,
  onRemoveClick,
}: MembersTableProps) {
  if (members.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>No members found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => {
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
                        <img src={member.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <>{member.user.firstName?.[0] || ''}{member.user.lastName?.[0] || ''}</>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.user.firstName} {member.user.lastName}</p>
                      <p className="text-xs text-gray-500">{member.user.email || `@${member.user.username || 'unknown'}`}</p>
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
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Suspended</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canPromote && (
                      <button
                        onClick={() => onRoleChange(member.id, member.userId, member.role + 1)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition"
                        title={`Promote to ${getRoleLabel((member.role + 1) as GroupRole)}`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {canDemote && (
                      <button
                        onClick={() => onRoleChange(member.id, member.userId, member.role - 1)}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition"
                        title={`Demote to ${getRoleLabel((member.role - 1) as GroupRole)}`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    {canModify && (
                      <button
                        onClick={() => onSuspend(member.userId, !member.isSuspended)}
                        className={`p-1.5 rounded transition ${member.isSuspended ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'}`}
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
                    {canRemove && (
                      <button
                        onClick={() => onRemoveClick(member)}
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
    </div>
  )
}
