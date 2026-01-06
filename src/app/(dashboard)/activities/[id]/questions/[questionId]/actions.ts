'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { CreateResponseResult, UpdateResponseResult, DeleteResponseResult, ToggleLikeResult } from '@/types/responses'

// Helper to queue response evaluation via API (avoids Bull import in Server Components)
async function queueResponseEvaluationViaApi(data: {
  responseId: string
  activityId: string
  userId: string
  responseContent: string
  questionContent: string
  context: {
    activityName: string
    groupName: string
  }
}): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000'
  try {
    await fetch(`${baseUrl}/api/queue/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'response', data }),
    })
  } catch (error) {
    console.warn('Failed to queue response evaluation via API:', error)
  }
}

// Validation schemas
const createResponseSchema = z.object({
  content: z.string().min(1, 'Response is required').max(5000, 'Response is too long'),
  questionId: z.string().min(1, 'Question ID is required'),
  isAnonymous: z.boolean().default(false),
})

const updateResponseSchema = z.object({
  content: z.string().min(1, 'Response is required').max(5000, 'Response is too long'),
})

/**
 * Create a new response to a question
 */
export async function createResponse(formData: FormData): Promise<CreateResponseResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to respond' }
  }

  const rawData = {
    content: formData.get('content')?.toString() ?? '',
    questionId: formData.get('questionId')?.toString() ?? '',
    isAnonymous: formData.get('isAnonymous') === 'true',
  }

  const result = createResponseSchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const data = result.data

  try {
    // Get question with activity and group info
    const question = await prisma.question.findUnique({
      where: { id: data.questionId, isDeleted: false },
      include: {
        activity: {
          include: {
            owningGroup: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    })

    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    // Check if user is a group member
    if (question.activity.owningGroup.members.length === 0) {
      return { success: false, error: 'You are not a member of this group' }
    }

    // Check if anonymous is allowed
    if (data.isAnonymous && !question.activity.isAnonymousAuthorAllowed) {
      return { success: false, error: 'Anonymous responses are not allowed in this activity' }
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        content: data.content,
        creatorId: session.user.id,
        questionId: data.questionId,
        isAnonymous: data.isAnonymous,
        aiEvaluationStatus: 'pending',
      },
    })

    // Update question's numberOfAnswers
    await prisma.question.update({
      where: { id: data.questionId },
      data: { numberOfAnswers: { increment: 1 } },
    })

    // Update activity's numberOfAnswers
    await prisma.activity.update({
      where: { id: question.activityId },
      data: { numberOfAnswers: { increment: 1 } },
    })

    // Queue AI evaluation job (fire and forget)
    if (question.activity.aiRatingEnabled) {
      queueResponseEvaluationViaApi({
        responseId: response.id,
        activityId: question.activityId,
        userId: session.user.id,
        responseContent: data.content,
        questionContent: question.content,
        context: {
          activityName: question.activity.name,
          groupName: question.activity.owningGroup.name,
        },
      })
    }

    revalidatePath(`/activities/${question.activityId}`)
    revalidatePath(`/activities/${question.activityId}/questions/${data.questionId}`)
    return { success: true, data: { responseId: response.id } }
  } catch (error) {
    console.error('Failed to create response:', error)
    return { success: false, error: 'Failed to create response. Please try again.' }
  }
}

/**
 * Update an existing response
 */
export async function updateResponse(responseId: string, formData: FormData): Promise<UpdateResponseResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  const rawData = {
    content: formData.get('content')?.toString() ?? '',
  }

  const result = updateResponseSchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' }
  }

  try {
    const response = await prisma.response.findUnique({
      where: { id: responseId, isDeleted: false },
      include: {
        question: {
          select: { id: true, activityId: true },
        },
      },
    })

    if (!response) {
      return { success: false, error: 'Response not found' }
    }

    // Only creator can edit
    if (response.creatorId !== session.user.id) {
      return { success: false, error: 'You can only edit your own responses' }
    }

    await prisma.response.update({
      where: { id: responseId },
      data: {
        content: result.data.content,
        updatedAt: new Date(),
      },
    })

    revalidatePath(`/activities/${response.question.activityId}`)
    revalidatePath(`/activities/${response.question.activityId}/questions/${response.questionId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update response:', error)
    return { success: false, error: 'Failed to update response. Please try again.' }
  }
}

/**
 * Delete a response (soft delete)
 */
export async function deleteResponse(responseId: string): Promise<DeleteResponseResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    const response = await prisma.response.findUnique({
      where: { id: responseId, isDeleted: false },
      include: {
        question: {
          select: {
            id: true,
            activityId: true,
            creatorId: true,
            activity: {
              select: {
                creatorId: true,
                owningGroup: {
                  select: { creatorId: true },
                },
              },
            },
          },
        },
      },
    })

    if (!response) {
      return { success: false, error: 'Response not found' }
    }

    // Check permissions: response creator, question creator, activity creator, group owner
    const canDelete =
      response.creatorId === session.user.id ||
      response.question.creatorId === session.user.id ||
      response.question.activity.creatorId === session.user.id ||
      response.question.activity.owningGroup.creatorId === session.user.id

    if (!canDelete) {
      return { success: false, error: 'You do not have permission to delete this response' }
    }

    // Soft delete
    await prisma.response.update({
      where: { id: responseId },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
        deletedById: session.user.id,
      },
    })

    // Update counts
    await prisma.question.update({
      where: { id: response.questionId },
      data: { numberOfAnswers: { decrement: 1 } },
    })

    await prisma.activity.update({
      where: { id: response.question.activityId },
      data: { numberOfAnswers: { decrement: 1 } },
    })

    revalidatePath(`/activities/${response.question.activityId}`)
    revalidatePath(`/activities/${response.question.activityId}/questions/${response.questionId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete response:', error)
    return { success: false, error: 'Failed to delete response. Please try again.' }
  }
}

/**
 * Toggle like on a question
 */
export async function toggleLike(questionId: string): Promise<ToggleLikeResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to like' }
  }

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      include: {
        activity: {
          include: {
            owningGroup: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    // Check if user is a group member
    if (question.activity.owningGroup.members.length === 0) {
      return { success: false, error: 'You are not a member of this group' }
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: questionId,
        },
      },
    })

    let liked: boolean
    let newCount: number

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      })

      await prisma.activity.update({
        where: { id: question.activityId },
        data: { numberOfLikes: { decrement: 1 } },
      })

      liked = false
      newCount = question._count.likes - 1
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          questionId: questionId,
        },
      })

      await prisma.activity.update({
        where: { id: question.activityId },
        data: { numberOfLikes: { increment: 1 } },
      })

      liked = true
      newCount = question._count.likes + 1
    }

    revalidatePath(`/activities/${question.activityId}`)
    revalidatePath(`/activities/${question.activityId}/questions/${questionId}`)
    return { success: true, data: { liked, count: newCount } }
  } catch (error) {
    console.error('Failed to toggle like:', error)
    return { success: false, error: 'Failed to update like. Please try again.' }
  }
}
