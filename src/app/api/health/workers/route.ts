import { NextResponse } from 'next/server'
import { getWorkerStatus } from '@/instrumentation'

/**
 * Workers Health Check Endpoint
 * 
 * Reports the status of background workers and required environment variables.
 * This helps detect silent worker failures.
 */
export async function GET() {
  const isDisabled = process.env.DISABLE_WORKERS === 'true'
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
  const hasRedisUrl = !!process.env.REDIS_URL
  const hasDatabaseUrl = !!process.env.DATABASE_URL

  const workerStatus = getWorkerStatus()
  const workersEnabled = !isDisabled && hasAnthropicKey && hasRedisUrl && hasDatabaseUrl && workerStatus.success

  const missingVars: string[] = []
  if (!hasAnthropicKey) missingVars.push('ANTHROPIC_API_KEY')
  if (!hasRedisUrl) missingVars.push('REDIS_URL')
  if (!hasDatabaseUrl) missingVars.push('DATABASE_URL')

  const status = workersEnabled ? 'ok' : 'degraded'
  const statusCode = workersEnabled ? 200 : 503

  return NextResponse.json(
    {
      status,
      workersEnabled,
      disabled: isDisabled,
      startupStatus: workerStatus,
      missingVars,
      environment: {
        hasAnthropicKey,
        hasRedisUrl,
        hasDatabaseUrl,
      },
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  )
}
