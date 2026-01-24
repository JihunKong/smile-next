---
id: VIBE-0008-WI03
title: useUserProfile Hook
status: backlog
effort: s
dependencies: [VIBE-0008-WI01]
---

# WI-03: useUserProfile Hook

## Description

Create a hook for read-only profile data aggregation (used by profile/page.tsx).

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/user/hooks/useUserProfile.test.ts`

```typescript
describe('useUserProfile', () => {
  describe('Initial State', () => {
    it('should start with loading true')
    it('should have null profile initially')
    it('should have null stats initially')
    it('should have null badges initially')
  })

  describe('Data Fetching', () => {
    it('should fetch from /api/user/profile on mount')
    it('should fetch from /api/user/profile/stats on mount')
    it('should fetch from /api/user/badges on mount')
    it('should aggregate all data correctly')
    it('should handle partial failures gracefully')
    it('should set loading to false after all fetches')
  })

  describe('Computed Properties', () => {
    it('should compute displayName from firstName/lastName')
    it('should compute initials from name or email')
    it('should compute memberSince date')
  })

  describe('Optional User ID', () => {
    it('should fetch own profile when no userId provided')
    it('should fetch other user profile when userId provided')
  })

  describe('Refresh', () => {
    it('should refetch data when refresh is called')
  })
})
```

### 2. Implement Hook

**File:** `src/features/user/hooks/useUserProfile.ts`

```typescript
interface UseUserProfileReturn {
  profile: UserProfile | null
  stats: UserStats | null
  badges: BadgeData | null
  loading: boolean
  error: string | null
  displayName: string
  initials: string
  memberSince: string
  tierInfo: LevelTier | null
  refresh: () => Promise<void>
}
```

## Source Reference

Extract logic from `profile/page.tsx`:
- Lines 134-161: `fetchData` function
- Lines 168-174: Display name and initials computation

## Files to Create

- `tests/unit/features/user/hooks/useUserProfile.test.ts`
- `src/features/user/hooks/useUserProfile.ts`

## Files to Modify

- `src/features/user/hooks/index.ts` (add export)

## Acceptance Criteria

- [ ] All test cases pass
- [ ] Hook is under 100 lines
- [ ] Handles all three API endpoints
