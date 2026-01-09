import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { GroupRoles, type GroupRole } from '@/types/groups'
import { canManageGroup } from '@/lib/groups/utils'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, userId: targetUserId } = await params

    // Get actor's membership
    const actorMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    if (!actorMembership || !canManageGroup(actorMembership.role as GroupRole, 'removeMember')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
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
      return NextResponse.json({ error: 'Target user is not a member of this group' }, { status: 404 })
    }

    // Can't remove owner
    if (targetMembership.role === GroupRoles.OWNER) {
      return NextResponse.json({ error: 'Cannot remove the group owner' }, { status: 403 })
    }

    // Can only remove users with lower role
    if (actorMembership.role <= targetMembership.role) {
      return NextResponse.json({ error: 'You can only remove members with lower roles' }, { status: 403 })
    }

    await prisma.groupUser.delete({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
