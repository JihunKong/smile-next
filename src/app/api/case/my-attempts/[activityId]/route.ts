import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { activityId } = await params

    // Verify activity exists and user has access
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      select: {
        id: true,
        name: true,
        mode: true,
        caseSettings: true,
        owningGroup: {
          select: {
            members: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 })
    }

    if (activity.mode !== 3) {
      return NextResponse.json({ success: false, error: 'This is not a Case mode activity' }, { status: 400 })
    }

    // Check membership
    if (activity.owningGroup.members.length === 0) {
      return NextResponse.json({ success: false, error: 'You are not a member of this group' }, { status: 403 })
    }

    // Get user's attempts
    const attempts = await prisma.caseAttempt.findMany({
      where: {
        userId: session.user.id,
        activityId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        timeSpentSeconds: true,
        status: true,
        totalScore: true,
        passed: true,
        scenarioScores: true,
        createdAt: true,
      },
    })

    // Get max attempts from case settings
    const caseSettings = activity.caseSettings as { configuration?: { max_attempts?: number } } | null
    const maxAttempts = caseSettings?.configuration?.max_attempts || 3

    // Count completed attempts
    const completedAttempts = attempts.filter((a) => a.status === 'completed').length
    const inProgressAttempt = attempts.find((a) => a.status === 'in_progress')

    return NextResponse.json({
      success: true,
      attempts: attempts.map((a) => ({
        id: a.id,
        started_at: a.startedAt,
        completed_at: a.completedAt,
        time_spent_seconds: a.timeSpentSeconds,
        status: a.status,
        total_score: a.totalScore,
        passed: a.passed,
        scenario_scores: a.scenarioScores,
        created_at: a.createdAt,
      })),
      completed_count: completedAttempts,
      max_attempts: maxAttempts,
      attempts_remaining: Math.max(0, maxAttempts - completedAttempts),
      has_in_progress: !!inProgressAttempt,
      in_progress_id: inProgressAttempt?.id || null,
    })
  } catch (error) {
    console.error('Failed to get attempts:', error)
    return NextResponse.json({ success: false, error: 'Failed to get attempts' }, { status: 500 })
  }
}
