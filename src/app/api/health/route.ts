import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Health Check Endpoint
 * 
 * Validates:
 * - Application is running
 * - Database connection is working
 * - Redis connection (optional, via workers endpoint)
 */
export async function GET() {
  const checks: {
    database: { status: 'ok' | 'error'; latencyMs?: number; error?: string }
    redis?: { status: 'ok' | 'error' | 'skipped'; error?: string }
  } = {
    database: { status: 'error' },
  }

  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok'

  // Check database connection
  const dbStart = Date.now()
  try {
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`
    checks.database = {
      status: 'ok',
      latencyMs: Date.now() - dbStart,
    }
  } catch (error) {
    overallStatus = 'error'
    checks.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }

  // Check Redis connection (optional)
  if (process.env.REDIS_URL) {
    try {
      // Dynamic import to avoid issues if Redis isn't configured
      const { Redis } = await import('ioredis')
      const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        commandTimeout: 3000,
      })
      
      await redis.ping()
      checks.redis = { status: 'ok' }
      await redis.quit()
    } catch (error) {
      // Redis is optional, so just mark as degraded
      if (overallStatus === 'ok') overallStatus = 'degraded'
      checks.redis = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown Redis error',
      }
    }
  } else {
    checks.redis = { status: 'skipped' }
  }

  const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(
    {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
    },
    { status: statusCode }
  )
}
