---
id: REFACTOR-0003
title: Create unified API client with error handling
status: backlog
priority: medium
category: refactoring
component: api
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Create Unified API Client

## Summary

API calls use raw `fetch()` with inconsistent error handling. A centralized API client will provide consistent error handling, automatic JSON parsing, and request/response interceptors.

## Current Behavior

- Direct `fetch()` calls everywhere
- Inconsistent error handling per component
- No centralized request configuration
- No automatic retry logic
- Headers duplicated in each call

## Expected Behavior

- Single API client for all requests
- Consistent error types (`APIError`)
- Automatic JSON parsing
- Request interceptors (add auth headers)
- Response interceptors (handle common errors)
- Type-safe responses

## Acceptance Criteria

- [ ] API client created in `src/lib/api/client.ts`
- [ ] Custom `APIError` class with status codes
- [ ] Automatic JSON parsing
- [ ] Works well with React Query
- [ ] TypeScript generics for responses

## Technical Approach

```typescript
// src/lib/api/client.ts
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new APIError(response.status, error.error || 'Request failed', error.code)
  }

  return response.json()
}

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) => {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>)}` : ''
    return request<T>(`${url}${queryString}`)
  },
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}
```

## Related Files

- All components making API calls
- `src/lib/queries/` (when created)

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation |
