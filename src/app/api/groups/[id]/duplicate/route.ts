import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { nanoid } from 'nanoid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const body = await request.json().catch(() => ({}))
    const { includeMembersAsOwner = false, newName } = body

    // Get the original group with members and activities
    const originalGroup = await prisma.group.findUnique({
      where: { id: groupId, isDeleted: false },
      include: {
        members: {
          where: { isSuspended: false },
          select: {
            userId: true,
            role: true,
          },
        },
        activities: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            description: true,
            activityType: true,
            mode: true,
            aiRatingEnabled: true,
            ratingType: true,
            commentVisible: true,
            level: true,
            visible: true,
            examSettings: true,
            inquirySettings: true,
            openModeSettings: true,
            caseSettings: true,
            schoolGrade: true,
            educationLevel: true,
            targetAudience: true,
            schoolSubject: true,
            topic: true,
            gradeLevels: true,
            hideUsernames: true,
            hideActivities: true,
            isAnonymousAuthorAllowed: true,
          },
        },
      },
    })

    if (!originalGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is the creator or admin
    const membership = originalGroup.members.find((m) => m.userId === session.user.id)
    const isCreator = originalGroup.creatorId === session.user.id
    const isAdmin = (membership?.role ?? 0) >= 1

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'You do not have permission to duplicate this group' }, { status: 403 })
    }

    // Generate new invite code
    const inviteCode = nanoid(8)

    // Create the duplicated group
    const duplicatedGroup = await prisma.group.create({
      data: {
        name: newName || `${originalGroup.name} (Copy)`,
        description: originalGroup.description,
        creatorId: session.user.id,
        groupType: originalGroup.groupType,
        isPrivate: originalGroup.isPrivate,
        requirePasscode: originalGroup.requirePasscode,
        inviteCode,
        version: originalGroup.version,
      },
    })

    // Add the current user as owner
    await prisma.groupUser.create({
      data: {
        userId: session.user.id,
        groupId: duplicatedGroup.id,
        role: 2, // Owner
      },
    })

    // Optionally add original members (as regular members, not with their original roles)
    if (includeMembersAsOwner && isCreator) {
      const otherMembers = originalGroup.members.filter((m) => m.userId !== session.user.id)
      if (otherMembers.length > 0) {
        await prisma.groupUser.createMany({
          data: otherMembers.map((m) => ({
            userId: m.userId,
            groupId: duplicatedGroup.id,
            role: 0, // Regular member
          })),
          skipDuplicates: true,
        })
      }
    }

    // Duplicate activities (without questions - those need to be recreated)
    for (const activity of originalGroup.activities) {
      await prisma.activity.create({
        data: {
          name: activity.name,
          description: activity.description,
          creatorId: session.user.id,
          owningGroupId: duplicatedGroup.id,
          activityType: activity.activityType,
          mode: activity.mode,
          aiRatingEnabled: activity.aiRatingEnabled,
          ratingType: activity.ratingType,
          commentVisible: activity.commentVisible,
          level: activity.level,
          visible: activity.visible,
          examSettings: activity.examSettings ? JSON.parse(JSON.stringify(activity.examSettings)) : undefined,
          inquirySettings: activity.inquirySettings ? JSON.parse(JSON.stringify(activity.inquirySettings)) : undefined,
          openModeSettings: activity.openModeSettings ? JSON.parse(JSON.stringify(activity.openModeSettings)) : undefined,
          caseSettings: activity.caseSettings ? JSON.parse(JSON.stringify(activity.caseSettings)) : undefined,
          schoolGrade: activity.schoolGrade,
          educationLevel: activity.educationLevel,
          targetAudience: activity.targetAudience,
          schoolSubject: activity.schoolSubject,
          topic: activity.topic,
          gradeLevels: activity.gradeLevels ? JSON.parse(JSON.stringify(activity.gradeLevels)) : undefined,
          hideUsernames: activity.hideUsernames,
          hideActivities: activity.hideActivities,
          isAnonymousAuthorAllowed: activity.isAnonymousAuthorAllowed,
        },
      })
    }

    return NextResponse.json({
      success: true,
      group: {
        id: duplicatedGroup.id,
        name: duplicatedGroup.name,
        inviteCode: duplicatedGroup.inviteCode,
      },
      activitiesCopied: originalGroup.activities.length,
      message: `Group duplicated successfully with ${originalGroup.activities.length} activities`,
    })
  } catch (error) {
    console.error('Failed to duplicate group:', error)
    return NextResponse.json({ error: 'Failed to duplicate group' }, { status: 500 })
  }
}
