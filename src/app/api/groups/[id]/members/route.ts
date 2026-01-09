import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { type GroupRole } from '@/types/groups'
import { canManageGroup } from '@/lib/groups/utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is a member and has permission
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: id,
        },
      },
    })

    if (!membership || !canManageGroup(membership.role as GroupRole, 'manageMember')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get group info
    const group = await prisma.group.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        name: true,
        autoIconGradient: true,
        groupImageUrl: true,
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get all members
    const members = await prisma.groupUser.findMany({
      where: { groupId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ role: 'desc' }, { joinedAt: 'asc' }],
    })

    return NextResponse.json({
      group,
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        isSuspended: m.isSuspended || false,
        user: m.user,
      })),
      currentUserRole: membership.role,
    })
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}
