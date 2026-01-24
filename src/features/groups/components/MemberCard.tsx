'use client'

import { getRoleLabel, getRoleBadgeColor } from '@/lib/groups/utils'
import type { GroupRole, GroupUserWithUser } from '@/types/groups'
import { MemberActions } from './MemberActions'

interface MemberCardProps {
    member: GroupUserWithUser & { isSuspended?: boolean }
    currentUserRole: GroupRole | null | undefined
    isActionLoading?: boolean
    onRoleChange?: (newRole: number) => void
    onRemove?: () => void
    onSuspend?: (suspend: boolean) => void
}

export function MemberCard({
    member,
    currentUserRole,
    isActionLoading = false,
    onRoleChange,
    onRemove,
    onSuspend,
}: MemberCardProps) {
    const initials = `${member.user.firstName?.[0] || ''}${member.user.lastName?.[0] || ''}`

    return (
        <div className={`flex items-center gap-4 p-4 bg-white rounded-lg border ${member.isSuspended ? 'opacity-60 border-yellow-200' : 'border-gray-100'
            }`}>
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {member.user.avatarUrl ? (
                    <img
                        src={member.user.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-gray-600 font-medium">{initials || '?'}</span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 truncate">
                        {member.user.firstName} {member.user.lastName}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role as GroupRole)
                        }`}>
                        {getRoleLabel(member.role as GroupRole)}
                    </span>
                    {member.isSuspended && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Suspended
                        </span>
                    )}
                </div>
                {member.user.username && (
                    <p className="text-sm text-gray-500 truncate">@{member.user.username}</p>
                )}
                {member.user.email && (
                    <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                )}
            </div>

            {/* Actions */}
            <MemberActions
                member={member}
                currentUserRole={currentUserRole}
                isLoading={isActionLoading}
                onRoleChange={onRoleChange}
                onRemove={onRemove}
                onSuspend={onSuspend}
            />
        </div>
    )
}
