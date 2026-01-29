---
id: VIBE-0007-WI02
title: useCertificates Hook
status: backlog
effort: s
dependencies: [VIBE-0007-WI01]
---

# WI-002: useCertificates Hook

## Description

Extract certificate list fetching logic from `browse/page.tsx` into a reusable hook.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/hooks/useCertificates.test.ts`

```typescript
describe('useCertificates', () => {
  describe('Initial State', () => {
    it('returns loading=true initially')
    it('returns empty certificates array initially')
    it('returns null error initially')
  })
  
  describe('Data Fetching', () => {
    it('fetches certificates on mount')
    it('sets loading=false after fetch completes')
    it('populates certificates array on successful fetch')
    it('handles empty response gracefully')
  })
  
  describe('Filtering', () => {
    it('filters by search query')
    it('debounces search input')
    it('filters by status')
  })
  
  describe('Sorting', () => {
    it('sorts by name ascending')
    it('sorts by name descending')
    it('sorts by date created')
  })
  
  describe('Error Handling', () => {
    it('sets error on fetch failure')
    it('provides retry function')
  })
})
```

### 2. Implement Hook

**File:** `src/features/certificates/hooks/useCertificates.ts`

```typescript
interface UseCertificatesOptions {
  initialSearch?: string
  initialStatus?: CertificateStatus | 'all'
  initialSort?: SortOption
}

interface UseCertificatesReturn {
  certificates: Certificate[]
  loading: boolean
  error: Error | null
  search: string
  setSearch: (query: string) => void
  status: CertificateStatus | 'all'
  setStatus: (status: CertificateStatus | 'all') => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  refetch: () => Promise<void>
}

export function useCertificates(options?: UseCertificatesOptions): UseCertificatesReturn
```

## Acceptance Criteria

- [ ] All tests pass
- [ ] Hook can be used in browse page
- [ ] Browse page code reduced by ~100 lines
