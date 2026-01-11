import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import type { CaseSettings, CaseScenario } from '@/types/activities'

interface ScenarioEvaluation {
  score: number
  feedback: string
  understanding: number
  ingenuity: number
  criticalThinking: number
  realWorldApplication: number
  strengths?: string[]
  improvements?: string[]
}

interface ScenarioResponse {
  issues: string
  solution: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch attempt with related data
    const attempt = await prisma.caseAttempt.findUnique({
      where: { id: attemptId },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            openModeSettings: true,
            owningGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      )
    }

    // Check authorization - must be owner of the attempt
    if (attempt.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Parse settings
    const caseSettings = (attempt.activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      timePerCase: 10,
      totalTimeLimit: 60,
      maxAttempts: 1,
      passThreshold: 6.0,
    }

    // Get all completed attempts for this activity by this user
    const allAttempts = await prisma.caseAttempt.findMany({
      where: {
        userId: session.user.id,
        activityId: attempt.activityId,
        status: 'completed',
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    // Find attempt number
    const attemptNumber = allAttempts.findIndex((a) => a.id === attemptId) + 1

    // Parse responses and scenario scores
    const responses = (attempt.responses as unknown as Record<string, ScenarioResponse>) || {}
    const scenarioScores = (attempt.scenarioScores as unknown as Record<string, ScenarioEvaluation>) || {}

    // Build detailed response list matching Flask template format
    const responsesList = caseSettings.scenarios.map((scenario: CaseScenario) => {
      const studentResponse = responses[scenario.id] || { issues: '', solution: '' }
      const evaluation = scenarioScores[scenario.id] || {
        score: 0,
        feedback: 'No evaluation available',
        understanding: 0,
        ingenuity: 0,
        criticalThinking: 0,
        realWorldApplication: 0,
        strengths: [],
        improvements: [],
      }

      return {
        scenario_id: scenario.id,
        scenario_title: scenario.title,
        scenario_content: scenario.content,
        scenario_domain: scenario.domain || 'General',
        student_flaws: studentResponse.issues,
        student_solutions: studentResponse.solution,
        understanding_score: evaluation.understanding,
        ingenuity_score: evaluation.ingenuity,
        critical_thinking_score: evaluation.criticalThinking,
        real_world_score: evaluation.realWorldApplication,
        overall_score: evaluation.score,
        // Parse feedback into sections (if formatted with markers)
        what_was_done_well: evaluation.strengths?.join('. ') || '',
        what_could_improve: evaluation.improvements?.join('. ') || '',
        suggestions: evaluation.feedback,
      }
    })

    // Calculate time spent
    const timeSpentSeconds = attempt.timeSpentSeconds ||
      (attempt.completedAt ?
        Math.floor((new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000) : 0)

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        total_score: attempt.totalScore || 0,
        passed: attempt.passed || false,
        started_at: attempt.startedAt.toISOString(),
        submitted_at: attempt.completedAt?.toISOString() || attempt.startedAt.toISOString(),
        time_spent_seconds: timeSpentSeconds,
        attempt_number: attemptNumber,
        status: attempt.status,
      },
      responses: responsesList,
      configuration: {
        max_attempts: caseSettings.maxAttempts,
        pass_threshold: caseSettings.passThreshold,
        time_per_case: caseSettings.timePerCase,
        total_time_limit: caseSettings.totalTimeLimit,
      },
      activity: {
        id: attempt.activity.id,
        name: attempt.activity.name,
        group_name: attempt.activity.owningGroup.name,
      },
      attempts_used: allAttempts.length,
      can_retry: allAttempts.length < caseSettings.maxAttempts && !attempt.passed,
    })
  } catch (error) {
    console.error('Failed to fetch case attempt results:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
