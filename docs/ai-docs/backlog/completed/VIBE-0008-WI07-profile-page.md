---
id: VIBE-0008-WI07
title: Refactor Profile Page
status: backlog
effort: s
dependencies: [VIBE-0008-WI03, VIBE-0008-WI06]
---

# WI-07: Refactor Profile Page

## Description

Reduce `profile/page.tsx` from 524 lines to under 100 lines.

## Implementation

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

## Files to Modify

- `src/app/(dashboard)/profile/page.tsx` (major refactor)

## Files to Delete (After Verification)

- `src/app/(dashboard)/profile/components/SmileScoreTab.tsx`
- `src/app/(dashboard)/profile/components/AchievementsTab.tsx`
- `src/app/(dashboard)/profile/components/ContributionStatsTab.tsx`
- `src/app/(dashboard)/profile/components/ActivityTimelineTab.tsx`

## Acceptance Criteria

- [ ] Page is under 100 lines
- [ ] Uses `useUserProfile` hook
- [ ] All tabs functional
- [ ] Old tab components can be safely removed
- [ ] No visual regressions
