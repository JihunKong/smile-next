'use server'

import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import type { ActionResult, CaseSettings, CaseScenario } from '@/types/activities'
import { evaluateCaseAttempt } from '@/lib/services/caseEvaluationService'

// Start a case attempt
export async function startCaseAttempt(
  activityId: string
): Promise<ActionResult<{ attemptId: string }>> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Get activity and verify it's case mode
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false, mode: 3 },
      include: {
        owningGroup: {
          select: {
            members: {
              where: { userId: session.user.id },
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return { success: false, error: 'Activity not found' }
    }

    if (activity.owningGroup.members.length === 0) {
      return { success: false, error: 'Not a member of this group' }
    }

    const caseSettings = (activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      timePerCase: 10,
      totalTimeLimit: 60,
      maxAttempts: 1,
      passThreshold: 6.0,
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.caseAttempt.findFirst({
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

    // Check max attempts
    const completedAttempts = await prisma.caseAttempt.count({
      where: {
        userId: session.user.id,
        activityId,
        status: 'completed',
      },
    })

    if (completedAttempts >= caseSettings.maxAttempts) {
      return { success: false, error: 'Maximum attempts reached' }
    }

    // Create new attempt
    const attempt = await prisma.caseAttempt.create({
      data: {
        userId: session.user.id,
        activityId,
        responses: {},
        status: 'in_progress',
      },
    })

    return {
      success: true,
      data: { attemptId: attempt.id },
    }
  } catch (error) {
    console.error('Error starting case attempt:', error)
    return { success: false, error: 'Failed to start case attempt' }
  }
}

// Save response for a scenario
export async function saveCaseResponse(
  attemptId: string,
  scenarioId: string,
  response: { issues: string; solution: string }
): Promise<ActionResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const attempt = await prisma.caseAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return { success: false, error: 'Attempt not found' }
    }

    if (attempt.status === 'completed') {
      return { success: false, error: 'Attempt already completed' }
    }

    // Update responses
    const currentResponses = (attempt.responses as Record<string, { issues: string; solution: string }>) || {}
    currentResponses[scenarioId] = response

    await prisma.caseAttempt.update({
      where: { id: attemptId },
      data: { responses: currentResponses },
    })

    return { success: true }
  } catch (error) {
    console.error('Error saving case response:', error)
    return { success: false, error: 'Failed to save response' }
  }
}

// Submit case attempt
export async function submitCaseAttempt(
  attemptId: string
): Promise<ActionResult<{
  totalScore: number
  passed: boolean
  scenarioScores: Array<{ scenarioId: string; title: string; score: number; feedback: string }>
}>> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const attempt = await prisma.caseAttempt.findUnique({
      where: { id: attemptId },
      include: {
        activity: {
          select: {
            openModeSettings: true,
            schoolSubject: true,
            educationLevel: true,
          },
        },
      },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return { success: false, error: 'Attempt not found' }
    }

    if (attempt.status === 'completed') {
      return { success: false, error: 'Already submitted' }
    }

    const caseSettings = (attempt.activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      passThreshold: 6.0,
    }

    const responses = (attempt.responses as Record<string, { issues: string; solution: string }>) || {}

    // Use AI evaluation service for comprehensive 4-dimensional scoring
    const evaluationResult = await evaluateCaseAttempt(
      caseSettings.scenarios,
      responses,
      {
        subject: attempt.activity.schoolSubject || undefined,
        educationLevel: attempt.activity.educationLevel || undefined,
      }
    )

    // Format scenario scores for response
    const scenarioScores = evaluationResult.scenarioResults.map((r) => ({
      scenarioId: r.scenarioId,
      title: r.title,
      score: r.evaluation.overallScore,
      feedback: r.evaluation.feedback,
      // Include 4-dimensional scores
      understanding: r.evaluation.understanding,
      ingenuity: r.evaluation.ingenuity,
      criticalThinking: r.evaluation.criticalThinking,
      realWorldApplication: r.evaluation.realWorldApplication,
      strengths: r.evaluation.strengths,
      improvements: r.evaluation.improvements,
    }))

    const totalScore = evaluationResult.overallScore
    const passed = evaluationResult.passed

    // Calculate time spent
    const timeSpentSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)

    // Update attempt with detailed evaluation results
    await prisma.caseAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        timeSpentSeconds,
        totalScore,
        scenarioScores: scenarioScores.reduce((acc, s) => {
          acc[s.scenarioId] = {
            score: s.score,
            feedback: s.feedback,
            understanding: s.understanding,
            ingenuity: s.ingenuity,
            criticalThinking: s.criticalThinking,
            realWorldApplication: s.realWorldApplication,
            strengths: s.strengths,
            improvements: s.improvements,
          }
          return acc
        }, {} as Record<string, unknown>) as Prisma.InputJsonValue,
        passed,
      },
    })

    return {
      success: true,
      data: {
        totalScore,
        passed,
        scenarioScores: scenarioScores.map((s) => ({
          scenarioId: s.scenarioId,
          title: s.title,
          score: s.score,
          feedback: s.feedback,
        })),
      },
    }
  } catch (error) {
    console.error('Error submitting case attempt:', error)
    return { success: false, error: 'Failed to submit attempt' }
  }
}

// Get case attempt status
export async function getCaseAttemptStatus(activityId: string): Promise<{
  status: 'not_started' | 'in_progress' | 'completed'
  attemptId?: string
  scenariosCompleted?: number
  totalScenarios?: number
  bestScore?: number
  attemptsUsed?: number
  maxAttempts?: number
  allAttempts?: Array<{
    id: string
    status: string
    startedAt: Date
    completedAt: Date | null
    score: number | null
    passed: boolean | null
    timeSpentSeconds: number | null
  }>
} | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { openModeSettings: true },
    })

    const caseSettings = (activity?.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      maxAttempts: 1,
    }

    // Get all attempts for history
    const allAttempts = await prisma.caseAttempt.findMany({
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
        totalScore: true,
        passed: true,
        timeSpentSeconds: true,
        responses: true,
      },
    })

    const formattedAttempts = allAttempts.map((a) => ({
      id: a.id,
      status: a.status,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      score: a.totalScore,
      passed: a.passed,
      timeSpentSeconds: a.timeSpentSeconds,
    }))

    // Check for in-progress attempt
    const inProgressAttempt = allAttempts.find((a) => a.status === 'in_progress')

    if (inProgressAttempt) {
      const responses = (inProgressAttempt.responses as Record<string, unknown>) || {}
      return {
        status: 'in_progress',
        attemptId: inProgressAttempt.id,
        scenariosCompleted: Object.keys(responses).length,
        totalScenarios: caseSettings.scenarios.length,
        allAttempts: formattedAttempts,
      }
    }

    // Check for completed attempts
    const completedAttempts = allAttempts.filter((a) => a.status === 'completed')

    if (completedAttempts.length > 0) {
      const bestScore = Math.max(...completedAttempts.map((a) => a.totalScore || 0))
      return {
        status: 'completed',
        bestScore,
        attemptsUsed: completedAttempts.length,
        maxAttempts: caseSettings.maxAttempts,
        allAttempts: formattedAttempts,
      }
    }

    return {
      status: 'not_started',
      attemptsUsed: 0,
      maxAttempts: caseSettings.maxAttempts,
      allAttempts: formattedAttempts,
    }
  } catch (error) {
    console.error('Error getting case attempt status:', error)
    return null
  }
}

/**
 * Update anti-cheating statistics for a case attempt
 */
export async function updateCaseCheatingStats(
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
    const attempt = await prisma.caseAttempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return { success: false, error: 'Attempt not found' }
    }

    if (attempt.status !== 'in_progress') {
      return { success: false, error: 'This case study has already been completed' }
    }

    // Merge new events with existing
    const existingFlags = (attempt.cheatingFlags as Array<{ type: string; timestamp: string }>) || []
    const newFlags = stats.cheatingFlags || []
    const mergedFlags = [...existingFlags, ...newFlags]

    await prisma.caseAttempt.update({
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
