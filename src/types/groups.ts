import type { Group, GroupUser, User } from '@prisma/client'

// Role constants
export const GroupRoles = {
  MEMBER: 0,
  ADMIN: 1,
  CO_OWNER: 2,
  OWNER: 3,
} as const

export type GroupRole = (typeof GroupRoles)[keyof typeof GroupRoles]

// Role labels
export const GroupRoleLabels: Record<GroupRole, string> = {
  [GroupRoles.MEMBER]: 'Member',
  [GroupRoles.ADMIN]: 'Admin',
  [GroupRoles.CO_OWNER]: 'Co-Owner',
  [GroupRoles.OWNER]: 'Owner',
}

// Form data types
export interface CreateGroupData {
  name: string
  description?: string
  isPrivate: boolean
  requirePasscode: boolean
  passcode?: string
  groupType?: 'StudentPaced' | 'InstructorPaced'
}

export interface UpdateGroupData {
  name?: string
  description?: string
  isPrivate?: boolean
  requirePasscode?: boolean
  passcode?: string
}

// Response types with relations
export type GroupWithCreator = Group & {
  creator: Pick<User, 'id' | 'firstName' | 'lastName' | 'username' | 'avatarUrl'>
  _count: { members: number; activities: number }
}

export type GroupWithMembership = GroupWithCreator & {
  userRole?: GroupRole | null
  isMember: boolean
}

export type GroupUserWithUser = GroupUser & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'username' | 'avatarUrl' | 'email'>
}

export type GroupDetail = Group & {
  creator: Pick<User, 'id' | 'firstName' | 'lastName' | 'username' | 'avatarUrl'>
  members: GroupUserWithUser[]
  _count: { activities: number }
}

// Action result types
export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export interface CreateGroupResult extends ActionResult {
  data?: { groupId: string }
}

// Permission actions
export type GroupAction =
  | 'view'
  | 'edit'
  | 'delete'
  | 'invite'
  | 'manageMember'
  | 'changeRole'
  | 'removeMember'
