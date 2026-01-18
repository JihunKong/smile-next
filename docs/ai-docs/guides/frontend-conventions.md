---
id: frontend-conventions
title: Frontend Development Conventions
category: guides
lastUpdated: 2026-01-18
maintainedBy: ai-agent
version: 1.0.0
relatedDocs:
  - id: REFACTOR-0001
    type: implements
  - id: REFACTOR-0002
    type: implements
  - id: REFACTOR-0005
    type: implements
tags:
  - conventions
  - frontend
  - best-practices
---

# Frontend Development Conventions

> **Purpose**: Establish consistent patterns to prevent common UX bugs  
> **Audience**: AI agents and developers  
> **Status**: Proposed - implement as refactoring items are completed

## Overview

This guide documents the patterns and conventions to follow when building frontend features. Following these conventions prevents the most common UX bugs:

- Inconsistent loading states
- Unfriendly error messages
- Race conditions in data fetching
- Visual inconsistencies

---

## 1. Data Fetching

### ❌ DON'T: Manual useState/useEffect Patterns

```typescript
// BAD: Leads to race conditions, duplicated state logic, no caching
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

useEffect(() => {
  setLoading(true)
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false))
}, [deps])
```

**Problems:**
- No request cancellation → race conditions when deps change rapidly
- State management boilerplate in every component
- No caching or deduplication
- Inconsistent loading/error handling

### ✅ DO: Use React Query Hooks

```typescript
// GOOD: Automatic caching, cancellation, retry, and consistent states
import { useActivities } from '@/lib/queries/activities'

function ActivitiesList({ filter }) {
  const { data, isLoading, error, refetch } = useActivities(filter)
  
  if (isLoading) return <LoadingState message="Loading activities..." />
  if (error) return <ErrorState message={getUserFriendlyError(error)} onRetry={refetch} />
  
  return <ActivityGrid activities={data} />
}
```

**Benefits:**
- Automatic request cancellation (no race conditions)
- Built-in caching and deduplication
- Consistent loading/error states
- Easy refetch and optimistic updates

### Query Hook Pattern

```typescript
// src/lib/queries/[resource].ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

// Read hook with parameters
export function useActivities(params: ActivitySearchParams) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => api.get<Activity[]>('/api/activities/search', params),
    staleTime: 60_000, // 1 minute
  })
}

// Single resource hook
export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => api.get<Activity>(`/api/activities/${id}`),
    enabled: !!id,
  })
}

// Mutation with cache invalidation
export function useCreateActivity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateActivityData) => api.post('/api/activities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
```

**See:** [REFACTOR-0001](../backlog/critical/REFACTOR-0001-react-query-data-fetching.md)

---

## 2. Loading States

### ❌ DON'T: Inline Spinners with Varying Styles

```typescript
// BAD: Copy-pasted SVGs with inconsistent colors/sizes
{loading && (
  <svg className="animate-spin h-5 w-5 text-green-500" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z..." />
  </svg>
)}
```

**Problems:**
- 50+ copies of the same SVG with slight variations
- Inconsistent sizes (h-4, h-5, h-6, h-10...)
- Inconsistent colors (green, gray, cardinal, currentColor...)
- No consistent loading message patterns

### ✅ DO: Use LoadingState Component

```typescript
// GOOD: Consistent, accessible, branded loading experience
import { LoadingState } from '@/components/ui'

// Full page loading
if (isLoading) return <LoadingState message="Loading activities..." fullPage />

// Inline loading (button)
<Button isLoading={submitting}>Save Changes</Button>

// Section loading
<Card>
  {isLoading ? (
    <LoadingState message="Loading responses..." />
  ) : (
    <ResponseList responses={data} />
  )}
</Card>
```

### Loading State Sizes

| Context | Size | Example |
|---------|------|---------|
| Buttons | `sm` | Save button while submitting |
| Cards/Sections | `md` | Loading data inside a panel |
| Full Page | `lg` | Initial page load |

**See:** [REFACTOR-0002](../backlog/critical/REFACTOR-0002-ui-component-library.md)

---

## 3. Error Handling

### ❌ DON'T: Technical Errors or Silent Failures

```typescript
// BAD: Technical message exposed to users
catch (error) {
  setError('Failed to fetch activities')  // Unhelpful
  console.error(error)  // Only in console, user sees nothing
}

// BAD: Error silently ignored
catch {
  // nothing - user thinks it worked
}
```

**Problems:**
- Users see technical messages they can't act on
- Some errors only logged to console
- No retry or recovery options
- Inconsistent error UI across pages

### ✅ DO: User-Friendly Errors with Recovery Options

```typescript
// GOOD: Map technical errors to friendly messages
import { getUserFriendlyError } from '@/lib/utils/errorMessages'
import { ErrorState } from '@/components/ui'

// In components
if (error) {
  return (
    <ErrorState 
      message={getUserFriendlyError(error)}
      onRetry={() => refetch()}
      showSupport={error.status >= 500}
    />
  )
}

// In mutations
const { mutate, error } = useCreateActivity()

useEffect(() => {
  if (error) {
    toast.error(getUserFriendlyError(error))
  }
}, [error])
```

### Error Message Mapping

```typescript
// src/lib/utils/errorMessages.ts
const errorMessages: Record<string, string> = {
  'Unauthorized': 'Please log in to continue.',
  'Forbidden': "You don't have permission to do this.",
  'Not Found': 'The requested item could not be found.',
  'Failed to fetch': 'Unable to connect. Check your internet connection.',
  'Network Error': 'Connection problem. Please try again.',
  'Internal Server Error': 'Something went wrong on our end. Please try again later.',
}

export function getUserFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return errorMessages[message] || 'Something went wrong. Please try again.'
}
```

### Error Boundary for Render Crashes

```typescript
// Wrap major sections to prevent full-page crashes
<ErrorBoundary fallback={<ErrorState message="Something went wrong" />}>
  <ActivityDetail />
</ErrorBoundary>
```

**See:** [BUG-0002](../backlog/high/BUG-0002-unfriendly-error-messages.md), [TECH-0001](../backlog/high/TECH-0001-react-error-boundaries.md)

---

## 4. API Responses

### ❌ DON'T: Inconsistent Response Shapes

```typescript
// BAD: Different endpoints return different shapes
// Some return raw data
return Response.json(activities)

// Some wrap in success
return Response.json({ success: true, data: user })

// Error formats vary
return Response.json({ error: 'Not found' }, { status: 404 })
return Response.json({ message: 'Forbidden' }, { status: 403 })
```

### ✅ DO: Standard Response Envelope

```typescript
// GOOD: All responses follow same structure
import { success, paginated, errors } from '@/lib/api/response'

// Success response
return success(activity)
// → { success: true, data: {...} }

// Paginated response  
return paginated(activities, page, pageSize, total)
// → { success: true, data: [...], meta: { page, totalPages, total } }

// Error responses
return errors.notFound('Activity')
// → { success: false, error: { code: 'NOT_FOUND', message: 'Activity not found' } }

return errors.validation('Invalid email format', { field: 'email' })
// → { success: false, error: { code: 'VALIDATION_ERROR', message: '...', details: {...} } }
```

**See:** [REFACTOR-0005](../backlog/high/REFACTOR-0005-api-response-standardization.md)

---

## 5. UI Components

### ❌ DON'T: Inline Styles or Duplicate Components

```typescript
// BAD: Inline button styles varying across pages
<button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
<button className="px-3 py-1.5 bg-[var(--stanford-cardinal)] text-white rounded-lg">Submit</button>
<button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-md">Delete</button>
```

### ✅ DO: Use Shared Component Library

```typescript
// GOOD: Consistent, accessible components
import { Button, Card, Input, Modal } from '@/components/ui'

<Button variant="primary">Save</Button>
<Button variant="danger" isLoading={deleting}>Delete</Button>
<Button variant="ghost" leftIcon={<ArrowLeft />}>Back</Button>

<Card>
  <Card.Header>Settings</Card.Header>
  <Card.Body>
    <Input label="Email" error={errors.email} />
  </Card.Body>
</Card>
```

### Component Variants

| Component | Variants | Sizes |
|-----------|----------|-------|
| Button | primary, secondary, danger, ghost | sm, md, lg |
| LoadingSpinner | - | sm, md, lg |
| Badge | success, warning, error, info, neutral | sm, md |
| Card | default, bordered | - |

**See:** [REFACTOR-0002](../backlog/critical/REFACTOR-0002-ui-component-library.md)

---

## 6. Form Handling

### ❌ DON'T: Client-Side Validation Only on Submit

```typescript
// BAD: No validation until form submit
const handleSubmit = async () => {
  if (!email) {
    setError('Email required')  // Too late
    return
  }
  await api.post('/users', { email })
}
```

### ✅ DO: Real-Time Validation with Zod

```typescript
// GOOD: Schema validation with immediate feedback
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

function UserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur for immediate feedback
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} error={errors.email?.message} />
      <Input {...register('name')} error={errors.name?.message} />
      <Button type="submit">Create User</Button>
    </form>
  )
}
```

**See:** [REFACTOR-0004](../backlog/medium/REFACTOR-0004-client-side-form-validation.md)

---

## Quick Reference Checklist

When implementing a new feature, verify:

- [ ] **Data fetching uses React Query hooks**, not manual useState/useEffect
- [ ] **Loading states use `LoadingState` or `LoadingSpinner`** component
- [ ] **Errors are user-friendly** with recovery options (retry, go back)
- [ ] **API routes use standard response helpers** (`success()`, `errors.xxx()`)
- [ ] **UI uses shared components** from `@/components/ui`
- [ ] **Forms use Zod validation** with real-time feedback
- [ ] **Error boundaries wrap** major sections

---

## Related Backlog Items

| ID | Title | Status |
|----|-------|--------|
| [REFACTOR-0001](../backlog/critical/REFACTOR-0001-react-query-data-fetching.md) | React Query for data fetching | backlog |
| [REFACTOR-0002](../backlog/critical/REFACTOR-0002-ui-component-library.md) | UI component library | backlog |
| [REFACTOR-0005](../backlog/high/REFACTOR-0005-api-response-standardization.md) | API response standardization | backlog |
| [BUG-0002](../backlog/high/BUG-0002-unfriendly-error-messages.md) | User-friendly error messages | backlog |
| [TECH-0001](../backlog/high/TECH-0001-react-error-boundaries.md) | Error boundaries | backlog |

---

*This guide should be updated as conventions are implemented and refined.*
