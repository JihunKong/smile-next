import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const saveSchema = z.object({
  activityId: z.string().min(1, 'Activity ID is required'),
  questions: z.array(
    z.object({
      content: z.string().min(1),
      bloomsLevel: z.string().optional(),
      qualityScore: z.number().optional(),
    })
  ).min(1, 'At least one question is required'),
})

/**
 * POST /api/tools/question-generator/save
 * Save generated questions to an activity
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = saveSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { activityId, questions } = result.data

    // Verify user has permission to add questions to this activity
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        owningGroup: {
          members: {
            some: {
              userId: session.user.id,
              role: { gte: 1 }, // Admin or higher
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json(
        { success: false, error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    // Create the questions
    const createdQuestions = await prisma.question.createMany({
      data: questions.map((q) => ({
        content: q.content,
        creatorId: session.user.id,
        activityId,
        isAnonymous: false,
        questionEvaluationScore: q.qualityScore,
        aiGenerated: true,
      })),
    })

    // Update activity question count
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        numberOfQuestions: {
          increment: createdQuestions.count,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        savedCount: createdQuestions.count,
        activityId,
      },
    })
  } catch (error) {
    console.error('Failed to save questions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save questions. Please try again.' },
      { status: 500 }
    )
  }
}
