import Redis from 'ioredis'

// Rate limiter configuration
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Redis key prefix
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per window
    keyPrefix: 'rl:auth',
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyPrefix: 'rl:api',
  },
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 AI requests per minute
    keyPrefix: 'rl:ai',
  },
  questions: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 100, // 100 questions per day
    keyPrefix: 'rl:questions',
  },
  contact: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 messages per 15 minutes
    keyPrefix: 'rl:contact',
  },
} as const

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number // Unix timestamp when window resets
  message?: string
}

// Lazy-initialized Redis client
let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (!redisClient && process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
      })
      redisClient.on('error', (err) => {
        console.error('[RateLimit] Redis error:', err.message)
      })
    } catch (error) {
      console.error('[RateLimit] Failed to create Redis client:', error)
      return null
    }
  }
  return redisClient
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): Promise<RateLimitResult> {
  const redis = getRedisClient()

  // If Redis is not available, allow the request (fail open)
  if (!redis) {
    console.warn('[RateLimit] Redis not available, allowing request')
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    }
  }

  const key = `${config.keyPrefix || 'rl'}:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  try {
    // Connect if not already connected
    if (redis.status !== 'ready') {
      await redis.connect()
    }

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart)

    // Count current entries in window
    pipeline.zcard(key)

    // Add current request with score = current timestamp
    pipeline.zadd(key, now, `${now}:${Math.random()}`)

    // Set expiry on the key
    pipeline.expire(key, Math.ceil(config.windowMs / 1000))

    const results = await pipeline.exec()

    if (!results) {
      console.error('[RateLimit] Pipeline returned null')
      return { success: true, remaining: config.maxRequests, resetTime: now + config.windowMs }
    }

    // Get count from second command result (zcard)
    const countResult = results[1]
    const currentCount = typeof countResult?.[1] === 'number' ? countResult[1] : 0

    const remaining = Math.max(0, config.maxRequests - currentCount - 1)
    const resetTime = now + config.windowMs

    if (currentCount >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime,
        message: `Rate limit exceeded. Please try again after ${new Date(resetTime).toISOString()}`,
      }
    }

    return {
      success: true,
      remaining,
      resetTime,
    }
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error)
    // Fail open - allow the request if rate limiting fails
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    }
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    ...(result.success ? {} : { 'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString() }),
  }
}

/**
 * Helper function to get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Apply rate limiting to an API route handler
 * Usage: const result = await rateLimit(request, RATE_LIMIT_CONFIGS.auth)
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): Promise<RateLimitResult> {
  const ip = getClientIP(request)
  return checkRateLimit(ip, config)
}

/**
 * Apply rate limiting by user ID (for authenticated routes)
 */
export async function rateLimitByUser(
  userId: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): Promise<RateLimitResult> {
  return checkRateLimit(`user:${userId}`, config)
}
