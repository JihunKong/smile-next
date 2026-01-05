'use client'

import { getRoleLabel, getRoleBadgeColor } from '@/lib/groups/utils'
import { GroupRoles, type GroupRole, type GroupUserWithUser } from '@/types/groups'

interface MemberListProps {
  members: GroupUserWithUser[]
  currentUserRole?: GroupRole | null
  showActions?: boolean
  limit?: number
  onRoleChange?: (userId: string, newRole: number) => void
  onRemove?: (userId: string) => void
}

export function MemberList({
  members,
  currentUserRole,
  showActions = false,
  limit,
  onRoleChange,
  onRemove,
}: MemberListProps) {
  const displayMembers = limit ? members.slice(0, limit) : members

  if (members.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No members yet
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100">
      {displayMembers.map((member) => (
        <li key={member.id} className="py-3 flex items-center gap-3">
          {/* Avatar */}
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {member.user.firstName} {member.user.lastName}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role as GroupRole)}`}>
                {getRoleLabel(member.role as GroupRole)}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              @{member.user.username || 'unknown'}
            </p>
          </div>

          {/* Actions */}
          {showActions && currentUserRole !== null && currentUserRole !== undefined && member.role < currentUserRole && (
            <div className="flex items-center gap-1">
              {/* Promote Button */}
              {member.role < GroupRoles.CO_OWNER && currentUserRole >= GroupRoles.CO_OWNER && (
                <button
                  onClick={() => onRoleChange?.(member.userId, member.role + 1)}
                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                  title={`Promote to ${getRoleLabel((member.role + 1) as GroupRole)}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}

              {/* Demote Button */}
              {member.role > GroupRoles.MEMBER && member.role < GroupRoles.OWNER && currentUserRole >= GroupRoles.CO_OWNER && (
                <button
                  onClick={() => onRoleChange?.(member.userId, member.role - 1)}
                  className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                  title={`Demote to ${getRoleLabel((member.role - 1) as GroupRole)}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {/* Remove Button */}
              {member.role !== GroupRoles.OWNER && (
                <button
                  onClick={() => onRemove?.(member.userId)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Remove from group"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
