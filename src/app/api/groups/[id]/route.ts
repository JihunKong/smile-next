import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { GroupRoles, type GroupRole } from '@/types/groups'
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

    const group = await prisma.group.findUnique({
      where: { id, isDeleted: false },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        members: {
          where: { userId: session.user.id },
          select: { role: true },
        },
        _count: {
          select: {
            members: true,
            activities: { where: { isDeleted: false } },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const membership = group.members[0] || null

    // Non-members can only view public groups
    if (!membership && group.isPrivate) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        isPrivate: group.isPrivate,
        requirePasscode: group.requirePasscode,
        passcode: membership && canManageGroup(membership.role as GroupRole, 'edit') ? group.passcode : null,
        inviteCode: membership && canManageGroup(membership.role as GroupRole, 'invite') ? group.inviteCode : null,
        autoIconGradient: group.autoIconGradient,
        groupImageUrl: group.groupImageUrl,
        createdAt: group.createdAt.toISOString(),
        creator: group.creator,
        memberCount: group._count.members,
        activityCount: group._count.activities,
      },
      membership,
    })
  } catch (error) {
    console.error('Failed to fetch group:', error)
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check membership and permissions
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: id,
        },
      },
    })

    if (!membership || !canManageGroup(membership.role as GroupRole, 'edit')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { name, description, isPrivate, requirePasscode, passcode } = body

    // Validate
    if (name !== undefined && (typeof name !== 'string' || name.length < 1 || name.length > 100)) {
      return NextResponse.json({ error: 'Invalid group name' }, { status: 400 })
    }

    if (requirePasscode && (!passcode || passcode.length < 4)) {
      return NextResponse.json({ error: 'Passcode must be at least 4 characters' }, { status: 400 })
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(requirePasscode !== undefined && { requirePasscode }),
        ...(passcode !== undefined && { passcode: requirePasscode ? passcode : null }),
      },
    })

    return NextResponse.json({ success: true, group: updatedGroup })
  } catch (error) {
    console.error('Failed to update group:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check membership and permissions
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: id,
        },
      },
    })

    if (!membership || membership.role !== GroupRoles.OWNER) {
      return NextResponse.json({ error: 'Only the owner can delete this group' }, { status: 403 })
    }

    await prisma.group.update({
      where: { id },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete group:', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
