---
id: TECH-0005
title: Implement structured logging infrastructure
status: backlog
priority: critical
category: tech-debt
component: observability
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Implement Structured Logging Infrastructure

## Summary

The codebase has **239 console.log/error/warn calls across 160 API files**. In production, console logs don't provide structured data, log levels, traceability, or proper aggregation. Implementing a proper logging library (pino or winston) will improve debugging, monitoring, and incident response.

## Current Behavior

```typescript
// Typical current pattern (found everywhere)
console.log('[RateLimit] Redis error:', err.message)
console.error('Error fetching activities:', error)
console.warn('[Instrumentation] Workers disabled')
```

Problems:
- No log levels in production builds
- No structured JSON for log aggregation (CloudWatch, Datadog, etc.)
- No request ID tracing
- No performance metrics
- Logs get stripped in production Next.js builds

## Expected Behavior

```typescript
import { logger } from '@/lib/logger'

// Structured logging with context
logger.info('Rate limit check', { 
  userId: 'user-123',
  endpoint: '/api/activities',
  remaining: 45 
})

logger.error('Failed to fetch activities', { 
  error: error.message,
  stack: error.stack,
  activityId: id 
})

// Request-scoped logging
logger.child({ requestId: req.headers['x-request-id'] })
  .info('Processing request')
```

Output (JSON for production):
```json
{
  "level": "info",
  "time": 1705567200000,
  "msg": "Rate limit check",
  "userId": "user-123",
  "endpoint": "/api/activities",
  "remaining": 45,
  "requestId": "abc-123"
}
```

## Acceptance Criteria

- [ ] Install and configure `pino` (fast, JSON-native)
- [ ] Create `src/lib/logger.ts` with configured logger instance
- [ ] Add log levels: error, warn, info, debug
- [ ] Configure different formats for dev (pretty) vs prod (JSON)
- [ ] Replace at least 50% of console.log calls with logger
- [ ] Add request ID to all API route logs
- [ ] Document logging conventions

## Technical Approach

### 1. Install Dependencies

```bash
npm install pino pino-pretty
npm install -D @types/pino
```

### 2. Create Logger Module

```typescript
// src/lib/logger.ts
import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  
  // Pretty print in development
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard',
    }
  } : undefined,

  // Base context for all logs
  base: {
    env: process.env.NODE_ENV,
    service: 'smile-next',
  },

  // Custom serializers
  serializers: {
    error: pino.stdSerializers.err,
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-request-id': req.headers['x-request-id'],
      },
    }),
  },
})

// Create child logger for specific components
export const createLogger = (component: string) => 
  logger.child({ component })

// Pre-configured component loggers
export const apiLogger = createLogger('api')
export const queueLogger = createLogger('queue')
export const authLogger = createLogger('auth')
export const aiLogger = createLogger('ai')
```

### 3. API Route Helper

```typescript
// src/lib/logger.ts (continued)
import { NextRequest } from 'next/server'

export function getRequestLogger(req: NextRequest, component = 'api') {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
  return logger.child({
    component,
    requestId,
    path: req.nextUrl.pathname,
    method: req.method,
  })
}
```

### 4. Usage in API Routes

```typescript
// src/app/api/activities/route.ts
import { getRequestLogger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const log = getRequestLogger(request, 'activities')
  
  log.info('Fetching activities', { query: Object.fromEntries(request.nextUrl.searchParams) })
  
  try {
    const activities = await prisma.activity.findMany(...)
    log.info('Activities fetched', { count: activities.length })
    return Response.json(activities)
  } catch (error) {
    log.error('Failed to fetch activities', { error })
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 5. Migration Script

```bash
# Find all console.log calls for manual review
grep -r "console\.(log|error|warn)" src/app/api --include="*.ts" > console-log-audit.txt
```

## Log Level Guidelines

| Level | Use Case |
|-------|----------|
| `error` | Exceptions, failed operations, data corruption |
| `warn` | Degraded service, fallbacks, rate limits hit |
| `info` | Significant events: request start/end, user actions |
| `debug` | Detailed debugging info (dev only) |

## Related Files

- `src/lib/rateLimit.ts` - Replace console.log/error
- `src/lib/queue/workers/*.ts` - Replace console.log
- `src/instrumentation.ts` - Replace console.log
- All `src/app/api/**/*.ts` files

## Dependencies

**Blocked By:**
- None

**Blocks:**
- Future monitoring/alerting setup

## Notes

- Pino is fastest for Node.js logging
- JSON logs integrate well with CloudWatch, Datadog, etc.
- Consider adding log sampling for high-volume routes
- May want to add OpenTelemetry later for tracing

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on codebase analysis |
