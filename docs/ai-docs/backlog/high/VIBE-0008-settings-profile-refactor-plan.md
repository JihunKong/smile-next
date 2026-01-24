# VIBE-0008: Settings & Profile Refactor - Implementation Plan

> **Parent Ticket:** [VIBE-0008-settings-profile-refactor.md](../backlog/high/VIBE-0008-settings-profile-refactor.md)  
> **Created:** 2026-01-23  
> **Approach:** Test-Driven Development (TDD)  
> **Total Work Items:** 9

---

## Overview

This implementation plan breaks down the Settings & Profile refactor (2,474+ lines across 6+ files) into 9 discrete work items. Each work item follows a TDD approach:

1. **Write failing tests first** (Red)
2. **Implement minimal code to pass tests** (Green)
3. **Refactor for clean code** (Refactor)

---

## Work Items Summary

| # | Work Item | Priority | Est. Time | Dependencies |
|---|-----------|----------|-----------|--------------|
| 1 | Create `features/user` module structure | P0 | 15 min | None |
| 2 | Implement & test `useUserSettings` hook | P1 | 1.5 hr | WI-1 |
| 3 | Implement & test `useUserProfile` hook | P1 | 1.5 hr | WI-1 |
| 4 | Extract & test Settings section components | P2 | 2 hr | WI-2 |
| 5 | Refactor `settings/page.tsx` to use new components | P2 | 1 hr | WI-4 |
| 6 | Extract & test Profile section components | P2 | 2.5 hr | WI-3 |
| 7 | Refactor `profile/page.tsx` to use new components | P2 | 1 hr | WI-6 |
| 8 | Create shared `AvatarUploader` component | P3 | 1 hr | WI-4, WI-6 |
| 9 | Refactor invite page (optional stretch) | P4 | 2 hr | None |

---

## Work Item 1: Create `features/user` Module Structure

### Objective
Set up the foundational folder structure for the user feature module.

### Tasks

1. Create directory structure:
   ```
   src/features/user/
   ├── components/
   │   ├── settings/
   │   │   └── index.ts
   │   ├── profile/
   │   │   └── index.ts
   │   └── index.ts
   ├── hooks/
   │   └── index.ts
   ├── types.ts
   └── index.ts
   ```

2. Create initial `types.ts` with shared interfaces.

3. Create barrel exports (`index.ts` files).

### Files to Create

- `src/features/user/types.ts`
- `src/features/user/index.ts`
- `src/features/user/hooks/index.ts`
- `src/features/user/components/index.ts`
- `src/features/user/components/settings/index.ts`
- `src/features/user/components/profile/index.ts`

### Acceptance Criteria

- [ ] All directories and files exist
- [ ] TypeScript compiles without errors
- [ ] `types.ts` includes `UserProfile`, `UserPreferences`, `UserStats` interfaces

---

## Work Item 2: Implement & Test `useUserSettings` Hook

### Objective
Create a custom hook that encapsulates all settings page data fetching and mutation logic.

### TDD Approach

#### Step 1: Write Tests First (RED)

Create test file: `tests/unit/features/user/hooks/useUserSettings.test.ts`

```typescript
// Tests to write BEFORE implementation:

describe('useUserSettings', () => {
  describe('Initial State', () => {
    it('starts with loading true')
    it('has null user initially')
    it('has null error initially')
  })

  describe('Data Fetching', () => {
    it('fetches user profile on mount')
    it('sets loading to false after fetch')
    it('populates user data on successful fetch')
    it('sets error on failed fetch')
  })

  describe('updateUser', () => {
    it('sends PATCH request with updated fields')
    it('updates local state on success')
    it('sets saving to true during request')
    it('handles validation errors')
    it('handles network errors')
  })

  describe('updatePassword', () => {
    it('sends POST request to password endpoint')
    it('validates password requirements')
    it('handles success')
    it('handles incorrect current password error')
  })

  describe('deleteAccount', () => {
    it('sends DELETE request')
    it('redirects on success')
    it('handles errors')
  })
})
```

#### Step 2: Implement Hook (GREEN)

Create: `src/features/user/hooks/useUserSettings.ts`

```typescript
interface UseUserSettingsReturn {
  user: UserProfile | null
  loading: boolean
  saving: boolean
  error: string | null
  updateUser: (data: Partial<UserProfile>) => Promise<void>
  updatePassword: (current: string, newPass: string) => Promise<void>
  deleteAccount: () => Promise<void>
}

export function useUserSettings(): UseUserSettingsReturn {
  // Implementation
}
```

#### Step 3: Refactor (REFACTOR)
- Extract API calls to separate functions
- Add proper TypeScript types
- Ensure error boundaries

### Files to Create

- `tests/unit/features/user/hooks/useUserSettings.test.ts`
- `tests/unit/features/user/hooks/fixtures.ts` (shared test data)
- `src/features/user/hooks/useUserSettings.ts`

### Files to Modify

- `src/features/user/hooks/index.ts` (add export)

### Acceptance Criteria

- [ ] All tests pass
- [ ] Hook handles loading, error, and success states
- [ ] Hook is exported from `@/features/user/hooks`
- [ ] No direct API calls in components using this hook

---

## Work Item 3: Implement & Test `useUserProfile` Hook

### Objective
Create a custom hook for profile page data (read-only profile data, stats, achievements).

### TDD Approach

#### Step 1: Write Tests First (RED)

Create test file: `tests/unit/features/user/hooks/useUserProfile.test.ts`

```typescript
describe('useUserProfile', () => {
  describe('Initial State', () => {
    it('starts with loading true')
    it('has null profile initially')
    it('has null stats initially')
    it('has empty achievements array initially')
  })

  describe('Data Fetching', () => {
    it('fetches profile data on mount')
    it('fetches user stats on mount')
    it('fetches achievements on mount')
    it('aggregates all data correctly')
    it('handles partial failures gracefully')
  })

  describe('Computed Properties', () => {
    it('computes displayName from firstName/lastName')
    it('computes level info from total points')
    it('computes achievement count')
  })

  describe('Optional User ID', () => {
    it('fetches own profile when no userId provided')
    it('fetches other user profile when userId provided')
  })
})
```

#### Step 2: Implement Hook (GREEN)

Create: `src/features/user/hooks/useUserProfile.ts`

```typescript
interface UseUserProfileReturn {
  profile: UserProfile | null
  stats: UserStats | null
  achievements: Achievement[]
  loading: boolean
  error: string | null
  displayName: string
  levelInfo: LevelInfo | null
}

export function useUserProfile(userId?: string): UseUserProfileReturn {
  // Implementation
}
```

### Files to Create

- `tests/unit/features/user/hooks/useUserProfile.test.ts`
- `src/features/user/hooks/useUserProfile.ts`

### Files to Modify

- `src/features/user/hooks/index.ts` (add export)

### Acceptance Criteria

- [ ] All tests pass
- [ ] Hook aggregates data from multiple endpoints
- [ ] Computed properties work correctly
- [ ] Hook supports viewing other users' profiles

---

## Work Item 4: Extract & Test Settings Section Components

### Objective
Break down the 662-line `settings/page.tsx` into focused, testable components.

### Components to Create

| Component | ~Lines | Responsibility |
|-----------|--------|----------------|
| `AccountSettings` | 120 | Name, email, username form |
| `PasswordSettings` | 100 | Password change form |
| `NotificationSettings` | 80 | Email digest, frequency toggles |
| `PrivacySettings` | 80 | Show online status, activity visibility |
| `DisplaySettings` | 60 | Theme, language, items per page |
| `DangerZone` | 60 | Delete account with confirmation |

### TDD Approach

#### Step 1: Write Tests First (RED)

Create test files for each component:

**`tests/unit/features/user/components/settings/AccountSettings.test.tsx`**
```typescript
describe('AccountSettings', () => {
  it('renders with user data pre-filled')
  it('validates required fields')
  it('calls onSave with form data on submit')
  it('shows loading state while saving')
  it('displays validation errors')
  it('disables submit when form is pristine')
})
```

**`tests/unit/features/user/components/settings/PasswordSettings.test.tsx`**
```typescript
describe('PasswordSettings', () => {
  it('requires current password')
  it('validates new password requirements')
  it('validates password confirmation matches')
  it('calls onSave with passwords on submit')
  it('clears form after successful save')
  it('displays error on incorrect current password')
})
```

**`tests/unit/features/user/components/settings/NotificationSettings.test.tsx`**
```typescript
describe('NotificationSettings', () => {
  it('renders email digest toggle')
  it('renders frequency selector when digest enabled')
  it('calls onChange when toggled')
  it('disables frequency when digest disabled')
})
```

**`tests/unit/features/user/components/settings/DangerZone.test.tsx`**
```typescript
describe('DangerZone', () => {
  it('shows confirmation modal before delete')
  it('requires typing confirmation text')
  it('disables delete until confirmed')
  it('calls onDelete when confirmed')
  it('shows loading state during deletion')
})
```

#### Step 2: Implement Components (GREEN)

Create each component with minimal implementation to pass tests.

### Files to Create

- `tests/unit/features/user/components/settings/AccountSettings.test.tsx`
- `tests/unit/features/user/components/settings/PasswordSettings.test.tsx`
- `tests/unit/features/user/components/settings/NotificationSettings.test.tsx`
- `tests/unit/features/user/components/settings/PrivacySettings.test.tsx`
- `tests/unit/features/user/components/settings/DisplaySettings.test.tsx`
- `tests/unit/features/user/components/settings/DangerZone.test.tsx`
- `src/features/user/components/settings/AccountSettings.tsx`
- `src/features/user/components/settings/PasswordSettings.tsx`
- `src/features/user/components/settings/NotificationSettings.tsx`
- `src/features/user/components/settings/PrivacySettings.tsx`
- `src/features/user/components/settings/DisplaySettings.tsx`
- `src/features/user/components/settings/DangerZone.tsx`

### Files to Modify

- `src/features/user/components/settings/index.ts` (add exports)

### Acceptance Criteria

- [ ] Each component is under 150 lines
- [ ] All tests pass
- [ ] Components are pure (receive props, emit events)
- [ ] No direct API calls in components (use callbacks)

---

## Work Item 5: Refactor `settings/page.tsx` to Use New Components

### Objective
Reduce `settings/page.tsx` from 662 lines to under 120 lines.

### Implementation

```typescript
// settings/page.tsx (~100 lines)
'use client'

import { useUserSettings } from '@/features/user/hooks'
import {
  AccountSettings,
  PasswordSettings,
  NotificationSettings,
  PrivacySettings,
  DisplaySettings,
  DangerZone,
} from '@/features/user/components/settings'
import { LoadingState } from '@/components/ui'

export default function SettingsPage() {
  const {
    user,
    loading,
    saving,
    updateUser,
    updatePassword,
    deleteAccount,
  } = useUserSettings()

  if (loading) return <LoadingState />

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <AccountSettings user={user} onSave={updateUser} saving={saving} />
      <PasswordSettings onSave={updatePassword} saving={saving} />
      <NotificationSettings
        preferences={user?.preferences}
        onChange={(prefs) => updateUser({ preferences: prefs })}
      />
      <DisplaySettings
        preferences={user?.preferences}
        onChange={(prefs) => updateUser({ preferences: prefs })}
      />
      <PrivacySettings
        preferences={user?.preferences}
        onChange={(prefs) => updateUser({ preferences: prefs })}
      />
      <DangerZone onDelete={deleteAccount} />
    </div>
  )
}
```

### Files to Modify

- `src/app/(dashboard)/settings/page.tsx` (major refactor)

### Acceptance Criteria

- [ ] Page is under 120 lines
- [ ] All existing functionality preserved
- [ ] No visual regressions
- [ ] Uses `useUserSettings` hook
- [ ] Composes section components

---

## Work Item 6: Extract & Test Profile Section Components

### Objective
Break down large profile tab components (473, 360, 356 lines) into smaller, focused ones.

### Components to Create

| Component | ~Lines | Responsibility |
|-----------|--------|----------------|
| `ProfileHeader` | 80 | Avatar, name, tier badge |
| `SmileScoreCard` | 120 | Score display, breakdown |
| `ScoreProgressBar` | 40 | Tier progress visualization |
| `PointsBreakdownChart` | 80 | Category breakdown |
| `AchievementGrid` | 100 | Badge grid display |
| `AchievementCard` | 50 | Single badge item |
| `ContributionChart` | 100 | Contribution stats |
| `ContributionStat` | 30 | Single stat item |
| `ActivityTimeline` | 100 | Recent activity list |

### TDD Approach

#### Step 1: Write Tests First (RED)

**`tests/unit/features/user/components/profile/ProfileHeader.test.tsx`**
```typescript
describe('ProfileHeader', () => {
  it('displays user avatar')
  it('displays user display name')
  it('shows tier badge with icon')
  it('shows edit button for own profile')
  it('hides edit button for other profiles')
})
```

**`tests/unit/features/user/components/profile/SmileScoreCard.test.tsx`**
```typescript
describe('SmileScoreCard', () => {
  it('displays total points')
  it('displays current tier name and icon')
  it('shows progress to next tier')
  it('displays points breakdown by category')
  it('handles max tier without next tier')
})
```

**`tests/unit/features/user/components/profile/AchievementGrid.test.tsx`**
```typescript
describe('AchievementGrid', () => {
  it('renders grid of achievements')
  it('shows empty state when no achievements')
  it('filters by category')
  it('shows earned vs locked badges')
  it('displays badge count summary')
})
```

**`tests/unit/features/user/components/profile/ContributionChart.test.tsx`**
```typescript
describe('ContributionChart', () => {
  it('displays question count')
  it('displays response count')
  it('displays activity count')
  it('shows high quality percentage')
  it('renders trend indicators')
})
```

### Files to Create

- `tests/unit/features/user/components/profile/ProfileHeader.test.tsx`
- `tests/unit/features/user/components/profile/SmileScoreCard.test.tsx`
- `tests/unit/features/user/components/profile/ScoreProgressBar.test.tsx`
- `tests/unit/features/user/components/profile/AchievementGrid.test.tsx`
- `tests/unit/features/user/components/profile/AchievementCard.test.tsx`
- `tests/unit/features/user/components/profile/ContributionChart.test.tsx`
- `tests/unit/features/user/components/profile/ContributionStat.test.tsx`
- `tests/unit/features/user/components/profile/ActivityTimeline.test.tsx`
- `src/features/user/components/profile/ProfileHeader.tsx`
- `src/features/user/components/profile/SmileScoreCard.tsx`
- `src/features/user/components/profile/ScoreProgressBar.tsx`
- `src/features/user/components/profile/PointsBreakdownChart.tsx`
- `src/features/user/components/profile/AchievementGrid.tsx`
- `src/features/user/components/profile/AchievementCard.tsx`
- `src/features/user/components/profile/ContributionChart.tsx`
- `src/features/user/components/profile/ContributionStat.tsx`
- `src/features/user/components/profile/ActivityTimeline.tsx`

### Files to Modify

- `src/features/user/components/profile/index.ts` (add exports)

### Acceptance Criteria

- [ ] Each component under 150 lines
- [ ] All tests pass
- [ ] Components are composable
- [ ] Old tab components can be deleted

---

## Work Item 7: Refactor `profile/page.tsx` to Use New Components

### Objective
Reduce `profile/page.tsx` from 523 lines to under 100 lines.

### Implementation

```typescript
// profile/page.tsx (~80 lines)
'use client'

import { useState } from 'react'
import { useUserProfile } from '@/features/user/hooks'
import {
  ProfileHeader,
  SmileScoreCard,
  AchievementGrid,
  ContributionChart,
  ActivityTimeline,
} from '@/features/user/components/profile'
import { LoadingState, Tabs, Tab } from '@/components/ui'

export default function ProfilePage() {
  const { profile, stats, achievements, loading } = useUserProfile()
  const [activeTab, setActiveTab] = useState('overview')

  if (loading) return <LoadingState />

  return (
    <div className="max-w-4xl mx-auto py-8">
      <ProfileHeader profile={profile} />
      
      <Tabs value={activeTab} onChange={setActiveTab} className="mt-6">
        <Tab value="overview">Overview</Tab>
        <Tab value="achievements">Achievements</Tab>
        <Tab value="contributions">Contributions</Tab>
        <Tab value="activity">Activity</Tab>
      </Tabs>

      <div className="mt-6">
        {activeTab === 'overview' && <SmileScoreCard stats={stats} />}
        {activeTab === 'achievements' && <AchievementGrid achievements={achievements} />}
        {activeTab === 'contributions' && <ContributionChart stats={stats} />}
        {activeTab === 'activity' && <ActivityTimeline />}
      </div>
    </div>
  )
}
```

### Files to Modify

- `src/app/(dashboard)/profile/page.tsx` (major refactor)

### Files to Delete (after verification)

- `src/app/(dashboard)/profile/components/SmileScoreTab.tsx`
- `src/app/(dashboard)/profile/components/AchievementsTab.tsx`
- `src/app/(dashboard)/profile/components/ContributionStatsTab.tsx`
- `src/app/(dashboard)/profile/components/ActivityTimelineTab.tsx`
- `src/app/(dashboard)/profile/components/` (entire directory if empty)

### Acceptance Criteria

- [ ] Page under 100 lines
- [ ] All tabs functional
- [ ] Old tab components removed
- [ ] No visual regressions
- [ ] Uses `useUserProfile` hook

---

## Work Item 8: Create Shared `AvatarUploader` Component

### Objective
Create a reusable avatar upload component for both settings and profile edit.

### TDD Approach

#### Step 1: Write Tests First (RED)

**`tests/unit/features/user/components/AvatarUploader.test.tsx`**
```typescript
describe('AvatarUploader', () => {
  describe('Display', () => {
    it('shows current avatar when provided')
    it('shows default avatar when no image')
    it('shows upload button on hover')
  })

  describe('Upload', () => {
    it('accepts image file types only')
    it('validates file size limit')
    it('shows preview before upload')
    it('calls onUpload with file')
    it('shows progress during upload')
    it('displays success state')
    it('handles upload errors')
  })

  describe('Remove', () => {
    it('shows remove option when avatar exists')
    it('calls onRemove when clicked')
    it('confirms before removing')
  })
})
```

### Files to Create

- `tests/unit/features/user/components/AvatarUploader.test.tsx`
- `src/features/user/components/AvatarUploader.tsx`

### Files to Modify

- `src/features/user/components/index.ts` (add export)
- `src/features/user/components/settings/AccountSettings.tsx` (integrate uploader)
- `src/features/user/components/profile/ProfileHeader.tsx` (integrate uploader)

### Acceptance Criteria

- [ ] Component under 100 lines
- [ ] Works in settings page
- [ ] Works in profile edit
- [ ] Handles all file validation
- [ ] Accessible (keyboard + screen reader)

---

## Work Item 9: Refactor Invite Page (Optional Stretch)

### Objective
Break down the 542-line invite page into manageable components.

### Proposed Structure

```
src/features/auth/
├── components/
│   ├── invite/
│   │   ├── InviteValidator.tsx    (~60 lines) - Loading/validation state
│   │   ├── GroupInfoCard.tsx      (~80 lines) - Group details display
│   │   ├── JoinGroupForm.tsx      (~80 lines) - For logged-in users
│   │   ├── RegisterForm.tsx       (~150 lines) - Registration form
│   │   ├── AlreadyMemberCard.tsx  (~40 lines) - Already joined state
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   └── useInvite.ts               (~100 lines) - Invite flow logic
└── types.ts
```

### TDD Approach

Write tests for:
- `useInvite` hook (invite validation, join flow, registration flow)
- `GroupInfoCard` (display group details)
- `RegisterForm` (form validation, submission)

### Files to Create

- `tests/unit/features/auth/hooks/useInvite.test.ts`
- `tests/unit/features/auth/components/invite/GroupInfoCard.test.tsx`
- `tests/unit/features/auth/components/invite/RegisterForm.test.tsx`
- `src/features/auth/hooks/useInvite.ts`
- `src/features/auth/components/invite/*.tsx`

### Acceptance Criteria

- [ ] Invite page under 100 lines
- [ ] Registration form properly validated
- [ ] All invite states handled
- [ ] No regressions in invite flow

---

## Testing Strategy

### Test File Organization

```
tests/unit/
├── features/
│   └── user/
│       ├── hooks/
│       │   ├── fixtures.ts
│       │   ├── useUserSettings.test.ts
│       │   └── useUserProfile.test.ts
│       └── components/
│           ├── settings/
│           │   ├── AccountSettings.test.tsx
│           │   ├── PasswordSettings.test.tsx
│           │   ├── NotificationSettings.test.tsx
│           │   ├── PrivacySettings.test.tsx
│           │   ├── DisplaySettings.test.tsx
│           │   └── DangerZone.test.tsx
│           ├── profile/
│           │   ├── ProfileHeader.test.tsx
│           │   ├── SmileScoreCard.test.tsx
│           │   ├── AchievementGrid.test.tsx
│           │   └── ContributionChart.test.tsx
│           └── AvatarUploader.test.tsx
```

### Test Commands

```bash
# Run all user feature tests
npm test -- --grep "features/user"

# Run specific hook tests
npm test -- --grep "useUserSettings"

# Run with coverage
npm test -- --coverage --grep "features/user"
```

### Fixture Data

Create shared test fixtures in `tests/unit/features/user/hooks/fixtures.ts`:

```typescript
export const mockUser: UserProfile = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  username: 'testuser',
  avatarUrl: null,
}

export const mockUserStats: UserStats = {
  totalQuestions: 42,
  totalActivities: 10,
  totalGroups: 3,
  totalPoints: 1500,
  // ...
}

export const mockAchievements: Achievement[] = [
  // ...
]
```

---

## Definition of Done

For each work item:

1. **Tests Written First** - Failing tests exist before implementation
2. **Tests Pass** - All unit tests pass
3. **Code Under Line Limits** - Components < 150 lines, pages < 120 lines
4. **TypeScript Clean** - No type errors
5. **No Regressions** - Existing functionality preserved
6. **Exports Updated** - New modules exported from barrel files
7. **Documentation** - JSDoc comments on public APIs

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing settings | Run E2E tests after WI-5 |
| Breaking profile functionality | Run E2E tests after WI-7 |
| Type mismatches | Share types from `types.ts` |
| Missing edge cases | Review current implementation for edge case handling |

---

## Notes for AI Agent

1. **Start with WI-1** - Must create folder structure first
2. **Follow TDD strictly** - Write tests, run them (they should fail), then implement
3. **Extract incrementally** - Don't try to refactor entire files at once
4. **Preserve styles** - Copy existing Tailwind classes to new components
5. **Keep interfaces** - Maintain backward compatibility with any external callers
6. **Run tests frequently** - `npm test` after each component

---

## Related Tickets

- None (this is a standalone refactor)

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Implementation plan created with TDD approach |
