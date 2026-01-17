/**
 * Next.js Instrumentation
 *
 * This file is executed once when the Next.js server starts.
 * We use it to start background workers for AI evaluation.
 */

// Track worker startup status for health checks
let workerStartupStatus: {
  attempted: boolean
  success: boolean
  error?: string
  missingVars?: string[]
} = {
  attempted: false,
  success: false,
}

export function getWorkerStatus() {
  return workerStartupStatus
}

export async function register() {
  // Only run workers on the server side in production
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Check if we should run workers (can be disabled via env var)
    if (process.env.DISABLE_WORKERS === 'true') {
      console.log('[Instrumentation] Workers disabled via DISABLE_WORKERS env var')
      workerStartupStatus = {
        attempted: true,
        success: false,
        error: 'Workers disabled via DISABLE_WORKERS env var',
      }
      return
    }

    // Check for required environment variables
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
    const hasRedisUrl = !!process.env.REDIS_URL
    const hasDatabaseUrl = !!process.env.DATABASE_URL

    const missingVars: string[] = []
    if (!hasAnthropicKey) missingVars.push('ANTHROPIC_API_KEY')
    if (!hasRedisUrl) missingVars.push('REDIS_URL')
    if (!hasDatabaseUrl) missingVars.push('DATABASE_URL')

    if (missingVars.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`
      console.error('[Instrumentation] ⚠️  WORKER STARTUP FAILED:', errorMsg)
      console.error('[Instrumentation] AI evaluation features will not work until these are set.')
      console.error('[Instrumentation] Check /api/health/workers for status.')
      
      workerStartupStatus = {
        attempted: true,
        success: false,
        error: errorMsg,
        missingVars,
      }
      return
    }

    console.log('[Instrumentation] Starting background workers...')

    try {
      // Dynamically import workers to avoid issues during build
      const { startAllWorkers } = await import('@/lib/queue/workers')
      startAllWorkers()
      console.log('[Instrumentation] ✓ Background workers started successfully')
      
      workerStartupStatus = {
        attempted: true,
        success: true,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('[Instrumentation] ✗ Failed to start workers:', errorMsg)
      
      workerStartupStatus = {
        attempted: true,
        success: false,
        error: errorMsg,
      }
    }
  }
}
