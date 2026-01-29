# VIBE-0008A: Settings & Profile Refactor - Work Items

> **Parent Ticket:** [VIBE-0008-settings-profile-refactor.md](./VIBE-0008-settings-profile-refactor.md)  
> **Implementation Plan:** [../../implementation-plans/VIBE-0008-settings-profile-refactor-plan.md](../../implementation-plans/VIBE-0008-settings-profile-refactor-plan.md)  
> **Created:** 2025-01-23  
> **Approach:** Test-Driven Development (TDD)  
> **Total Lines to Refactor:** 2,916+ lines across 8 files  
> **Total Work Items:** 10

---

## Overview

This document breaks down the Settings & Profile refactor into discrete, actionable work items. Each work item is designed to be completed independently by an agentic AI, following strict TDD principles.

### Current State Analysis

| File | Lines | Key Functions |
|------|-------|---------------|
| `settings/page.tsx` | 663 | Account form, password form, notifications, privacy, display, danger zone |
| `profile/page.tsx` | 524 | ProfilePage (main), SettingsTab component embedded |
| `profile/components/SmileScoreTab.tsx` | 474 | Score display, level info, rankings |
| `profile/components/AchievementsTab.tsx` | 361 | Badge grid, progress, filtering |
| `profile/components/ContributionStatsTab.tsx` | 357 | Stats display, charts |
| `profile/components/ActivityTimelineTab.tsx` | 331 | Timeline events, pagination |
| `profile/components/InquiryJourneyTab.tsx` | ~300 | Journey visualization |
| `auth/invite/[code]/page.tsx` | 543 | Invite validation, registration, join group |

---

## Work Items

### WI-1: Create Feature Module Structure & Types

**Priority:** P0 (Blocking)  
**Estimated Time:** 20 minutes  
**Dependencies:** None  

#### Objective
Create the foundational `src/features/user/` module structure with shared TypeScript types.

#### Tasks

1. **Create directory structure:**
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

2. **Create `types.ts`** with interfaces extracted from existing files:
   - `UserProfile` (firstName, lastName, username, email, avatarUrl)
   - `UserPreferences` (theme, language, emailDigest, etc.)
   - `UserStats` (totalQuestions, totalActivities, etc.)
   - `LevelInfo`, `LevelTier`
   - `Achievement`, `EarnedBadge`
   - `TimelineEvent`

3. **Create barrel exports** (`index.ts` files)

#### Files to Create
```
src/features/user/types.ts
src/features/user/index.ts
src/features/user/hooks/index.ts
src/features/user/components/index.ts
src/features/user/components/settings/index.ts
src/features/user/components/profile/index.ts
```

#### Acceptance Criteria
- [ ] All directories exist
- [ ] TypeScript compiles without errors
- [ ] Types can be imported from `@/features/user`

---

### WI-2: Create & Test `useUserSettings` Hook

**Priority:** P1  
**Estimated Time:** 2 hours  
**Dependencies:** WI-1  

#### Objective
Extract all settings page data fetching and mutation logic into a reusable hook.

#### TDD Test Cases (Write First!)

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

#### Implementation

**File:** `src/features/user/hooks/useUserSettings.ts`

Hook should expose:
```typescript
interface UseUserSettingsReturn {
  // Data
  user: UserProfile | null
  preferences: UserPreferences | null
  
  // State
  loading: boolean
  saving: boolean
  error: string | null
  message: { type: 'success' | 'error'; text: string } | null
  
  // Actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  updatePreferences: (data: Partial<UserPreferences>) => Promise<void>
  updatePassword: (current: string, newPass: string, confirm: string) => Promise<void>
  deleteAccount: () => Promise<void>
  clearMessage: () => void
}
```

#### Source Reference
Extract logic from `settings/page.tsx`:
- Lines 78-131: `fetchProfile` and `fetchPreferences`
- Lines 133-158: `handleAccountSubmit`
- Lines 160-200: `handlePasswordSubmit`
- Lines 202-224: `handleDeleteAccount`

#### Files to Create
```
tests/unit/features/user/hooks/useUserSettings.test.ts
tests/unit/features/user/hooks/fixtures.ts
src/features/user/hooks/useUserSettings.ts
```

#### Files to Modify
```
src/features/user/hooks/index.ts (add export)
```

#### Acceptance Criteria
- [ ] All test cases pass
- [ ] Hook is under 150 lines
- [ ] No direct fetch calls remain in `settings/page.tsx` by WI-5

---

### WI-3: Create & Test `useUserProfile` Hook

**Priority:** P1  
**Estimated Time:** 1.5 hours  
**Dependencies:** WI-1  

#### Objective
Create a hook for read-only profile data aggregation (used by profile/page.tsx).

#### TDD Test Cases (Write First!)

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

#### Implementation

**File:** `src/features/user/hooks/useUserProfile.ts`

Hook should expose:
```typescript
interface UseUserProfileReturn {
  profile: UserProfile | null
  stats: UserStats | null
  badges: BadgeData | null
  loading: boolean
  error: string | null
  
  // Computed
  displayName: string
  initials: string
  memberSince: string
  tierInfo: LevelTier | null
  
  // Actions
  refresh: () => Promise<void>
}
```

#### Source Reference
Extract logic from `profile/page.tsx`:
- Lines 134-161: `fetchData` function
- Lines 168-174: Display name and initials computation

#### Files to Create
```
tests/unit/features/user/hooks/useUserProfile.test.ts
src/features/user/hooks/useUserProfile.ts
```

#### Files to Modify
```
src/features/user/hooks/index.ts (add export)
```

#### Acceptance Criteria
- [ ] All test cases pass
- [ ] Hook is under 100 lines
- [ ] Handles all three API endpoints

---

### WI-4: Extract & Test Settings Section Components

**Priority:** P2  
**Estimated Time:** 3 hours  
**Dependencies:** WI-2  

#### Objective
Break down the 663-line settings page into focused, testable section components.

#### Components to Create

| Component | Target Lines | Source Lines | Responsibility |
|-----------|--------------|--------------|----------------|
| `SettingsSidebar` | ~60 | 262-288 | Tab navigation |
| `AccountSettings` | ~100 | 294-354 | Name, username form |
| `PasswordSettings` | ~80 | 356-406 | Password change form |
| `NotificationSettings` | ~60 | 408-460 | Email notification toggles |
| `PrivacySettings` | ~60 | 462-514 | Privacy toggles |
| `DisplaySettings` | ~100 | 516-634 | Theme, language, items per page |
| `DangerZone` | ~50 | 636-655 | Delete account with warning |

#### TDD Test Cases (Write First!)

**File:** `tests/unit/features/user/components/settings/AccountSettings.test.tsx`

```typescript
describe('AccountSettings', () => {
  it('should render with user data pre-filled')
  it('should call onSave with form data on submit')
  it('should show saving state while submitting')
  it('should disable email field (non-editable)')
  it('should validate required fields')
})
```

**File:** `tests/unit/features/user/components/settings/PasswordSettings.test.tsx`

```typescript
describe('PasswordSettings', () => {
  it('should render current, new, and confirm password fields')
  it('should call onSave with passwords on submit')
  it('should show saving state while submitting')
  it('should clear form after onSave resolves')
})
```

**File:** `tests/unit/features/user/components/settings/NotificationSettings.test.tsx`

```typescript
describe('NotificationSettings', () => {
  it('should render all notification toggles')
  it('should call onChange when toggle is clicked')
  it('should reflect preference values')
  it('should call onSave when save button clicked')
})
```

**File:** `tests/unit/features/user/components/settings/PrivacySettings.test.tsx`

```typescript
describe('PrivacySettings', () => {
  it('should render privacy toggles')
  it('should call onChange when toggle is clicked')
  it('should call onSave when save button clicked')
})
```

**File:** `tests/unit/features/user/components/settings/DisplaySettings.test.tsx`

```typescript
describe('DisplaySettings', () => {
  it('should render theme options (light/dark/auto)')
  it('should render language dropdown')
  it('should render items per page options')
  it('should call respective setters when changed')
  it('should call onSave when save button clicked')
})
```

**File:** `tests/unit/features/user/components/settings/DangerZone.test.tsx`

```typescript
describe('DangerZone', () => {
  it('should render delete account warning')
  it('should call onDelete when delete button clicked')
  it('should show loading state during deletion')
})
```

#### Implementation Notes

Each component should:
- Accept `user/preferences` as props (not fetch internally)
- Accept `onSave/onChange` callbacks
- Accept `saving` state for loading UI
- Be under 150 lines
- Use existing Tailwind classes from source file

#### Files to Create
```
tests/unit/features/user/components/settings/AccountSettings.test.tsx
tests/unit/features/user/components/settings/PasswordSettings.test.tsx
tests/unit/features/user/components/settings/NotificationSettings.test.tsx
tests/unit/features/user/components/settings/PrivacySettings.test.tsx
tests/unit/features/user/components/settings/DisplaySettings.test.tsx
tests/unit/features/user/components/settings/DangerZone.test.tsx
tests/unit/features/user/components/settings/SettingsSidebar.test.tsx
src/features/user/components/settings/AccountSettings.tsx
src/features/user/components/settings/PasswordSettings.tsx
src/features/user/components/settings/NotificationSettings.tsx
src/features/user/components/settings/PrivacySettings.tsx
src/features/user/components/settings/DisplaySettings.tsx
src/features/user/components/settings/DangerZone.tsx
src/features/user/components/settings/SettingsSidebar.tsx
```

#### Files to Modify
```
src/features/user/components/settings/index.ts (add exports)
```

#### Acceptance Criteria
- [ ] All test cases pass
- [ ] Each component under 150 lines
- [ ] Components are pure (receive props, emit events)
- [ ] All existing functionality preserved

---

### WI-5: Refactor `settings/page.tsx` Using New Components

**Priority:** P2  
**Estimated Time:** 1 hour  
**Dependencies:** WI-2, WI-4  

#### Objective
Reduce `settings/page.tsx` from 663 lines to under 120 lines by composing new components.

#### Implementation

```typescript
// settings/page.tsx (~100 lines)
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUserSettings } from '@/features/user/hooks'
import {
  SettingsSidebar,
  AccountSettings,
  PasswordSettings,
  NotificationSettings,
  PrivacySettings,
  DisplaySettings,
  DangerZone,
} from '@/features/user/components/settings'
import { LoadingSpinner } from '@/components/ui'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account')
  
  const {
    user,
    preferences,
    loading,
    saving,
    message,
    updateProfile,
    updatePreferences,
    updatePassword,
    deleteAccount,
    clearMessage,
  } = useUserSettings()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: '...' },
    // ... other tabs
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#2E2D29] mb-8">Settings</h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${...}`}>{message.text}</div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <SettingsSidebar 
            tabs={tabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
          
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {activeTab === 'account' && (
              <AccountSettings user={user} onSave={updateProfile} saving={saving} />
            )}
            {activeTab === 'password' && (
              <PasswordSettings onSave={updatePassword} saving={saving} />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings 
                preferences={preferences} 
                onSave={(prefs) => updatePreferences(prefs)}
                saving={saving} 
              />
            )}
            {/* ... other tabs */}
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### Files to Modify
```
src/app/(dashboard)/settings/page.tsx (major refactor)
```

#### Acceptance Criteria
- [ ] Page is under 120 lines
- [ ] Uses `useUserSettings` hook
- [ ] All tabs functional
- [ ] No visual regressions
- [ ] All tests still pass

---

### WI-6: Extract & Test Profile Section Components

**Priority:** P2  
**Estimated Time:** 3 hours  
**Dependencies:** WI-3  

#### Objective
Create smaller, focused components from existing profile tab components.

#### Components to Create

| Component | Target Lines | Source | Responsibility |
|-----------|--------------|--------|----------------|
| `ProfileHeader` | ~80 | profile/page.tsx:201-293 | Avatar, name, stats overview |
| `ProfileTabNav` | ~50 | profile/page.tsx:44-118, 298-316 | Tab definitions and navigation |
| `SmileScoreCard` | ~120 | SmileScoreTab.tsx | Score display + breakdown |
| `ScoreProgressBar` | ~40 | SmileScoreTab.tsx | Tier progress visualization |
| `AchievementGrid` | ~100 | AchievementsTab.tsx | Badge grid with filtering |
| `AchievementCard` | ~50 | AchievementsTab.tsx | Single badge display |
| `ContributionStats` | ~100 | ContributionStatsTab.tsx | Stats overview cards |
| `ActivityTimeline` | ~120 | ActivityTimelineTab.tsx | Timeline events list |

#### TDD Test Cases (Write First!)

**File:** `tests/unit/features/user/components/profile/ProfileHeader.test.tsx`

```typescript
describe('ProfileHeader', () => {
  it('should display user avatar or initials')
  it('should display user full name')
  it('should display user email')
  it('should show tier badge when available')
  it('should show member since date')
  it('should render stats grid with points, questions, activities, badges')
})
```

**File:** `tests/unit/features/user/components/profile/SmileScoreCard.test.tsx`

```typescript
describe('SmileScoreCard', () => {
  it('should display total points')
  it('should show current tier name and icon')
  it('should render progress bar to next tier')
  it('should show points breakdown by category')
  it('should handle max tier (no next tier)')
})
```

**File:** `tests/unit/features/user/components/profile/AchievementGrid.test.tsx`

```typescript
describe('AchievementGrid', () => {
  it('should render grid of achievements')
  it('should show empty state when no achievements')
  it('should filter by category when changed')
  it('should distinguish earned vs locked badges')
  it('should show progress for in-progress badges')
})
```

**File:** `tests/unit/features/user/components/profile/ContributionStats.test.tsx`

```typescript
describe('ContributionStats', () => {
  it('should display question count')
  it('should display response count')
  it('should display activity count')
  it('should show high quality question percentage')
  it('should show weekly/monthly trends')
})
```

**File:** `tests/unit/features/user/components/profile/ActivityTimeline.test.tsx`

```typescript
describe('ActivityTimeline', () => {
  it('should render list of activity events')
  it('should show event type icons')
  it('should format event timestamps')
  it('should filter by event type')
  it('should paginate with load more button')
  it('should show empty state when no events')
})
```

#### Files to Create
```
tests/unit/features/user/components/profile/ProfileHeader.test.tsx
tests/unit/features/user/components/profile/ProfileTabNav.test.tsx
tests/unit/features/user/components/profile/SmileScoreCard.test.tsx
tests/unit/features/user/components/profile/ScoreProgressBar.test.tsx
tests/unit/features/user/components/profile/AchievementGrid.test.tsx
tests/unit/features/user/components/profile/AchievementCard.test.tsx
tests/unit/features/user/components/profile/ContributionStats.test.tsx
tests/unit/features/user/components/profile/ActivityTimeline.test.tsx
src/features/user/components/profile/ProfileHeader.tsx
src/features/user/components/profile/ProfileTabNav.tsx
src/features/user/components/profile/SmileScoreCard.tsx
src/features/user/components/profile/ScoreProgressBar.tsx
src/features/user/components/profile/AchievementGrid.tsx
src/features/user/components/profile/AchievementCard.tsx
src/features/user/components/profile/ContributionStats.tsx
src/features/user/components/profile/ActivityTimeline.tsx
```

#### Files to Modify
```
src/features/user/components/profile/index.ts (add exports)
```

#### Acceptance Criteria
- [ ] All test cases pass
- [ ] Each component under 150 lines
- [ ] Components receive data via props
- [ ] Existing styles preserved

---

### WI-7: Refactor `profile/page.tsx` Using New Components

**Priority:** P2  
**Estimated Time:** 1 hour  
**Dependencies:** WI-3, WI-6  

#### Objective
Reduce `profile/page.tsx` from 524 lines to under 100 lines.

#### Implementation

```typescript
// profile/page.tsx (~80 lines)
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useUserProfile } from '@/features/user/hooks'
import {
  ProfileHeader,
  ProfileTabNav,
  SmileScoreCard,
  AchievementGrid,
  ContributionStats,
  ActivityTimeline,
} from '@/features/user/components/profile'
import { LoadingSpinner } from '@/components/ui'

// Note: These will be migrated in future tickets
import InquiryJourneyTab from './components/InquiryJourneyTab'
import CareerDirectionsTab from './components/CareerDirectionsTab'
import StrengthSummaryTab from './components/StrengthSummaryTab'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('smile-score')
  const { profile, stats, badges, loading, displayName, initials, memberSince, tierInfo } = useUserProfile()

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center"><p>Please sign in</p></div>
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProfileHeader
          profile={profile}
          stats={stats}
          badges={badges}
          displayName={displayName}
          initials={initials}
          memberSince={memberSince}
          tierInfo={tierInfo}
        />

        <div className="bg-white rounded-lg shadow mt-8">
          <ProfileTabNav activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="p-8">
            {activeTab === 'smile-score' && <SmileScoreCard />}
            {activeTab === 'achievements' && <AchievementGrid />}
            {activeTab === 'stats' && <ContributionStats />}
            {activeTab === 'activity' && <ActivityTimeline />}
            {activeTab === 'inquiry-journey' && <InquiryJourneyTab />}
            {activeTab === 'career-directions' && <CareerDirectionsTab />}
            {activeTab === 'strength-summary' && <StrengthSummaryTab />}
            {activeTab === 'settings' && <SettingsTab profile={profile} />}
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### Files to Modify
```
src/app/(dashboard)/profile/page.tsx (major refactor)
```

#### Files to Delete (After Verification)
```
src/app/(dashboard)/profile/components/SmileScoreTab.tsx
src/app/(dashboard)/profile/components/AchievementsTab.tsx
src/app/(dashboard)/profile/components/ContributionStatsTab.tsx
src/app/(dashboard)/profile/components/ActivityTimelineTab.tsx
```

#### Acceptance Criteria
- [ ] Page is under 100 lines
- [ ] Uses `useUserProfile` hook
- [ ] All tabs functional
- [ ] Old tab components can be safely removed
- [ ] No visual regressions

---

### WI-8: Create Shared `AvatarUploader` Component

**Priority:** P3  
**Estimated Time:** 1.5 hours  
**Dependencies:** WI-4, WI-6  

#### Objective
Create a reusable avatar upload component for settings and profile.

#### TDD Test Cases (Write First!)

**File:** `tests/unit/features/user/components/AvatarUploader.test.tsx`

```typescript
describe('AvatarUploader', () => {
  describe('Display', () => {
    it('should show current avatar when provided')
    it('should show initials when no avatar')
    it('should show upload overlay on hover')
  })

  describe('Upload', () => {
    it('should accept image file types only (jpg, png, gif, webp)')
    it('should validate file size limit (5MB default)')
    it('should show preview before confirming upload')
    it('should call onUpload with file on confirm')
    it('should show upload progress')
    it('should display error on failed upload')
  })

  describe('Remove', () => {
    it('should show remove button when avatar exists')
    it('should call onRemove when remove clicked')
    it('should show confirmation before removing')
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible')
    it('should have proper aria labels')
  })
})
```

#### Implementation

**File:** `src/features/user/components/AvatarUploader.tsx`

```typescript
interface AvatarUploaderProps {
  avatarUrl: string | null
  initials: string
  onUpload: (file: File) => Promise<void>
  onRemove?: () => Promise<void>
  size?: 'sm' | 'md' | 'lg'
  maxSizeMB?: number
}

export function AvatarUploader({
  avatarUrl,
  initials,
  onUpload,
  onRemove,
  size = 'md',
  maxSizeMB = 5,
}: AvatarUploaderProps) {
  // Implementation
}
```

#### Files to Create
```
tests/unit/features/user/components/AvatarUploader.test.tsx
src/features/user/components/AvatarUploader.tsx
```

#### Files to Modify
```
src/features/user/components/index.ts (add export)
src/features/user/components/settings/AccountSettings.tsx (integrate)
src/features/user/components/profile/ProfileHeader.tsx (integrate)
```

#### Acceptance Criteria
- [ ] All test cases pass
- [ ] Component under 100 lines
- [ ] Works in both settings and profile
- [ ] Handles file validation
- [ ] Accessible

---

### WI-9: Remove Embedded `SettingsTab` from Profile Page

**Priority:** P3  
**Estimated Time:** 30 minutes  
**Dependencies:** WI-5  

#### Objective
Remove the duplicated `SettingsTab` component embedded in `profile/page.tsx` (lines 344-523) and redirect to the dedicated settings page.

#### Implementation

1. Remove the `SettingsTab` function from `profile/page.tsx`
2. Update the settings tab behavior to redirect to `/settings`
3. Or keep minimal inline settings but link to advanced settings

#### Files to Modify
```
src/app/(dashboard)/profile/page.tsx
```

#### Acceptance Criteria
- [ ] No duplicate settings form code
- [ ] Users can access full settings from profile
- [ ] Page line count reduced by ~180 lines

---

### WI-10: Refactor Invite Page (Optional Stretch)

**Priority:** P4 (Stretch Goal)  
**Estimated Time:** 3 hours  
**Dependencies:** None  

#### Objective
Break down the 543-line invite page into manageable components.

#### Proposed Structure
```
src/features/auth/
├── components/
│   ├── invite/
│   │   ├── InviteValidator.tsx    (~60 lines) - Loading/error states
│   │   ├── GroupInfoCard.tsx      (~80 lines) - Group preview
│   │   ├── JoinGroupButton.tsx    (~50 lines) - Existing user join
│   │   ├── RegisterForm.tsx       (~150 lines) - New user registration
│   │   ├── AlreadyMemberCard.tsx  (~40 lines) - Already joined message
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   └── useInvite.ts               (~100 lines) - Invite flow logic
└── types.ts
```

#### TDD Test Cases

```typescript
describe('useInvite', () => {
  it('should validate invite code on mount')
  it('should return group info on valid invite')
  it('should handle expired invite')
  it('should handle already member state')
  it('should handle join for logged-in users')
  it('should handle registration for new users')
})

describe('RegisterForm', () => {
  it('should validate email format')
  it('should validate password requirements')
  it('should validate password confirmation')
  it('should submit registration data')
  it('should handle registration errors')
})

describe('GroupInfoCard', () => {
  it('should display group name and description')
  it('should show member and activity counts')
  it('should show creator name')
})
```

#### Acceptance Criteria
- [ ] Invite page under 100 lines
- [ ] Registration form properly validated
- [ ] All invite states handled
- [ ] No regressions in invite flow

---

## Testing Infrastructure

### Test File Structure
```
tests/unit/features/user/
├── hooks/
│   ├── fixtures.ts        # Shared mock data
│   ├── useUserSettings.test.ts
│   └── useUserProfile.test.ts
└── components/
    ├── settings/
    │   ├── AccountSettings.test.tsx
    │   ├── PasswordSettings.test.tsx
    │   ├── NotificationSettings.test.tsx
    │   ├── PrivacySettings.test.tsx
    │   ├── DisplaySettings.test.tsx
    │   └── DangerZone.test.tsx
    ├── profile/
    │   ├── ProfileHeader.test.tsx
    │   ├── SmileScoreCard.test.tsx
    │   ├── AchievementGrid.test.tsx
    │   ├── ContributionStats.test.tsx
    │   └── ActivityTimeline.test.tsx
    └── AvatarUploader.test.tsx
```

### Shared Fixtures

**File:** `tests/unit/features/user/hooks/fixtures.ts`

```typescript
import { UserProfile, UserPreferences, UserStats } from '@/features/user'

export const mockUserProfile: UserProfile = {
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  email: 'test@example.com',
  avatarUrl: null,
}

export const mockUserPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  emailDigest: true,
  emailFrequency: 'weekly',
  showOnlineStatus: true,
  showActivityStatus: true,
  fontSize: 'medium',
  reduceMotion: false,
}

export const mockUserStats: UserStats = {
  totalQuestions: 42,
  totalActivities: 10,
  totalGroups: 3,
  totalPoints: 1500,
  levelInfo: {
    current: {
      tier: { name: 'Explorer', icon: '🔍' }
    }
  },
  memberSince: '2024-01-01',
}

export const mockAchievements = [
  { id: '1', badge: { name: 'First Question', icon: '🌟' }, earnedAt: new Date() },
  // ...
]
```

### Test Commands

```bash
# Run all user feature tests
npm test -- tests/unit/features/user

# Run only hook tests
npm test -- tests/unit/features/user/hooks

# Run with coverage
npm test -- --coverage tests/unit/features/user

# Watch mode during development
npm test -- --watch tests/unit/features/user
```

---

## Execution Order

### Phase 1: Foundation (2 hours)
1. **WI-1** - Create module structure

### Phase 2: Hooks (4 hours)
2. **WI-2** - `useUserSettings` hook
3. **WI-3** - `useUserProfile` hook

### Phase 3: Settings Components (4 hours)
4. **WI-4** - Settings section components
5. **WI-5** - Refactor settings page

### Phase 4: Profile Components (4 hours)
6. **WI-6** - Profile section components
7. **WI-7** - Refactor profile page

### Phase 5: Polish (3 hours)
8. **WI-8** - Shared avatar uploader
9. **WI-9** - Remove duplicate settings tab
10. **WI-10** - (Stretch) Refactor invite page

---

## Definition of Done

For each work item:

1. ✅ **Tests Written First** - Failing tests exist before implementation
2. ✅ **Tests Pass** - All unit tests pass
3. ✅ **Line Limits Met** - Components < 150 lines, pages < 120 lines  
4. ✅ **TypeScript Clean** - No type errors
5. ✅ **No Regressions** - Existing functionality preserved
6. ✅ **Exports Updated** - Barrel files updated
7. ✅ **Styles Preserved** - Visual appearance unchanged

---

## Notes for AI Agent

1. **Start with WI-1** - Foundation must exist first
2. **Follow TDD strictly** - Write tests → Run (fail) → Implement → Run (pass)
3. **Use fixtures** - Create test fixtures early (in WI-2)
4. **Preserve styles** - Copy Tailwind classes exactly from source
5. **Run tests after each file** - Verify incrementally
6. **Keep interfaces stable** - Maintain prop compatibility
7. **Delete old files last** - Only after all tests pass on new implementations

---

## Conversation History

| Date | Note |
|------|------|
| 2025-01-23 | Work items document created with detailed TDD approach |
