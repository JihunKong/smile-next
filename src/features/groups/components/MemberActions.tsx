'use client'

import { getRoleLabel, getRoleBadgeColor, canManageGroup } from '@/lib/groups/utils'
import { GroupRoles, type GroupRole, type GroupUserWithUser } from '@/types/groups'

interface MemberActionsProps {
    member: GroupUserWithUser & { isSuspended?: boolean }
    currentUserRole: GroupRole | null | undefined
    isLoading?: boolean
    onRoleChange?: (newRole: number) => void
    onRemove?: () => void
    onSuspend?: (suspend: boolean) => void
}

export function MemberActions({
    member,
    currentUserRole,
    isLoading = false,
    onRoleChange,
    onRemove,
    onSuspend,
}: MemberActionsProps) {
    const canChange = currentUserRole !== null &&
        currentUserRole !== undefined &&
        currentUserRole > (member.role as number)

    const canChangeRole = canManageGroup(currentUserRole, 'changeRole') && canChange
    const canRemove = canManageGroup(currentUserRole, 'removeMember') && canChange

    if (!canChangeRole && !canRemove) return null

    return (
        <div className="relative group">
            <button
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                aria-label="Member actions"
            >
                {isLoading ? (
                    <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                    </svg>
                )}
            </button>

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {canChangeRole && (
                    <>
                        {member.role !== GroupRoles.ADMIN && currentUserRole && currentUserRole > GroupRoles.ADMIN && (
                            <button
                                onClick={() => onRoleChange?.(GroupRoles.ADMIN)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Make Admin
                            </button>
                        )}
                        {member.role !== GroupRoles.MEMBER && (
                            <button
                                onClick={() => onRoleChange?.(GroupRoles.MEMBER)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Make Member
                            </button>
                        )}
                        {member.role !== GroupRoles.CO_OWNER && currentUserRole === GroupRoles.OWNER && (
                            <button
                                onClick={() => onRoleChange?.(GroupRoles.CO_OWNER)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Make Co-Owner
                            </button>
                        )}
                    </>
                )}

                {onSuspend && (
                    <button
                        onClick={() => onSuspend?.(!member.isSuspended)}
                        className="w-full px-4 py-2 text-left text-sm text-yellow-700 hover:bg-yellow-50"
                    >
                        {member.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                )}

                {canRemove && (
                    <button
                        onClick={onRemove}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                        Remove from Group
                    </button>
                )}
            </div>
        </div>
    )
}
