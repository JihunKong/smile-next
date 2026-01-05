'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types/activities'

interface StartExamResult extends ActionResult<{ attemptId: string; questionOrder: string[] }> {}
interface SaveAnswerResult extends ActionResult {}
interface SubmitExamResult extends ActionResult<{ score: number; passed: boolean; correctAnswers: number; totalQuestions: number }> {}

/**
 * Start a new exam attempt
 */
export async function startExamAttempt(activityId: string): Promise<StartExamResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    // Get activity with exam settings
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false, mode: 1 },
      include: {
        owningGroup: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        questions: {
          where: { isDeleted: false },
          select: { id: true },
        },
      },
    })

    if (!activity) {
      return { success: false, error: 'Exam not found' }
    }

    if (activity.owningGroup.members.length === 0) {
      return { success: false, error: 'You are not a member of this group' }
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.examAttempt.findFirst({
      where: {
        userId: session.user.id,
        activityId,
        status: 'in_progress',
      },
    })

    if (existingAttempt) {
      return {
        success: true,
        data: {
          attemptId: existingAttempt.id,
          questionOrder: (existingAttempt.questionOrder as string[]) || [],
        },
      }
    }

    // Check max attempts
    const examSettings = activity.examSettings as { maxAttempts?: number } | null
    const maxAttempts = examSettings?.maxAttempts || 1

    const attemptCount = await prisma.examAttempt.count({
      where: {
        userId: session.user.id,
        activityId,
        status: 'completed',
      },
    })

    if (attemptCount >= maxAttempts) {
      return { success: false, error: 'You have reached the maximum number of attempts' }
    }

    // Get questions and shuffle if needed
    let questionIds = activity.questions.map((q) => q.id)
    const shuffleQuestions = (examSettings as { shuffleQuestions?: boolean } | null)?.shuffleQuestions ?? true

    if (shuffleQuestions) {
      questionIds = shuffleArray(questionIds)
    }

    // Limit to questionsToShow
    const questionsToShow = (examSettings as { questionsToShow?: number } | null)?.questionsToShow || questionIds.length
    questionIds = questionIds.slice(0, questionsToShow)

    // Create attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        userId: session.user.id,
        activityId,
        totalQuestions: questionIds.length,
        questionOrder: questionIds,
        status: 'in_progress',
      },
    })

    return {
      success: true,
      data: {
        attemptId: attempt.id,
        questionOrder: questionIds,
      },
    }
  } catch (error) {
    console.error('Failed to start exam attempt:', error)
    return { success: false, error: 'Failed to start exam. Please try again.' }
  }
}

/**
 * Save an answer for a question
 */
export async function saveExamAnswer(
  attemptId: string,
  questionId: string,
  selectedChoices: string[]
): Promise<SaveAnswerResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    // Verify attempt belongs to user and is in progress
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return { success: false, error: 'Attempt not found' }
    }

    if (attempt.status !== 'in_progress') {
      return { success: false, error: 'This exam has already been submitted' }
    }

    // Find or create response
    const existingResponse = await prisma.response.findFirst({
      where: {
        examAttemptId: attemptId,
        questionId,
      },
    })

    if (existingResponse) {
      await prisma.response.update({
        where: { id: existingResponse.id },
        data: {
          content: JSON.stringify(selectedChoices),
          choice: selectedChoices.join(','),
        },
      })
    } else {
      await prisma.response.create({
        data: {
          creatorId: session.user.id,
          questionId,
          examAttemptId: attemptId,
          content: JSON.stringify(selectedChoices),
          choice: selectedChoices.join(','),
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to save answer:', error)
    return { success: false, error: 'Failed to save answer' }
  }
}

/**
 * Submit exam attempt and calculate score
 */
export async function submitExamAttempt(attemptId: string): Promise<SubmitExamResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  try {
    // Get attempt with responses
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        activity: {
          select: { examSettings: true },
        },
        responses: {
          select: {
            questionId: true,
            choice: true,
          },
        },
      },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return { success: false, error: 'Attempt not found' }
    }

    if (attempt.status === 'completed') {
      return { success: false, error: 'This exam has already been submitted' }
    }

    // Get questions with correct answers
    const questionOrder = (attempt.questionOrder as string[]) || []
    const questions = await prisma.question.findMany({
      where: { id: { in: questionOrder } },
      select: { id: true, correctAnswers: true },
    })

    // Calculate score
    let correctAnswers = 0
    const questionsMap = new Map(questions.map((q) => [q.id, q.correctAnswers as string[] | null]))

    for (const response of attempt.responses) {
      const correctAns = questionsMap.get(response.questionId)
      if (!correctAns) continue

      const userAnswers = response.choice?.split(',') || []
      const isCorrect = arraysEqual(userAnswers.sort(), (correctAns as string[]).sort())

      if (isCorrect) {
        correctAnswers++
      }

      // Update response with isCorrect
      await prisma.response.updateMany({
        where: {
          examAttemptId: attemptId,
          questionId: response.questionId,
        },
        data: { isCorrect },
      })
    }

    const totalQuestions = questionOrder.length
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    const passThreshold = (attempt.activity.examSettings as { passThreshold?: number } | null)?.passThreshold || 60
    const passed = score >= passThreshold

    // Update attempt
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        correctAnswers,
        score,
        passed,
        timeSpentSeconds: Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000),
      },
    })

    revalidatePath(`/activities/${attempt.activityId}/exam`)

    return {
      success: true,
      data: {
        score: Math.round(score * 10) / 10,
        passed,
        correctAnswers,
        totalQuestions,
      },
    }
  } catch (error) {
    console.error('Failed to submit exam:', error)
    return { success: false, error: 'Failed to submit exam. Please try again.' }
  }
}

/**
 * Get exam attempt status
 */
export async function getExamAttemptStatus(activityId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  try {
    const attempts = await prisma.examAttempt.findMany({
      where: {
        userId: session.user.id,
        activityId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        score: true,
        passed: true,
        completedAt: true,
        totalQuestions: true,
        correctAnswers: true,
      },
    })

    const inProgress = attempts.find((a) => a.status === 'in_progress')
    const completed = attempts.filter((a) => a.status === 'completed')

    return {
      inProgress,
      completed,
      attemptCount: completed.length,
    }
  } catch (error) {
    console.error('Failed to get attempt status:', error)
    return null
  }
}

// Helper functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, idx) => val === b[idx])
}
