---
id: REFACTOR-0005
title: Standardize API response format across all endpoints
status: backlog
priority: high
category: refactoring
component: api
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Standardize API Response Format

## Summary

API endpoints return inconsistent response structures. Some return raw data, some wrap in `{ data }`, some use `{ success, error }`. This makes frontend error handling complex and error-prone. A standardized response envelope will improve developer experience and error handling.

## Current Behavior

```typescript
// Some routes return raw data
return Response.json(activities)

// Some wrap in success/data
return Response.json({ success: true, data: user })

// Some use error messages differently
return Response.json({ error: 'Not found' }, { status: 404 })
return Response.json({ message: 'Forbidden' }, { status: 403 })
return new Response('Internal error', { status: 500 })
```

Frontend has to handle multiple patterns:
```typescript
const res = await fetch('/api/activities')
const data = await res.json()
// Is data the array? Is it data.data? Is it data.activities?
```

## Expected Behavior

All API responses follow consistent envelope:

```typescript
// Success response
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    totalPages?: number,
    total?: number
  }
}

// Error response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

## Acceptance Criteria

- [ ] Create response utility functions in `src/lib/api/response.ts`
- [ ] Define TypeScript types for standard responses
- [ ] Create error code enum for consistent error identification
- [ ] Migrate at least 20 high-traffic API routes to new format
- [ ] Document response format in API docs
- [ ] Update frontend to use consistent error handling

## Technical Approach

### 1. Define Response Types

```typescript
// src/lib/api/types.ts
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    page?: number
    pageSize?: number
    totalPages?: number
    total?: number
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export enum ApiErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
}
```

### 2. Create Response Helpers

```typescript
// src/lib/api/response.ts
import { NextResponse } from 'next/server'
import { ApiErrorCode, ApiSuccessResponse, ApiErrorResponse } from './types'

export function success<T>(data: T, meta?: ApiSuccessResponse<T>['meta']): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  })
}

export function paginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    },
  })
}

export function error(
  code: ApiErrorCode,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details && { details }) },
    },
    { status }
  )
}

// Common error shortcuts
export const errors = {
  unauthorized: (message = 'Authentication required') =>
    error(ApiErrorCode.UNAUTHORIZED, message, 401),
  
  forbidden: (message = 'Access denied') =>
    error(ApiErrorCode.FORBIDDEN, message, 403),
  
  notFound: (resource = 'Resource') =>
    error(ApiErrorCode.NOT_FOUND, `${resource} not found`, 404),
  
  validation: (message: string, details?: unknown) =>
    error(ApiErrorCode.VALIDATION_ERROR, message, 400, details),
  
  internal: (message = 'Internal server error') =>
    error(ApiErrorCode.INTERNAL_ERROR, message, 500),
  
  rateLimited: (resetTime: number) =>
    error(ApiErrorCode.RATE_LIMITED, 'Rate limit exceeded', 429, { resetTime }),
}
```

### 3. Usage Example

```typescript
// src/app/api/activities/route.ts
import { success, paginated, errors } from '@/lib/api/response'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return errors.unauthorized()
  }

  const { searchParams } = request.nextUrl
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 20

  try {
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activity.count(),
    ])

    return paginated(activities, page, pageSize, total)
  } catch (err) {
    logger.error('Failed to fetch activities', { error: err })
    return errors.internal()
  }
}
```

### 4. Frontend Helper

```typescript
// src/lib/api/client.ts
import { ApiResponse, ApiErrorCode } from './types'

export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T } | { error: { code: ApiErrorCode; message: string } }> {
  const res = await fetch(url, options)
  const json: ApiResponse<T> = await res.json()

  if (json.success) {
    return { data: json.data }
  }
  
  return { error: json.error }
}

// Usage:
const result = await apiRequest<Activity[]>('/api/activities')
if ('error' in result) {
  toast.error(result.error.message)
} else {
  setActivities(result.data)
}
```

## Migration Priority

1. Auth routes (`/api/auth/*`)
2. Activities routes (`/api/activities/*`)
3. Groups routes (`/api/groups/*`)
4. User routes (`/api/user/*`)
5. Remaining routes

## Related Files

- All `src/app/api/**/*.ts` files
- Frontend components that call APIs

## Dependencies

**Blocked By:**
- None

**Blocks:**
- REFACTOR-0001 (React Query) - benefits from consistent response format

## Notes

- Consider Zod for runtime validation of responses
- May want to add request ID to responses for debugging
- Consider versioning API responses (`apiVersion: '1'`)

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on API analysis |
