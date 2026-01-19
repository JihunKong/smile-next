---
id: VIBE-0008
title: Refactor Settings & Profile pages for AI-friendly development (2474 total lines)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-17
effort: m
assignee: ai-agent
---

# Refactor Settings & Profile Pages for Vibe Coding

## Summary

User settings and profile pages total **2,474 lines** across 6 files. These are personal user pages that will likely get significant attention during a redesign to improve user experience.

| File | Lines | Purpose |
|------|-------|---------|
| `settings/page.tsx` | 662 | Account settings |
| `auth/invite/[code]/page.tsx` | 542 | Accept invite flow |
| `profile/page.tsx` | 523 | User profile view |
| `profile/components/SmileScoreTab.tsx` | 473 | Score breakdown |
| `profile/components/AchievementsTab.tsx` | 360 | Badge display |
| `profile/components/ContributionStatsTab.tsx` | 356 | Contribution stats |
| **Total** | **2,916** | |

## Current Behavior

- Settings page has all form sections inline (account, notifications, privacy)
- Profile components are already somewhat separated but still large
- Invite page has complex registration + group join flow
- Lots of repeated form patterns

## Expected Behavior

```
features/user/
├── components/
│   ├── settings/
│   │   ├── AccountSettings.tsx      (~150 lines)
│   │   ├── NotificationSettings.tsx (~100 lines)
│   │   ├── PrivacySettings.tsx      (~80 lines)
│   │   ├── DangerZone.tsx           (~80 lines) - Delete account
│   │   └── index.ts
│   ├── profile/
│   │   ├── ProfileHeader.tsx        (~80 lines)
│   │   ├── SmileScoreCard.tsx       (~150 lines)
│   │   ├── AchievementGrid.tsx      (~120 lines)
│   │   ├── ContributionChart.tsx    (~120 lines)
│   │   ├── ActivityTimeline.tsx     (~100 lines)
│   │   └── index.ts
│   └── AvatarUploader.tsx           (~80 lines)
├── hooks/
│   ├── useUserSettings.ts           (~80 lines)
│   ├── useUserProfile.ts            (~80 lines)
│   └── index.ts
└── types.ts

app/(dashboard)/
├── settings/
│   └── page.tsx                     (~100 lines)
├── profile/
│   ├── page.tsx                     (~80 lines)
│   └── components/                  - Move to features/user/
```

## Acceptance Criteria

- [ ] Create `src/features/user/` module
- [ ] Extract settings sections as separate components
- [ ] Extract profile tab components to features/user/
- [ ] Settings page under 120 lines
- [ ] Profile page under 100 lines
- [ ] Each profile tab component under 150 lines
- [ ] Share `AvatarUploader` between settings and profile

## Technical Approach

### 1. Settings Sections

```typescript
// features/user/components/settings/AccountSettings.tsx
interface Props {
  user: User
  onSave: (data: Partial<User>) => Promise<void>
}

export function AccountSettings({ user, onSave }: Props) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    username: user.username,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave(formData)
    setSaving(false)
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Account Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Display Name"
          value={formData.name}
          onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
        />
        
        <Input
          label="Username"
          value={formData.username}
          onChange={(e) => setFormData(d => ({ ...d, username: e.target.value }))}
        />
        
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
        />

        <Button type="submit" isLoading={saving}>
          Save Changes
        </Button>
      </form>
    </section>
  )
}
```

### 2. Simplified Settings Page

```typescript
// settings/page.tsx
'use client'

import { useUserSettings } from '@/features/user/hooks'
import {
  AccountSettings,
  NotificationSettings,
  PrivacySettings,
  DangerZone,
} from '@/features/user/components/settings'

export default function SettingsPage() {
  const { user, loading, updateUser, deleteAccount } = useUserSettings()

  if (loading) return <LoadingState />

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <AccountSettings user={user} onSave={updateUser} />
      <NotificationSettings user={user} onSave={updateUser} />
      <PrivacySettings user={user} onSave={updateUser} />
      <DangerZone onDelete={deleteAccount} />
    </div>
  )
}
```

### 3. Profile with Tabs

```typescript
// profile/page.tsx
'use client'

import { useState } from 'react'
import { useUserProfile } from '@/features/user/hooks'
import {
  ProfileHeader,
  SmileScoreCard,
  AchievementGrid,
  ContributionChart,
} from '@/features/user/components/profile'

export default function ProfilePage() {
  const { profile, loading } = useUserProfile()
  const [activeTab, setActiveTab] = useState('overview')

  if (loading) return <LoadingState />

  return (
    <div className="max-w-4xl mx-auto py-8">
      <ProfileHeader profile={profile} />
      
      <Tabs value={activeTab} onChange={setActiveTab} className="mt-6">
        <Tab value="overview">Overview</Tab>
        <Tab value="achievements">Achievements</Tab>
        <Tab value="contributions">Contributions</Tab>
      </Tabs>

      <div className="mt-6">
        {activeTab === 'overview' && <SmileScoreCard score={profile.smileScore} />}
        {activeTab === 'achievements' && <AchievementGrid achievements={profile.achievements} />}
        {activeTab === 'contributions' && <ContributionChart stats={profile.contributions} />}
      </div>
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/settings/page.tsx`
- `src/app/(dashboard)/profile/` - Profile pages and components
- `src/app/auth/invite/[code]/page.tsx` - Invite acceptance flow

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- Profile components are already in `profile/components/` - just need size reduction
- The invite page (542 lines) combines registration + group join - consider splitting
- Settings page is a good candidate for early refactor (straightforward)
- `AvatarUploader` should be in shared UI components

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - User pages are key for redesign |
