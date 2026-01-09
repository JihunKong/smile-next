import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sharingCode } = body

    if (!sharingCode) {
      return NextResponse.json({ error: 'Sharing code is required' }, { status: 400 })
    }

    // Find activity by sharing code
    const activity = await prisma.activity.findFirst({
      where: {
        publicSharingCode: sharingCode,
        isDeleted: false,
        visible: true,
      },
      select: {
        id: true,
        name: true,
        owningGroupId: true,
        owningGroup: {
          select: {
            id: true,
            name: true,
            isPrivate: true,
            members: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Invalid sharing code' }, { status: 404 })
    }

    // Check if user is already a member of the group
    if (activity.owningGroup.members.length > 0) {
      return NextResponse.json({
        alreadyMember: true,
        activityId: activity.id,
        message: 'You are already a member of this group',
      })
    }

    // Join the group (activities require group membership)
    await prisma.groupUser.create({
      data: {
        userId: session.user.id,
        groupId: activity.owningGroupId,
        role: 0, // Member
      },
    })

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      groupId: activity.owningGroupId,
      message: 'Successfully joined the activity',
    })
  } catch (error) {
    console.error('Failed to join activity:', error)
    return NextResponse.json({ error: 'Failed to join activity' }, { status: 500 })
  }
}
