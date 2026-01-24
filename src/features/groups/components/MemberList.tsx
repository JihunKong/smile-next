'use client'

import type { GroupRole, GroupUserWithUser } from '@/types/groups'
import { MemberCard } from './MemberCard'

interface MemberListProps {
    members: (GroupUserWithUser & { isSuspended?: boolean })[]
    currentUserRole?: GroupRole | null
    showActions?: boolean
    isLoading?: boolean
    actionLoadingId?: string | null
    onRoleChange?: (userId: string, newRole: number) => void
    onRemove?: (userId: string) => void
    onSuspend?: (userId: string, suspend: boolean) => void
}

export function MemberList({
    members,
    currentUserRole,
    showActions = true,
    isLoading = false,
    actionLoadingId,
    onRoleChange,
    onRemove,
    onSuspend,
}: MemberListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-3 bg-gray-200 rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (members.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No members found
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {members.map((member) => (
                <MemberCard
                    key={member.userId}
                    member={member}
                    currentUserRole={showActions ? currentUserRole : null}
                    isActionLoading={actionLoadingId === member.userId}
                    onRoleChange={(newRole) => onRoleChange?.(member.userId, newRole)}
                    onRemove={() => onRemove?.(member.userId)}
                    onSuspend={(suspend) => onSuspend?.(member.userId, suspend)}
                />
            ))}
        </div>
    )
}
