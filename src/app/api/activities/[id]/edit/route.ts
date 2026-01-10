import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const activity = await prisma.activity.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        name: true,
        description: true,
        activityType: true,
        mode: true,
        level: true,
        visible: true,
        educationLevel: true,
        schoolSubject: true,
        topic: true,
        hideUsernames: true,
        isAnonymousAuthorAllowed: true,
        openModeSettings: true,
        examSettings: true,
        inquirySettings: true,
        creatorId: true,
        owningGroup: {
          select: {
            id: true,
            name: true,
            creatorId: true,
            members: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check permission: must be activity creator, group owner, or group admin
    const membership = activity.owningGroup.members[0]
    const isCreator = activity.creatorId === session.user.id
    const isGroupOwner = activity.owningGroup.creatorId === session.user.id
    const isGroupAdmin = membership && membership.role >= 2

    if (!isCreator && !isGroupOwner && !isGroupAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if there are any attempts
    const hasAttempts = await prisma.examAttempt.count({
      where: {
        activityId: id,
      },
    })

    return NextResponse.json({
      id: activity.id,
      name: activity.name,
      description: activity.description,
      activityType: activity.activityType,
      mode: activity.mode,
      level: activity.level,
      visible: activity.visible,
      educationLevel: activity.educationLevel,
      schoolSubject: activity.schoolSubject,
      topic: activity.topic,
      hideUsernames: activity.hideUsernames,
      isAnonymousAuthorAllowed: activity.isAnonymousAuthorAllowed,
      openModeSettings: activity.openModeSettings,
      examSettings: activity.examSettings,
      inquirySettings: activity.inquirySettings,
      owningGroup: {
        id: activity.owningGroup.id,
        name: activity.owningGroup.name,
      },
      hasQuestions: activity._count.questions > 0,
      hasAttempts: hasAttempts > 0,
    })
  } catch (error) {
    console.error('Failed to fetch activity for edit:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check permission
    const activity = await prisma.activity.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        creatorId: true,
        mode: true,
        owningGroup: {
          select: {
            creatorId: true,
            members: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const membership = activity.owningGroup.members[0]
    const isCreator = activity.creatorId === session.user.id
    const isGroupOwner = activity.owningGroup.creatorId === session.user.id
    const isGroupAdmin = membership && membership.role >= 2

    if (!isCreator && !isGroupOwner && !isGroupAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()

    // Build update data
    const updateData: Record<string, unknown> = {}

    // Basic fields
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.level !== undefined) updateData.level = body.level
    if (body.visible !== undefined) updateData.visible = body.visible
    if (body.educationLevel !== undefined) updateData.educationLevel = body.educationLevel
    if (body.schoolSubject !== undefined) updateData.schoolSubject = body.schoolSubject
    if (body.topic !== undefined) updateData.topic = body.topic
    if (body.hideUsernames !== undefined) updateData.hideUsernames = body.hideUsernames
    if (body.isAnonymousAuthorAllowed !== undefined) {
      updateData.isAnonymousAuthorAllowed = body.isAnonymousAuthorAllowed
    }

    // Mode-specific settings
    if (activity.mode === 0 && body.openModeSettings) {
      updateData.openModeSettings = body.openModeSettings
    }
    if (activity.mode === 1 && body.examSettings) {
      updateData.examSettings = body.examSettings
    }
    if (activity.mode === 2 && body.inquirySettings) {
      updateData.inquirySettings = body.inquirySettings
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
      },
    })

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
    })
  } catch (error) {
    console.error('Failed to update activity:', error)
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 })
  }
}
