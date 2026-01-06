'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActivityModes, type ActionResult, type CreateActivityResult, type CreateQuestionResult } from '@/types/activities'

// Validation schemas
const createActivitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  groupId: z.string().min(1, 'Group is required'),
  mode: z.number().min(0).max(3).default(0),
  aiRatingEnabled: z.boolean().default(true),
  isAnonymousAuthorAllowed: z.boolean().default(false),
  hideUsernames: z.boolean().default(false),
  examSettings: z.string().optional(),
  inquirySettings: z.string().optional(),
  caseSettings: z.string().optional(),
})

const createQuestionSchema = z.object({
  content: z.string().min(1, 'Question content is required').max(5000, 'Question is too long'),
  activityId: z.string().min(1, 'Activity is required'),
  isAnonymous: z.boolean().default(false),
})

/**
 * Create a new activity
 */
export async function createActivity(formData: FormData): Promise<CreateActivityResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to create an activity' }
  }

  const rawData = {
    name: formData.get('name')?.toString() ?? '',
    description: formData.get('description')?.toString() || undefined,
    groupId: formData.get('groupId')?.toString() ?? '',
    mode: parseInt(formData.get('mode')?.toString() ?? '0') || 0,
    aiRatingEnabled: formData.get('aiRatingEnabled') === 'true',
    isAnonymousAuthorAllowed: formData.get('isAnonymousAuthorAllowed') === 'true',
    hideUsernames: formData.get('hideUsernames') === 'true',
    examSettings: formData.get('examSettings')?.toString() || undefined,
    inquirySettings: formData.get('inquirySettings')?.toString() || undefined,
    caseSettings: formData.get('caseSettings')?.toString() || undefined,
  }

  const result = createActivitySchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const data = result.data

  try {
    // Check if user is a member of the group with sufficient permissions
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: data.groupId,
        },
      },
    })

    if (!membership) {
      return { success: false, error: 'You are not a member of this group' }
    }

    // Only admins and above can create activities (role >= 2)
    if (membership.role < 2) {
      return { success: false, error: 'You do not have permission to create activities in this group' }
    }

    // Parse mode-specific settings
    let examSettingsJson = null
    let inquirySettingsJson = null
    let openModeSettingsJson = null // Used for Case mode

    if (data.mode === ActivityModes.EXAM && data.examSettings) {
      try {
        examSettingsJson = JSON.parse(data.examSettings)
      } catch {
        return { success: false, error: 'Invalid exam settings' }
      }
    } else if (data.mode === ActivityModes.INQUIRY && data.inquirySettings) {
      try {
        inquirySettingsJson = JSON.parse(data.inquirySettings)
      } catch {
        return { success: false, error: 'Invalid inquiry settings' }
      }
    } else if (data.mode === ActivityModes.CASE && data.caseSettings) {
      try {
        openModeSettingsJson = JSON.parse(data.caseSettings) // Store case settings in openModeSettings
      } catch {
        return { success: false, error: 'Invalid case settings' }
      }
    }

    const activity = await prisma.activity.create({
      data: {
        name: data.name,
        description: data.description || null,
        creatorId: session.user.id,
        owningGroupId: data.groupId,
        mode: data.mode,
        aiRatingEnabled: data.aiRatingEnabled,
        isAnonymousAuthorAllowed: data.isAnonymousAuthorAllowed,
        hideUsernames: data.hideUsernames,
        examSettings: examSettingsJson,
        inquirySettings: inquirySettingsJson,
        openModeSettings: openModeSettingsJson,
      },
    })

    revalidatePath('/activities')
    revalidatePath(`/groups/${data.groupId}`)
    return { success: true, data: { activityId: activity.id } }
  } catch (error) {
    console.error('Failed to create activity:', error)
    return { success: false, error: 'Failed to create activity. Please try again.' }
  }
}

/**
 * Create a new question
 */
export async function createQuestion(formData: FormData): Promise<CreateQuestionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in to create a question' }
  }

  const rawData = {
    content: formData.get('content')?.toString() ?? '',
    activityId: formData.get('activityId')?.toString() ?? '',
    isAnonymous: formData.get('isAnonymous') === 'true',
  }

  const result = createQuestionSchema.safeParse(rawData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const data = result.data

  try {
    // Check if activity exists and user has access
    const activity = await prisma.activity.findUnique({
      where: { id: data.activityId, isDeleted: false },
      include: {
        owningGroup: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!activity) {
      return { success: false, error: 'Activity not found' }
    }

    if (activity.owningGroup.members.length === 0) {
      return { success: false, error: 'You are not a member of this group' }
    }

    // Check if anonymous is allowed
    if (data.isAnonymous && !activity.isAnonymousAuthorAllowed) {
      return { success: false, error: 'Anonymous questions are not allowed in this activity' }
    }

    const question = await prisma.question.create({
      data: {
        content: data.content,
        creatorId: session.user.id,
        activityId: data.activityId,
        isAnonymous: data.isAnonymous,
      },
    })

    // Update question count
    await prisma.activity.update({
      where: { id: data.activityId },
      data: { numberOfQuestions: { increment: 1 } },
    })

    // TODO: Queue AI evaluation job
    // await queueQuestionEvaluation(question.id, activity.id)

    revalidatePath(`/activities/${data.activityId}`)
    return { success: true, data: { questionId: question.id } }
  } catch (error) {
    console.error('Failed to create question:', error)
    return { success: false, error: 'Failed to create question. Please try again.' }
  }
}

/**
 * Delete an activity (soft delete)
 */
export async function deleteActivity(activityId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      include: {
        owningGroup: {
          select: { creatorId: true },
        },
      },
    })

    if (!activity) {
      return { success: false, error: 'Activity not found' }
    }

    // Only creator or group owner can delete
    if (activity.creatorId !== session.user.id && activity.owningGroup.creatorId !== session.user.id) {
      return { success: false, error: 'You do not have permission to delete this activity' }
    }

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    })

    revalidatePath('/activities')
    revalidatePath(`/groups/${activity.owningGroupId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete activity:', error)
    return { success: false, error: 'Failed to delete activity. Please try again.' }
  }
}

/**
 * Delete a question (soft delete)
 */
export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      include: {
        activity: {
          select: {
            id: true,
            creatorId: true,
            owningGroup: {
              select: { creatorId: true },
            },
          },
        },
      },
    })

    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    // Only question creator, activity creator, or group owner can delete
    const canDelete =
      question.creatorId === session.user.id ||
      question.activity.creatorId === session.user.id ||
      question.activity.owningGroup.creatorId === session.user.id

    if (!canDelete) {
      return { success: false, error: 'You do not have permission to delete this question' }
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        isDeleted: true,
        dateDeleted: new Date(),
      },
    })

    // Update question count
    await prisma.activity.update({
      where: { id: question.activityId },
      data: { numberOfQuestions: { decrement: 1 } },
    })

    revalidatePath(`/activities/${question.activityId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete question:', error)
    return { success: false, error: 'Failed to delete question. Please try again.' }
  }
}

/**
 * Get activities for the current user's groups
 */
export async function getMyActivities() {
  const session = await auth()
  if (!session?.user?.id) {
    return []
  }

  try {
    const activities = await prisma.activity.findMany({
      where: {
        isDeleted: false,
        owningGroup: {
          members: { some: { userId: session.user.id } },
        },
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
        },
        owningGroup: {
          select: { id: true, name: true, creatorId: true },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return activities
  } catch (error) {
    console.error('Failed to get activities:', error)
    return []
  }
}
