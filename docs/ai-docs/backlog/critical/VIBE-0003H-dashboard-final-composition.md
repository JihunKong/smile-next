---
id: VIBE-0003H
title: Dashboard final composition and E2E validation
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: s
assignee: ai-agent
---

# Dashboard Final Composition

## Summary

Final step of VIBE-0003: refactor `page.tsx` to use all extracted components and validate with E2E tests. The page should reduce from 977 lines to ~60 lines while maintaining identical functionality.

## Current Behavior

After completing VIBE-0003A through VIBE-0003G:
- All components extracted to `dashboard/components/`
- Data fetching extracted to `dashboard/lib/getDashboardData.ts`
- Types in `dashboard/types.ts`
- Tier utils in `dashboard/lib/tierUtils.ts`

## Expected Behavior

Final `page.tsx` (~60 lines):
```typescript
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { getDashboardData } from './lib/getDashboardData'
import {
  ErrorBanner,
  WelcomeHeader,
  QuickActions,
  StatsGrid,
  CertificateProgress,
  ActivityFeed,
  CommunityFeed,
  AchievementShowcase,
} from './components'

function SessionError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Session error UI */}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user

  if (!user?.id) {
    return <SessionError />
  }

  const stats = await getDashboardData(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBanner error={'error' in stats ? stats.error : undefined} />
        <WelcomeHeader userName={user.name} />
        <QuickActions />
        <StatsGrid stats={stats} />
        <CertificateProgress certificates={stats.user_certificates} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ActivityFeed activities={stats.activities} totalQuestions={stats.total_questions} />
          <CommunityFeed totalQuestions={stats.total_questions} />
        </div>
        <AchievementShowcase
          badgesEarned={stats.badges_earned}
          badgeNames={stats.badge_names}
          totalQuestions={stats.total_questions}
        />
      </div>
    </div>
  )
}
```

## Acceptance Criteria

- [ ] `page.tsx` reduced to ~60 lines
- [ ] All components imported from `./components`
- [ ] Data fetched via `getDashboardData()`
- [ ] All unit tests pass: `npm run test`
- [ ] E2E smoke tests pass: `npx playwright test tests/e2e/smoke/student.smoke.spec.ts`
- [ ] Visual output identical (manual check)
- [ ] No console errors
- [ ] No TypeScript errors

## Technical Approach

### 1. Update Component Barrel Export

```typescript
// dashboard/components/index.ts
export { ErrorBanner } from './ErrorBanner'
export { WelcomeHeader } from './WelcomeHeader'
export { QuickActions } from './QuickActions'
export { StatsGrid } from './StatsGrid'
export { CertificateProgress } from './CertificateProgress'
export { ActivityFeed } from './ActivityFeed'
export { CommunityFeed } from './CommunityFeed'
export { AchievementShowcase } from './AchievementShowcase'
```

### 2. Refactor page.tsx

Remove all inline code and replace with imports:
1. Remove `TIERS_ARRAY` and `getTierInfo()` - now in `lib/tierUtils.ts`
2. Remove `getUserStats()` - now in `lib/getDashboardData.ts`
3. Remove all inline JSX sections - now in components

### 3. Validation Checklist

Run these commands and verify:

```bash
# Run all unit tests
npm run test

# Run dashboard-specific tests
npm run test -- dashboard

# Run E2E smoke tests
npx playwright test tests/e2e/smoke/student.smoke.spec.ts

# Check for TypeScript errors
npm run type-check

# Check for lint errors
npm run lint
```

### 4. Manual Visual Verification

1. Log in as a student user
2. Navigate to `/dashboard`
3. Verify all sections render:
   - [ ] Welcome header with user name
   - [ ] Quick actions (4 cards)
   - [ ] Stats grid (4 stat cards)
   - [ ] Certificate progress (if user has certificates)
   - [ ] Activity feeds (2-column layout)
   - [ ] Achievement showcase (3-column layout)
4. Test responsive layout at mobile/tablet/desktop
5. Verify no visual differences from before

## Final File Structure

```
src/app/(dashboard)/dashboard/
├── page.tsx                    (60 lines)
├── types.ts                    (60 lines)
├── components/
│   ├── index.ts                (10 lines)
│   ├── ErrorBanner.tsx         (40 lines)
│   ├── WelcomeHeader.tsx       (50 lines)
│   ├── QuickActions.tsx        (60 lines)
│   ├── StatsGrid.tsx           (180 lines)
│   ├── CertificateProgress.tsx (200 lines)
│   ├── ActivityFeed.tsx        (100 lines)
│   ├── CommunityFeed.tsx       (100 lines)
│   └── AchievementShowcase.tsx (180 lines)
└── lib/
    ├── getDashboardData.ts     (200 lines)
    └── tierUtils.ts            (40 lines)

Total: ~1,220 lines across 12 files
(vs 977 lines in 1 file before)
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Main target
- All files in `dashboard/components/`
- All files in `dashboard/lib/`
- `tests/unit/app/dashboard/` - All test files

## Dependencies

**Blocked By:**
- VIBE-0003A (Types + Tier Utils)
- VIBE-0003B (Data Fetching)
- VIBE-0003C (Simple UI)
- VIBE-0003D (StatsGrid)
- VIBE-0003E (Activity Feeds)
- VIBE-0003F (Achievement Showcase)
- VIBE-0003G (Certificate Progress)

**Blocks:**
- None (final step)

## Notes

- This is the integration step - all components must be complete
- Focus on ensuring no regressions
- Update AI docs after completion to mark VIBE-0003 as done
- Consider updating `docs/ai-docs/backlog/README.md` to track completion

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as final step of VIBE-0003 breakdown |
