import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { queueQuestionEvaluation } from '@/lib/queue/bull'

export const runtime = 'nodejs'

/**
 * Bulk evaluate all unevaluated questions
 * POST /api/queue/evaluate/bulk
 *
 * Query params:
 * - activityId: Optional - only evaluate questions from a specific activity
 * - limit: Optional - max number of questions to queue (default: 50)
 */
export async function POST(request: NextRequest) {
  // Allow both session auth and admin API key
  const session = await auth()
  const adminKey = request.headers.get('x-admin-key')
  const validAdminKey = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

  const isAuthenticated = session?.user?.id || (adminKey && adminKey === validAdminKey)

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Find unevaluated questions
    const questions = await prisma.question.findMany({
      where: {
        questionEvaluationId: null,
        ...(activityId ? { activityId } : {}),
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            aiRatingEnabled: true,
            owningGroup: {
              select: { name: true },
            },
          },
        },
        creator: {
          select: { id: true },
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    // Filter to only activities with AI rating enabled
    const eligibleQuestions = questions.filter((q) => q.activity.aiRatingEnabled)

    if (eligibleQuestions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unevaluated questions found',
        queued: 0,
      })
    }

    // Queue evaluations
    const results: { questionId: string; jobId: number | string | undefined; error?: string }[] = []

    for (const question of eligibleQuestions) {
      try {
        const job = await queueQuestionEvaluation({
          questionId: question.id,
          activityId: question.activityId,
          userId: question.creator?.id || session?.user?.id || 'admin-bulk-eval',
          questionContent: question.content,
          context: {
            activityName: question.activity.name,
            groupName: question.activity.owningGroup.name,
          },
        })
        results.push({ questionId: question.id, jobId: job.id })
      } catch (error) {
        results.push({
          questionId: question.id,
          jobId: undefined,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successful = results.filter((r) => r.jobId !== undefined).length
    const failed = results.filter((r) => r.error).length

    console.log(`[Bulk Evaluate] Queued ${successful} evaluations, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Queued ${successful} question evaluations`,
      queued: successful,
      failed,
      results,
    })
  } catch (error) {
    console.error('Bulk evaluation failed:', error)
    return NextResponse.json(
      { error: 'Failed to queue bulk evaluations' },
      { status: 500 }
    )
  }
}

/**
 * Get count of unevaluated questions
 * GET /api/queue/evaluate/bulk
 */
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')

    // Count unevaluated questions
    const count = await prisma.question.count({
      where: {
        questionEvaluationId: null,
        ...(activityId ? { activityId } : {}),
        activity: {
          aiRatingEnabled: true,
        },
      },
    })

    // Count total questions
    const total = await prisma.question.count({
      where: {
        ...(activityId ? { activityId } : {}),
      },
    })

    return NextResponse.json({
      unevaluated: count,
      total,
      evaluated: total - count,
    })
  } catch (error) {
    console.error('Failed to get evaluation stats:', error)
    return NextResponse.json(
      { error: 'Failed to get evaluation stats' },
      { status: 500 }
    )
  }
}
