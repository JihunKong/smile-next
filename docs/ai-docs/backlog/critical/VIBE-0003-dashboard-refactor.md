---
id: VIBE-0003
title: Refactor Dashboard page for AI-friendly development (977 lines)
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-17
effort: m
assignee: ai-agent
---

# Refactor Dashboard Page for Vibe Coding

## Summary

The Dashboard (`dashboard/page.tsx`) is **977 lines** and is the central hub users see after login. It's currently a server component with multiple data fetching functions and complex UI sections. For a redesign, this is a critical page that designers will need to modify frequently.

## Current Behavior

Single file containing:
- Helper functions (`getTierInfo`, `getUserStats`) - 150+ lines
- Multiple Prisma queries in sequence
- Stats cards, streak display, tier progress
- Recent activity sections
- Achievement badges display
- Welcome message logic

The file mixes:
- Data fetching logic (server-side)
- UI components (inline)
- Business logic (tier calculations)

## Expected Behavior

Clean separation with focused files:

```
dashboard/
├── page.tsx                    (~60 lines)  - Server component, data fetching
├── DashboardClient.tsx         (~80 lines)  - Client wrapper if needed
├── components/
│   ├── WelcomeHeader.tsx       (~60 lines)  - User greeting + quick stats
│   ├── TierProgress.tsx        (~100 lines) - Tier progress card
│   ├── StreakDisplay.tsx       (~80 lines)  - Streak + calendar
│   ├── StatsGrid.tsx           (~120 lines) - Stats cards grid
│   ├── RecentActivity.tsx      (~100 lines) - Recent questions/responses
│   ├── AchievementBadges.tsx   (~80 lines)  - Badge display
│   └── index.ts
├── lib/
│   ├── getDashboardData.ts     (~150 lines) - All data fetching
│   └── tierUtils.ts            (~50 lines)  - Tier calculation helpers
└── types.ts                    (~40 lines)
```

## Acceptance Criteria

- [ ] Main `page.tsx` under 80 lines (data fetch + composition)
- [ ] Each component under 150 lines
- [ ] Data fetching extracted to `lib/getDashboardData.ts`
- [ ] Tier utilities extracted to `lib/tierUtils.ts`
- [ ] All stats cards as separate components
- [ ] Streak display as reusable component
- [ ] No functionality changes
- [ ] Page renders identically

## Technical Approach

### 1. Extract Data Fetching

```typescript
// dashboard/lib/getDashboardData.ts
import { prisma } from '@/lib/db/prisma'
import { getUserStreak } from '@/lib/services/streakService'
import { getTierInfo } from './tierUtils'

export interface DashboardData {
  user: {
    id: string
    name: string
    points: number
  }
  stats: {
    totalQuestions: number
    questionsThisWeek: number
    totalGroups: number
    avgQualityScore: number
  }
  tier: {
    current: TierInfo
    progress: number
    pointsToNext: number
  }
  streak: StreakInfo
  recentActivity: RecentActivityItem[]
  achievements: Achievement[]
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  // Parallel fetch for performance
  const [user, stats, streak, recentActivity, achievements] = await Promise.all([
    getUser(userId),
    getUserStats(userId),
    getUserStreak(userId),
    getRecentActivity(userId),
    getAchievements(userId),
  ])

  return {
    user,
    stats,
    tier: getTierInfo(user.points),
    streak,
    recentActivity,
    achievements,
  }
}

async function getUserStats(userId: string) {
  // ... extracted stats queries
}
```

### 2. Extract Tier Utilities

```typescript
// dashboard/lib/tierUtils.ts
import { TIERS } from '@/lib/services/levelService'

const TIERS_ARRAY = Object.values(TIERS).map(tier => ({
  name: tier.name,
  minPoints: tier.pointRange[0],
  maxPoints: tier.pointRange[1],
  color: tier.color,
  icon: tier.icon,
}))

export function getTierInfo(points: number) {
  // ... existing tier calculation logic
}

export function getTierColor(tierName: string) {
  return TIERS_ARRAY.find(t => t.name === tierName)?.color || '#gray'
}
```

### 3. Create Focused Components

```typescript
// dashboard/components/TierProgress.tsx
interface Props {
  tier: TierInfo
  progress: number
  pointsToNext: number
}

export function TierProgress({ tier, progress, pointsToNext }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: tier.color }}
        >
          {tier.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{tier.name}</h3>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: tier.color }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {pointsToNext} points to next tier
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 4. Simplified Page

```typescript
// dashboard/page.tsx
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { getDashboardData } from './lib/getDashboardData'
import {
  WelcomeHeader,
  TierProgress,
  StreakDisplay,
  StatsGrid,
  RecentActivity,
  AchievementBadges,
} from './components'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const data = await getDashboardData(session.user.id)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <WelcomeHeader user={data.user} stats={data.stats} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TierProgress {...data.tier} />
        <StreakDisplay streak={data.streak} />
        <StatsGrid stats={data.stats} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity items={data.recentActivity} />
        <AchievementBadges achievements={data.achievements} />
      </div>
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Target file
- `src/lib/services/streakService.ts` - Streak logic (keep as-is)
- `src/lib/services/levelService.ts` - Tier definitions (keep as-is)
- `src/components/gamification/` - Some components exist here

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None (but benefits from REFACTOR-0002 UI components)

## Notes

- Dashboard is a **server component** - keep it that way for SEO/performance
- Some components may need 'use client' for interactivity
- Consider extracting `TierProgress` and `StreakDisplay` to `src/components/gamification/` for reuse
- This refactor is straightforward compared to Case Mode

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - Dashboard is high-visibility for redesign |
