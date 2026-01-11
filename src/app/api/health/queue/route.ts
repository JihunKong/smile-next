import { NextResponse } from 'next/server'
import { responseEvaluationQueue, evaluationQueue } from '@/lib/queue/bull'

export const runtime = 'nodejs'

/**
 * Public queue health check endpoint
 * No authentication required - used for debugging
 */
export async function GET() {
  try {
    // Check queue readiness - isReady() returns the queue on success, so check truthiness
    const [responseQueueReady, evalQueueReady] = await Promise.all([
      responseEvaluationQueue.isReady().then(() => true).catch(() => false),
      evaluationQueue.isReady().then(() => true).catch(() => false),
    ])

    // Get job counts - extract only the counts
    const [responseJobCounts, evalJobCounts] = await Promise.all([
      responseEvaluationQueue.getJobCounts().then(counts => ({
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        paused: counts.paused,
      })).catch(() => null),
      evaluationQueue.getJobCounts().then(counts => ({
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
        paused: counts.paused,
      })).catch(() => null),
    ])

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: {
        responseQueueReady,
        evalQueueReady,
      },
      env: {
        REDIS_URL: process.env.REDIS_URL ? 'configured' : 'NOT SET',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'configured' : 'NOT SET',
        ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929 (default)',
      },
      responseEvaluationQueue: responseJobCounts || 'connection failed',
      evaluationQueue: evalJobCounts || 'connection failed',
    })
  } catch (error) {
    console.error('[Health Queue API] Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
