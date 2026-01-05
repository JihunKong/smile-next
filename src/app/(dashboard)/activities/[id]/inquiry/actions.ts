'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/activities'

// Helper to queue evaluation via API (avoids Bull import in Server Components)
async function queueQuestionEvaluationViaApi(data: {
  questionId: string
  activityId: string
  userId: string
  questionContent: string
  context: {
    activityName: string
    groupName: string
    subject?: string
    topic?: string
    educationLevel?: string
  }
}): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000'
  try {
    await fetch(`${baseUrl}/api/queue/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'question', data }),
    })
  } catch (error) {
    console.warn('Failed to queue evaluation via API:', error)
  }
}

interface StartInquiryResult extends ActionResult<{ attemptId: string }> {}
interface SubmitQuestionResult extends ActionResult<{
  questionId: string
  questionNumber: number
  evaluation?: {
    score: number
    bloomsLevel: string
    feedback: string
  }
}> {}
interface CompleteInquiryResult extends ActionResult<{
  passed: boolean
  averageScore: number
  questionsGenerated: number
}> {}

/**
 * Start a new inquiry attempt
 */
export async function startInquiryAttempt(activityId: string): Promise<StartInquiryResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    // Get activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false, mode: 2 },
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
      return { success: false, error: 'Inquiry activity not found' }
    }

    if (activity.owningGroup.members.length === 0) {
      return { success: false, error: 'You are not a member of this group' }
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.inquiryAttempt.findFirst({
      where: {
        userId: session.user.id,
        activityId,
        status: 'in_progress',
      },
    })

    if (existingAttempt) {
      return {
        success: true,
        data: { attemptId: existingAttempt.id },
      }
    }

    // Get settings
    const inquirySettings = activity.inquirySettings as { questionsRequired?: number } | null
    const questionsRequired = inquirySettings?.questionsRequired || 5

    // Create attempt
    const attempt = await prisma.inquiryAttempt.create({
      data: {
        userId: session.user.id,
        activityId,
        questionsRequired,
        status: 'in_progress',
      },
    })

    return {
      success: true,
      data: { attemptId: attempt.id },
    }
  } catch (error) {
    console.error('Failed to start inquiry attempt:', error)
    return { success: false, error: 'Failed to start. Please try again.' }
  }
}

/**
 * Submit a question in inquiry mode
 */
export async function submitInquiryQuestion(
  attemptId: string,
  content: string
): Promise<SubmitQuestionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  if (!content.trim()) {
    return { success: false, error: 'Question content is required' }
  }

  try {
    // Get attempt with activity
    const attempt = await prisma.inquiryAttempt.findUnique({
      where: { id: attemptId },
      include: {
        activity: {
          select: {
            id: true,
            inquirySettings: true,
          },
        },
      },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return { success: false, error: 'Attempt not found' }
    }

    if (attempt.status !== 'in_progress') {
      return { success: false, error: 'This inquiry session has ended' }
    }

    // Check if already completed required questions
    if (attempt.questionsGenerated >= attempt.questionsRequired) {
      return { success: false, error: 'You have already submitted all required questions' }
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        content: content.trim(),
        creatorId: session.user.id,
        activityId: attempt.activityId,
        questionType: 'inquiry',
      },
    })

    // Update attempt
    const newQuestionCount = attempt.questionsGenerated + 1
    await prisma.inquiryAttempt.update({
      where: { id: attemptId },
      data: {
        questionsGenerated: newQuestionCount,
      },
    })

    // Get activity and group info for evaluation context
    const activityWithGroup = await prisma.activity.findUnique({
      where: { id: attempt.activityId },
      include: {
        owningGroup: { select: { name: true } },
      },
    })

    // Provide immediate estimated evaluation for UX
    // Background AI evaluation will refine this later
    const estimatedEvaluation = {
      score: 7.0, // Neutral score, AI will update
      bloomsLevel: 'understand',
      feedback: 'Evaluating your question...',
    }

    // Create preliminary evaluation record
    const evaluation = await prisma.questionEvaluation.create({
      data: {
        questionId: question.id,
        activityId: attempt.activityId,
        evaluationType: 'inquiry',
        overallScore: estimatedEvaluation.score,
        bloomsLevel: estimatedEvaluation.bloomsLevel,
        evaluationText: estimatedEvaluation.feedback,
        evaluationStatus: 'pending', // Will be updated by worker
      },
    })

    // Link evaluation to question
    await prisma.question.update({
      where: { id: question.id },
      data: {
        questionEvaluationId: evaluation.id,
        questionEvaluationScore: estimatedEvaluation.score,
      },
    })

    // Queue background AI evaluation job
    const inquirySettings = attempt.activity.inquirySettings as {
      subject?: string
      topic?: string
      educationLevel?: string
    } | null

    // Queue background AI evaluation (fire and forget)
    queueQuestionEvaluationViaApi({
      questionId: question.id,
      activityId: attempt.activityId,
      userId: session.user.id,
      questionContent: content.trim(),
      context: {
        activityName: activityWithGroup?.name || 'Unknown Activity',
        groupName: activityWithGroup?.owningGroup?.name || 'Unknown Group',
        subject: inquirySettings?.subject,
        topic: inquirySettings?.topic,
        educationLevel: inquirySettings?.educationLevel,
      },
    })

    revalidatePath(`/activities/${attempt.activityId}/inquiry`)

    return {
      success: true,
      data: {
        questionId: question.id,
        questionNumber: newQuestionCount,
        evaluation: estimatedEvaluation,
      },
    }
  } catch (error) {
    console.error('Failed to submit question:', error)
    return { success: false, error: 'Failed to submit question. Please try again.' }
  }
}

/**
 * Complete the inquiry attempt
 */
export async function completeInquiryAttempt(attemptId: string): Promise<CompleteInquiryResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    const attempt = await prisma.inquiryAttempt.findUnique({
      where: { id: attemptId },
      include: {
        activity: {
          select: {
            id: true,
            inquirySettings: true,
          },
        },
      },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return { success: false, error: 'Attempt not found' }
    }

    if (attempt.status === 'completed') {
      return { success: false, error: 'This inquiry has already been completed' }
    }

    // Get all questions for this attempt
    const questions = await prisma.question.findMany({
      where: {
        activityId: attempt.activityId,
        creatorId: session.user.id,
        questionType: 'inquiry',
        createdAt: { gte: attempt.startedAt },
      },
      select: {
        questionEvaluationScore: true,
      },
    })

    // Calculate average score
    const scores = questions
      .map((q) => q.questionEvaluationScore)
      .filter((s): s is number => s !== null)

    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0

    const passThreshold = (attempt.activity.inquirySettings as { passThreshold?: number } | null)?.passThreshold || 6
    const passed = averageScore >= passThreshold

    // Update attempt
    await prisma.inquiryAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    })

    revalidatePath(`/activities/${attempt.activityId}/inquiry`)

    return {
      success: true,
      data: {
        passed,
        averageScore: Math.round(averageScore * 10) / 10,
        questionsGenerated: attempt.questionsGenerated,
      },
    }
  } catch (error) {
    console.error('Failed to complete inquiry:', error)
    return { success: false, error: 'Failed to complete. Please try again.' }
  }
}

/**
 * Get inquiry attempt status
 */
export async function getInquiryAttemptStatus(activityId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const attempts = await prisma.inquiryAttempt.findMany({
      where: {
        userId: session.user.id,
        activityId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        questionsGenerated: true,
        questionsRequired: true,
      },
    })

    const latestAttempt = attempts[0] || null

    // Format attempts for AttemptHistoryList
    const formattedAttempts = attempts.map((a) => ({
      id: a.id,
      status: a.status,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      score: null as number | null, // Inquiry doesn't have a simple score
      passed: null as boolean | null,
      timeSpentSeconds: null as number | null,
      questionsGenerated: a.questionsGenerated,
      questionsRequired: a.questionsRequired,
    }))

    return {
      ...latestAttempt,
      allAttempts: formattedAttempts,
    }
  } catch (error) {
    console.error('Failed to get attempt status:', error)
    return null
  }
}

/**
 * Update anti-cheating statistics for an inquiry attempt
 */
export async function updateInquiryCheatingStats(
  attemptId: string,
  stats: {
    tabSwitchCount?: number
    copyAttempts?: number
    pasteAttempts?: number
    cheatingFlags?: Array<{ type: string; timestamp: string }>
  }
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    // Verify attempt belongs to user and is in progress
    const attempt = await prisma.inquiryAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return { success: false, error: 'Attempt not found' }
    }

    if (attempt.status !== 'in_progress') {
      return { success: false, error: 'This inquiry has already been completed' }
    }

    // Merge new events with existing
    const existingFlags = (attempt.cheatingFlags as Array<{ type: string; timestamp: string }>) || []
    const newFlags = stats.cheatingFlags || []
    const mergedFlags = [...existingFlags, ...newFlags]

    await prisma.inquiryAttempt.update({
      where: { id: attemptId },
      data: {
        tabSwitchCount: stats.tabSwitchCount ?? attempt.tabSwitchCount,
        copyAttempts: stats.copyAttempts ?? attempt.copyAttempts,
        pasteAttempts: stats.pasteAttempts ?? attempt.pasteAttempts,
        cheatingFlags: mergedFlags,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to update cheating stats:', error)
    return { success: false, error: 'Failed to update stats' }
  }
}
