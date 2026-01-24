---
id: VIBE-0008-WI02
title: useUserSettings Hook
status: backlog
effort: m
dependencies: [VIBE-0008-WI01]
---

# WI-02: useUserSettings Hook

## Description

Extract all settings page data fetching and mutation logic into a reusable hook.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/user/hooks/useUserSettings.test.ts`

```typescript
describe('useUserSettings', () => {
  describe('Initial State', () => {
    it('should start with loading true')
    it('should have null user initially')
    it('should have null error initially')
  })

  describe('Data Fetching', () => {
    it('should fetch user profile on mount')
    it('should fetch user preferences on mount')
    it('should set loading to false after fetch')
    it('should populate user data on successful fetch')
    it('should set error on failed fetch')
    it('should merge profile and preferences data')
  })

  describe('updateProfile', () => {
    it('should send PUT request to /api/user/profile')
    it('should update local state on success')
    it('should set saving to true during request')
    it('should handle validation errors')
    it('should preserve unchanged fields')
  })

  describe('updatePreferences', () => {
    it('should send PATCH request to /api/user/preferences')
    it('should update local preferences on success')
    it('should handle partial updates')
  })

  describe('updatePassword', () => {
    it('should validate password length >= 6')
    it('should validate passwords match')
    it('should send POST to /api/auth/password/change')
    it('should clear form on success')
    it('should handle incorrect current password error')
  })

  describe('deleteAccount', () => {
    it('should send DELETE to /api/user/delete')
    it('should redirect on success')
    it('should handle errors')
  })
})
```

### 2. Implement Hook

**File:** `src/features/user/hooks/useUserSettings.ts`

```typescript
interface UseUserSettingsReturn {
  user: UserProfile | null
  preferences: UserPreferences | null
  loading: boolean
  saving: boolean
  error: string | null
  message: { type: 'success' | 'error'; text: string } | null
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  updatePreferences: (data: Partial<UserPreferences>) => Promise<void>
  updatePassword: (current: string, newPass: string, confirm: string) => Promise<void>
  deleteAccount: () => Promise<void>
  clearMessage: () => void
}
```

## Source Reference

Extract logic from `settings/page.tsx`:
- Lines 78-131: `fetchProfile` and `fetchPreferences`
- Lines 133-158: `handleAccountSubmit`
- Lines 160-200: `handlePasswordSubmit`
- Lines 202-224: `handleDeleteAccount`

## Files to Create

- `tests/unit/features/user/hooks/useUserSettings.test.ts`
- `tests/unit/features/user/hooks/fixtures.ts`
- `src/features/user/hooks/useUserSettings.ts`

## Files to Modify

- `src/features/user/hooks/index.ts` (add export)

## Acceptance Criteria

- [ ] All test cases pass
- [ ] Hook is under 150 lines
- [ ] No direct fetch calls remain in `settings/page.tsx` by WI-5
