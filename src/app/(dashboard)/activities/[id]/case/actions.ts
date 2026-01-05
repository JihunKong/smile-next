'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import type { ActionResult, CaseSettings } from '@/types/activities'

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

    // Simulated AI evaluation for each scenario
    const scenarioScores: Array<{ scenarioId: string; title: string; score: number; feedback: string }> = []

    for (const scenario of caseSettings.scenarios) {
      const response = responses[scenario.id]
      let score = 0
      let feedback = ''

      if (response) {
        // Simulated scoring based on response length and keywords
        const issuesLength = response.issues?.length || 0
        const solutionLength = response.solution?.length || 0

        if (issuesLength > 200 && solutionLength > 200) {
          score = 7 + Math.random() * 3 // 7-10
          feedback = 'Excellent analysis with comprehensive problem identification and detailed solution.'
        } else if (issuesLength > 100 && solutionLength > 100) {
          score = 5 + Math.random() * 2 // 5-7
          feedback = 'Good analysis with reasonable problem identification and solution approach.'
        } else if (issuesLength > 50 || solutionLength > 50) {
          score = 3 + Math.random() * 2 // 3-5
          feedback = 'Basic analysis provided. Consider more detailed problem identification.'
        } else {
          score = 1 + Math.random() * 2 // 1-3
          feedback = 'Response is too brief. More detailed analysis is required.'
        }
      } else {
        score = 0
        feedback = 'No response provided for this scenario.'
      }

      scenarioScores.push({
        scenarioId: scenario.id,
        title: scenario.title,
        score: Math.round(score * 10) / 10,
        feedback,
      })
    }

    // Calculate total score (average of scenario scores)
    const totalScore = scenarioScores.length > 0
      ? scenarioScores.reduce((sum, s) => sum + s.score, 0) / scenarioScores.length
      : 0
    const passed = totalScore >= caseSettings.passThreshold

    // Calculate time spent
    const timeSpentSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)

    // Update attempt
    await prisma.caseAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        timeSpentSeconds,
        totalScore: Math.round(totalScore * 10) / 10,
        scenarioScores: scenarioScores.reduce((acc, s) => {
          acc[s.scenarioId] = { score: s.score, feedback: s.feedback }
          return acc
        }, {} as Record<string, { score: number; feedback: string }>),
        passed,
      },
    })

    return {
      success: true,
      data: {
        totalScore: Math.round(totalScore * 10) / 10,
        passed,
        scenarioScores,
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

    // Check for in-progress attempt
    const inProgressAttempt = await prisma.caseAttempt.findFirst({
      where: {
        userId: session.user.id,
        activityId,
        status: 'in_progress',
      },
    })

    if (inProgressAttempt) {
      const responses = (inProgressAttempt.responses as Record<string, unknown>) || {}
      return {
        status: 'in_progress',
        attemptId: inProgressAttempt.id,
        scenariosCompleted: Object.keys(responses).length,
        totalScenarios: caseSettings.scenarios.length,
      }
    }

    // Check for completed attempts
    const completedAttempts = await prisma.caseAttempt.findMany({
      where: {
        userId: session.user.id,
        activityId,
        status: 'completed',
      },
      orderBy: { totalScore: 'desc' },
    })

    if (completedAttempts.length > 0) {
      return {
        status: 'completed',
        bestScore: completedAttempts[0].totalScore || 0,
        attemptsUsed: completedAttempts.length,
        maxAttempts: caseSettings.maxAttempts,
      }
    }

    return {
      status: 'not_started',
      attemptsUsed: 0,
      maxAttempts: caseSettings.maxAttempts,
    }
  } catch (error) {
    console.error('Error getting case attempt status:', error)
    return null
  }
}
