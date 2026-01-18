---
id: FEAT-0003
title: Add Next.js middleware for cross-cutting concerns
status: backlog
priority: high
category: feature
component: api
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Add Next.js Middleware for Cross-Cutting Concerns

## Summary

The project has no `middleware.ts` file. Cross-cutting concerns like authentication checks, rate limiting, request logging, and CORS are handled inline in each API route. This leads to code duplication and inconsistent implementation. Next.js middleware can centralize these concerns.

## Current Behavior

Each API route manually handles:
- Session/auth verification
- Rate limiting
- Request logging
- CORS headers

```typescript
// Duplicated across 100+ routes
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const rateLimitResult = await rateLimit(request)
  if (!rateLimitResult.success) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }
  
  // Actual logic...
}
```

## Expected Behavior

Middleware handles common concerns before routes execute:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Add request ID
  // Check rate limits (cached)
  // Verify auth for protected routes
  // Add security headers
  // Log request
}
```

Routes become focused on business logic:
```typescript
export async function GET(request: NextRequest) {
  // Auth already verified by middleware
  // Rate limit already checked
  // Just focus on the actual logic
}
```

## Acceptance Criteria

- [ ] Create `src/middleware.ts` with matcher configuration
- [ ] Implement request ID injection for all requests
- [ ] Add security headers (CSP, HSTS, etc.) to responses
- [ ] Protect `/api/*` routes with session verification
- [ ] Define public routes that skip auth (login, register, etc.)
- [ ] Add request logging with timing
- [ ] Document protected vs public routes

## Technical Approach

### 1. Create Middleware

```typescript
// src/middleware.ts
import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public routes that don't require auth
const publicRoutes = [
  '/api/auth',
  '/api/health',
  '/api/invites',
  '/api/certificates/browse',
  '/api/contact',
]

// Routes that require auth
const protectedApiRoutes = [
  '/api/activities',
  '/api/groups',
  '/api/user',
  '/api/admin',
  '/api/questions',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  // 1. Add request ID header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)

  // 2. Check if API route needs auth
  if (pathname.startsWith('/api/')) {
    const isPublic = publicRoutes.some(route => pathname.startsWith(route))
    
    if (!isPublic && protectedApiRoutes.some(route => pathname.startsWith(route))) {
      const token = await getToken({ req: request })
      
      if (!token) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401, headers: { 'x-request-id': requestId } }
        )
      }
      
      // Add user info to headers for routes to use
      requestHeaders.set('x-user-id', token.sub || '')
      requestHeaders.set('x-user-email', token.email || '')
    }
  }

  // 3. Check protected pages
  const protectedPages = ['/dashboard', '/activities', '/groups', '/profile', '/admin']
  if (protectedPages.some(page => pathname.startsWith(page))) {
    const token = await getToken({ req: request })
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 4. Create response with security headers
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Security headers
  response.headers.set('x-request-id', requestId)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Log request (could be async/fire-and-forget)
  if (process.env.NODE_ENV === 'production') {
    const duration = Date.now() - startTime
    console.log(JSON.stringify({
      type: 'request',
      requestId,
      method: request.method,
      path: pathname,
      duration,
      timestamp: new Date().toISOString(),
    }))
  }

  return response
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match protected pages
    '/dashboard/:path*',
    '/activities/:path*',
    '/groups/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/certificates/:path*',
  ],
}
```

### 2. Simplify API Routes

After middleware:
```typescript
// src/app/api/activities/route.ts
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Middleware already verified auth, but we might need user details
  const userId = request.headers.get('x-user-id')
  
  // Focus on business logic only
  const activities = await prisma.activity.findMany({
    where: { creatorId: userId },
  })
  
  return success(activities)
}
```

### 3. Rate Limiting in Middleware (Optional)

```typescript
// For high-traffic routes, could add rate limiting in middleware
// But keep it simple - only for specific paths
const rateLimitedPaths = ['/api/ai/', '/api/questions/']

if (rateLimitedPaths.some(p => pathname.startsWith(p))) {
  const ip = request.ip || request.headers.get('x-forwarded-for')
  // Quick rate limit check using Edge-compatible method
}
```

## Considerations

- Middleware runs on every matched request - keep it fast
- Don't do heavy database queries in middleware
- Use Edge Runtime compatible code (no Node.js APIs)
- Auth token check is already cached by next-auth

## Related Files

- All `src/app/api/**/*.ts` files (will be simplified)
- `src/lib/auth/config.ts` - Auth configuration
- `src/lib/rateLimit.ts` - Could be used in middleware

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- Middleware runs on Edge Runtime by default
- Consider using `next-auth` middleware helpers
- Test thoroughly - middleware errors affect all routes
- May want to exclude static files from matcher

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on codebase analysis |
