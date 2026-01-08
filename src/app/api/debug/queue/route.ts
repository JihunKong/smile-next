import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { responseEvaluationQueue, evaluationQueue } from '@/lib/queue/bull'
import { prisma } from '@/lib/db/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin or teacher (roleId 0 or 1)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roleId: true },
  })

  if (!user || user.roleId > 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Get queue stats
    const [responseJobCounts, evalJobCounts] = await Promise.all([
      responseEvaluationQueue.getJobCounts(),
      evaluationQueue.getJobCounts(),
    ])

    // Get recent responses with pending/evaluating status
    const pendingResponses = await prisma.response.findMany({
      where: {
        aiEvaluationStatus: {
          in: ['pending', 'evaluating'],
        },
        isDeleted: false,
      },
      select: {
        id: true,
        aiEvaluationStatus: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Check Redis connection by getting queue status
    const isReady = await responseEvaluationQueue.isReady()

    return NextResponse.json({
      redis: {
        isReady,
        redisUrl: process.env.REDIS_URL ? 'configured' : 'NOT SET',
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY ? 'configured' : 'NOT SET',
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929 (default)',
      },
      responseEvaluationQueue: responseJobCounts,
      evaluationQueue: evalJobCounts,
      pendingResponses,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Debug Queue API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get queue status',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
