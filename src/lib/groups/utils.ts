import { GroupRoles, GroupRoleLabels, type GroupRole, type GroupAction } from '@/types/groups'

/**
 * Generate a unique 8-character invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars (0, O, 1, I)
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(role: GroupRole): string {
  return GroupRoleLabels[role] || 'Unknown'
}

/**
 * Get role badge color classes
 */
export function getRoleBadgeColor(role: GroupRole): string {
  switch (role) {
    case GroupRoles.OWNER:
      return 'bg-yellow-100 text-yellow-800'
    case GroupRoles.CO_OWNER:
      return 'bg-blue-100 text-blue-800'
    case GroupRoles.ADMIN:
      return 'bg-purple-100 text-purple-800'
    case GroupRoles.MEMBER:
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Check if a user with the given role can perform an action
 */
export function canManageGroup(userRole: GroupRole | null | undefined, action: GroupAction): boolean {
  if (userRole === null || userRole === undefined) return false

  switch (action) {
    case 'view':
      // All members can view
      return userRole >= GroupRoles.MEMBER

    case 'edit':
    case 'invite':
      // Co-owners and above can edit and invite
      return userRole >= GroupRoles.CO_OWNER

    case 'manageMember':
      // Admins and above can manage members
      return userRole >= GroupRoles.ADMIN

    case 'changeRole':
      // Co-owners and above can change roles
      return userRole >= GroupRoles.CO_OWNER

    case 'removeMember':
      // Admins can remove members (role 0 only), co-owners can remove anyone except owner
      return userRole >= GroupRoles.ADMIN

    case 'delete':
      // Only owner can delete
      return userRole === GroupRoles.OWNER

    default:
      return false
  }
}

/**
 * Check if user can change another user's role
 */
export function canChangeUserRole(
  actorRole: GroupRole | null | undefined,
  targetRole: GroupRole,
  newRole: GroupRole
): boolean {
  if (actorRole === null || actorRole === undefined) return false

  // Can't change owner role
  if (targetRole === GroupRoles.OWNER) return false

  // Must have higher role than target
  if (actorRole <= targetRole) return false

  // Can't promote to equal or higher than own role
  if (newRole >= actorRole) return false

  return true
}

/**
 * Format member count text
 */
export function formatMemberCount(count: number): string {
  if (count === 1) return '1 member'
  return `${count} members`
}

/**
 * Get gradient colors for auto-generated group icon
 */
export function getGradientColors(gradientIndex: number = 0): { from: string; to: string } {
  const gradients = [
    { from: '#8C1515', to: '#B83A4B' }, // Stanford Cardinal
    { from: '#2E2D29', to: '#4A4845' }, // Stanford Pine
    { from: '#4299E1', to: '#667EEA' }, // Blue
    { from: '#48BB78', to: '#38A169' }, // Green
    { from: '#ED8936', to: '#DD6B20' }, // Orange
    { from: '#9F7AEA', to: '#805AD5' }, // Purple
    { from: '#ED64A6', to: '#D53F8C' }, // Pink
    { from: '#38B2AC', to: '#319795' }, // Teal
  ]
  return gradients[gradientIndex % gradients.length]
}

/**
 * Get initials from group name for auto-generated icon
 */
export function getGroupInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}
