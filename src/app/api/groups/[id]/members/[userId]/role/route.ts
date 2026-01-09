import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { GroupRoles, type GroupRole } from '@/types/groups'
import { canChangeUserRole } from '@/lib/groups/utils'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, userId: targetUserId } = await params
    const body = await request.json()
    const { role: newRole } = body

    if (typeof newRole !== 'number' || newRole < 0 || newRole > GroupRoles.OWNER) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

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
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
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

    // Check permissions
    if (
      !canChangeUserRole(
        actorMembership.role as GroupRole,
        targetMembership.role as GroupRole,
        newRole as GroupRole
      )
    ) {
      return NextResponse.json({ error: 'You do not have permission to make this change' }, { status: 403 })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}
