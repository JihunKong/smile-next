/**
 * Next.js Instrumentation
 *
 * This file is executed once when the Next.js server starts.
 * We use it to start background workers for AI evaluation.
 */

export async function register() {
  // Only run workers on the server side in production
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Check if we should run workers (can be disabled via env var)
    if (process.env.DISABLE_WORKERS === 'true') {
      console.log('[Instrumentation] Workers disabled via DISABLE_WORKERS env var')
      return
    }

    // Check for required environment variables
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
    const hasRedisUrl = !!process.env.REDIS_URL

    if (!hasAnthropicKey || !hasRedisUrl) {
      console.log('[Instrumentation] Skipping worker startup - missing env vars:')
      if (!hasAnthropicKey) console.log('  - ANTHROPIC_API_KEY')
      if (!hasRedisUrl) console.log('  - REDIS_URL')
      return
    }

    console.log('[Instrumentation] Starting background workers...')

    try {
      // Dynamically import workers to avoid issues during build
      const { startAllWorkers } = await import('@/lib/queue/workers')
      startAllWorkers()
      console.log('[Instrumentation] Background workers started successfully')
    } catch (error) {
      console.error('[Instrumentation] Failed to start workers:', error)
    }
  }
}
