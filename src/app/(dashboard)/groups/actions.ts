'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { generateInviteCode, canManageGroup, canChangeUserRole } from '@/lib/groups/utils'
import { GroupRoles, type ActionResult, type CreateGroupResult, type GroupRole } from '@/types/groups'

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  isPrivate: z.boolean().default(false),
  requirePasscode: z.boolean().default(false),
  passcode: z.string().min(4, 'Passcode must be at least 4 characters').max(20).optional(),
  groupType: z.enum(['StudentPaced', 'InstructorPaced']).default('StudentPaced'),
})

/**
 * Create a new group
 */
export async function createGroup(formData: FormData): Promise<CreateGroupResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to create a group' }
  }

  const rawData = {
    name: formData.get('name') as string,
    description: formData.get('description') || undefined,
    isPrivate: formData.get('isPrivate') === 'true',
    requirePasscode: formData.get('requirePasscode') === 'true',
    passcode: formData.get('passcode') || undefined,
    groupType: formData.get('groupType') || 'StudentPaced',
  }

  const result = createGroupSchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const data = result.data

  // If passcode is required but not provided
  if (data.requirePasscode && !data.passcode) {
    return { success: false, error: 'Passcode is required when passcode protection is enabled' }
  }

  try {
    // Generate gradient index for auto-icon
    const gradientIndex = Math.floor(Math.random() * 8)

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description || null,
        isPrivate: data.isPrivate,
        requirePasscode: data.requirePasscode,
        passcode: data.passcode || null,
        groupType: data.groupType,
        creatorId: session.user.id,
        inviteCode: generateInviteCode(),
        autoIconGradient: gradientIndex.toString(),
        members: {
          create: {
            userId: session.user.id,
            role: GroupRoles.OWNER,
          },
        },
      },
    })

    revalidatePath('/groups')
    return { success: true, data: { groupId: group.id } }
  } catch (error) {
    console.error('Failed to create group:', error)
    return { success: false, error: 'Failed to create group. Please try again.' }
  }
}

/**
 * Join a group with passcode
 */
export async function joinGroupWithPasscode(
  groupId: string,
  passcode: string
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to join a group' }
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId, isDeleted: false },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!group) {
      return { success: false, error: 'Group not found' }
    }

    if (group.members.length > 0) {
      return { success: false, error: 'You are already a member of this group' }
    }

    if (group.requirePasscode && group.passcode !== passcode) {
      return { success: false, error: 'Invalid passcode' }
    }

    await prisma.groupUser.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: GroupRoles.MEMBER,
      },
    })

    revalidatePath('/groups')
    revalidatePath(`/groups/${groupId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to join group:', error)
    return { success: false, error: 'Failed to join group. Please try again.' }
  }
}

/**
 * Join a group with invite code
 */
export async function joinGroupWithInviteCode(inviteCode: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to join a group' }
  }

  try {
    const group = await prisma.group.findUnique({
      where: { inviteCode, isDeleted: false },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!group) {
      return { success: false, error: 'Invalid invite code' }
    }

    if (group.members.length > 0) {
      return { success: false, error: 'You are already a member of this group' }
    }

    await prisma.groupUser.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: GroupRoles.MEMBER,
      },
    })

    revalidatePath('/groups')
    revalidatePath(`/groups/${group.id}`)
    return { success: true, data: { groupId: group.id } }
  } catch (error) {
    console.error('Failed to join group:', error)
    return { success: false, error: 'Failed to join group. Please try again.' }
  }
}

/**
 * Leave a group
 */
export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    if (!membership) {
      return { success: false, error: 'You are not a member of this group' }
    }

    if (membership.role === GroupRoles.OWNER) {
      return { success: false, error: 'Owners cannot leave the group. Transfer ownership first.' }
    }

    await prisma.groupUser.delete({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    revalidatePath('/groups')
    revalidatePath(`/groups/${groupId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to leave group:', error)
    return { success: false, error: 'Failed to leave group. Please try again.' }
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  groupId: string,
  targetUserId: string,
  newRole: number
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    // Get actor's membership
    const actorMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    if (!actorMembership) {
      return { success: false, error: 'You are not a member of this group' }
    }

    // Get target's membership
    const targetMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    })

    if (!targetMembership) {
      return { success: false, error: 'Target user is not a member of this group' }
    }

    // Check permissions
    if (!canChangeUserRole(actorMembership.role as GroupRole, targetMembership.role as GroupRole, newRole as GroupRole)) {
      return { success: false, error: 'You do not have permission to make this change' }
    }

    await prisma.groupUser.update({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
      data: { role: newRole },
    })

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update member role:', error)
    return { success: false, error: 'Failed to update role. Please try again.' }
  }
}

/**
 * Remove a member from group
 */
export async function removeMember(groupId: string, targetUserId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    // Get actor's membership
    const actorMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    if (!actorMembership) {
      return { success: false, error: 'You are not a member of this group' }
    }

    // Get target's membership
    const targetMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    })

    if (!targetMembership) {
      return { success: false, error: 'Target user is not a member of this group' }
    }

    // Can't remove owner
    if (targetMembership.role === GroupRoles.OWNER) {
      return { success: false, error: 'Cannot remove the group owner' }
    }

    // Check permissions
    if (!canManageGroup(actorMembership.role as GroupRole, 'removeMember')) {
      return { success: false, error: 'You do not have permission to remove members' }
    }

    // Can only remove users with lower role
    if (actorMembership.role <= targetMembership.role) {
      return { success: false, error: 'You can only remove members with lower roles' }
    }

    await prisma.groupUser.delete({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    })

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to remove member:', error)
    return { success: false, error: 'Failed to remove member. Please try again.' }
  }
}

/**
 * Regenerate invite code for a group
 */
export async function regenerateInviteCode(groupId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    if (!membership || !canManageGroup(membership.role as GroupRole, 'invite')) {
      return { success: false, error: 'You do not have permission to regenerate invite code' }
    }

    const newCode = generateInviteCode()
    await prisma.group.update({
      where: { id: groupId },
      data: { inviteCode: newCode },
    })

    revalidatePath(`/groups/${groupId}`)
    return { success: true, data: { inviteCode: newCode } }
  } catch (error) {
    console.error('Failed to regenerate invite code:', error)
    return { success: false, error: 'Failed to regenerate invite code. Please try again.' }
  }
}

/**
 * Delete a group (soft delete)
 */
export async function deleteGroup(groupId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    if (!membership || membership.role !== GroupRoles.OWNER) {
      return { success: false, error: 'Only the owner can delete this group' }
    }

    await prisma.group.update({
      where: { id: groupId },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    })

    revalidatePath('/groups')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete group:', error)
    return { success: false, error: 'Failed to delete group. Please try again.' }
  }
}
