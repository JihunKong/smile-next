---
id: REFACTOR-0001
title: Implement React Query for data fetching across the application
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: xl
assignee: ai-agent
---

# Implement React Query for Data Fetching

## Summary

React Query (`@tanstack/react-query`) is installed but completely unused. The codebase has 123+ raw `fetch()` calls with manual `useState`/`useEffect` patterns. This causes significant code duplication, inconsistent error handling, and potential race conditions. Implementing React Query will reduce boilerplate by ~50% and provide automatic caching, refetching, and error handling.

## Current Behavior

Every component that fetches data:
1. Declares separate `useState` for data, loading, and error
2. Uses `useCallback` for the fetch function
3. Manages loading/error states manually
4. Has no caching or request deduplication
5. Risk of race conditions with rapid navigation

Example from `activities-client.tsx`:
```typescript
const [activities, setActivities] = useState<ActivityWithGroup[]>(initialActivities)
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

const fetchActivities = useCallback(async (page: number = 1) => {
  setLoading(true)
  try {
    const response = await fetch(`/api/activities/search?${params}`)
    // ... handle response
  } catch (error) {
    console.error('Error fetching activities:', error)
  } finally {
    setLoading(false)
  }
}, [searchQuery, modeFilter, sortBy])
```

## Expected Behavior

Components use React Query hooks with automatic caching:
```typescript
const { data: activities, isLoading, error } = useActivities({
  search: searchQuery,
  mode: modeFilter,
  sort: sortBy,
  page,
})
```

Benefits:
- Automatic caching and deduplication
- Built-in loading/error states
- Automatic refetching on focus
- Optimistic updates for mutations
- Request cancellation (prevents race conditions)

## Acceptance Criteria

- [ ] `QueryClientProvider` added to `src/components/Providers.tsx`
- [ ] Query client configured with sensible defaults (staleTime, retry)
- [ ] Core query hooks created in `src/lib/queries/`
  - [ ] `useActivities`, `useActivity`
  - [ ] `useGroups`, `useGroup`
  - [ ] `useQuestions`, `useQuestion`
- [ ] Core mutation hooks created
  - [ ] `useCreateActivity`, `useUpdateActivity`, `useDeleteActivity`
  - [ ] `useCreateQuestion`
  - [ ] `useCreateResponse`
- [ ] At least 3 major pages migrated:
  - [ ] Activities list page
  - [ ] Groups list page
  - [ ] Dashboard page
- [ ] Old fetch patterns documented for migration reference
- [ ] Documentation updated with new data fetching patterns

## Technical Approach

### 1. Set up QueryClientProvider

```typescript
// src/components/Providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  )
}
```

### 2. Create Query Hooks

```typescript
// src/lib/queries/activities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

interface ActivitySearchParams {
  search?: string
  mode?: string
  sort?: string
  page?: number
}

export function useActivities(params: ActivitySearchParams) {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => api.get('/api/activities/search', params),
  })
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => api.get(`/api/activities/${id}`),
    enabled: !!id,
  })
}

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

### 3. Migration Strategy

1. Start with read-only queries (activities list, groups list)
2. Add mutations with cache invalidation
3. Migrate page by page, testing each
4. Remove old `useState`/`useEffect` patterns

## Related Files

- `src/components/Providers.tsx` - Add QueryClientProvider
- `src/app/(dashboard)/activities/activities-client.tsx` - First migration target
- `src/app/(dashboard)/groups/groups-client.tsx` - Second migration target
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard migration

## Dependencies

**Blocked By:**
- None

**Blocks:**
- REFACTOR-0002 (UI Components) - will benefit from Query-based patterns
- BUG-0003 (Race Conditions) - will be fixed by React Query

## Notes

- React Query v5 is already installed (`@tanstack/react-query: ^5.90.16`)
- Consider adding React Query DevTools for development
- May need to coordinate with server actions for some mutations

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on codebase analysis |
