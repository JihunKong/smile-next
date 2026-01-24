import type { GroupRole, GroupUserWithUser, GroupDetail, GroupWithMembership } from '@/types/groups'

/**
 * Props for MemberCard component
 */
export interface MemberCardProps {
    member: GroupUserWithUser & { isSuspended?: boolean }
    currentUserRole: GroupRole | null | undefined
    isActionLoading?: boolean
    onRoleChange?: (newRole: number) => void
    onRemove?: () => void
    onSuspend?: (suspend: boolean) => void
}

/**
 * Props for MemberList component
 */
export interface MemberListProps {
    members: (GroupUserWithUser & { isSuspended?: boolean })[]
    currentUserRole?: GroupRole | null
    showActions?: boolean
    isLoading?: boolean
    actionLoadingId?: string | null
    onRoleChange?: (userId: string, newRole: number) => void
    onRemove?: (userId: string) => void
    onSuspend?: (userId: string, suspend: boolean) => void
}

/**
 * Props for MemberActions component
 */
export interface MemberActionsProps {
    member: GroupUserWithUser & { isSuspended?: boolean }
    currentUserRole: GroupRole | null | undefined
    isLoading?: boolean
    onRoleChange?: (newRole: number) => void
    onRemove?: () => void
    onSuspend?: (suspend: boolean) => void
}

/**
 * Props for GroupHeader component
 */
export interface GroupHeaderProps {
    group: {
        id: string
        name: string
        description: string | null
        isPrivate: boolean
        groupImageUrl: string | null
        autoIconGradient: string | null
    }
    userRole?: GroupRole | null
    onDuplicate?: () => void
}

/**
 * Props for GroupStats component
 */
export interface GroupStatsProps {
    memberCount: number
    activityCount: number
    questionCount?: number
    likesCount?: number
}

/**
 * Props for InviteLink component
 */
export interface InviteLinkProps {
    groupId: string
    inviteCode: string | null
    canRegenerate?: boolean
    onRegenerate?: () => Promise<void>
}

/**
 * Props for GroupForm component
 */
export interface GroupFormProps {
    mode: 'create' | 'edit'
    groupId?: string
    initialData?: Partial<GroupFormData>
    onCancel?: () => void
}

/**
 * Form data for group create/edit
 */
export interface GroupFormData {
    name: string
    description: string
    isPrivate: boolean
    requirePasscode: boolean
    passcode: string
    groupImageUrl: string | null
    autoIconGradient: string | null
}

// Note: Hook return types (UseGroupReturn, UseGroupMembersReturn, UseGroupsReturn)
// are exported directly from their respective hook files in ./hooks/

// Re-export base types for convenience
export type {
    GroupRole,
    GroupAction,
    GroupUserWithUser,
    GroupDetail,
    GroupWithMembership,
    CreateGroupData,
    UpdateGroupData,
} from '@/types/groups'

