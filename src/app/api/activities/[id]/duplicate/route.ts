import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const duplicateSchema = z.object({
  targetGroupId: z.string().min(1, 'Target group is required'),
  newName: z.string().min(1, 'New name is required').max(200, 'Name is too long'),
  includeQuestions: z.boolean().default(true),
})

/**
 * POST /api/activities/[id]/duplicate
 * Duplicate an activity to another group
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: activityId } = await params
    const body = await request.json()
    const result = duplicateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { targetGroupId, newName, includeQuestions } = result.data

    // Get the source activity
    const sourceActivity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        owningGroup: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        questions: includeQuestions
          ? {
              where: { isDeleted: false },
              select: {
                content: true,
                isAnonymous: true,
                questionEvaluationScore: true,
              },
            }
          : false,
      },
    })

    if (!sourceActivity) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      )
    }

    // Check if user has access to source activity
    if (!sourceActivity.owningGroup.members.length) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this activity' },
        { status: 403 }
      )
    }

    // Check target group permissions
    const targetMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: targetGroupId,
        },
      },
    })

    if (!targetMembership) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of the target group' },
        { status: 403 }
      )
    }

    if (targetMembership.role < 1) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to create activities in the target group' },
        { status: 403 }
      )
    }

    // Create the duplicated activity
    const newActivity = await prisma.activity.create({
      data: {
        name: newName,
        description: sourceActivity.description,
        creatorId: session.user.id,
        owningGroupId: targetGroupId,
        mode: sourceActivity.mode,
        activityType: sourceActivity.activityType,
        aiRatingEnabled: sourceActivity.aiRatingEnabled,
        isAnonymousAuthorAllowed: sourceActivity.isAnonymousAuthorAllowed,
        hideUsernames: sourceActivity.hideUsernames,
        visible: false, // Start as unpublished
        examSettings: sourceActivity.examSettings ?? undefined,
        inquirySettings: sourceActivity.inquirySettings ?? undefined,
        openModeSettings: sourceActivity.openModeSettings ?? undefined,
        educationLevel: sourceActivity.educationLevel,
        topic: sourceActivity.topic,
      },
    })

    // Duplicate questions if requested
    let questionCount = 0
    if (includeQuestions && sourceActivity.questions && sourceActivity.questions.length > 0) {
      await prisma.question.createMany({
        data: sourceActivity.questions.map((q) => ({
          content: q.content,
          creatorId: session.user.id,
          activityId: newActivity.id,
          isAnonymous: q.isAnonymous,
          questionEvaluationScore: q.questionEvaluationScore,
        })),
      })
      questionCount = sourceActivity.questions.length

      // Update question count on activity
      await prisma.activity.update({
        where: { id: newActivity.id },
        data: { numberOfQuestions: questionCount },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        activityId: newActivity.id,
        questionCount,
      },
    })
  } catch (error) {
    console.error('Failed to duplicate activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate activity. Please try again.' },
      { status: 500 }
    )
  }
}
