---
id: VIBE-0003A
title: Extract Dashboard types and tier utilities with tests
status: completed
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
completed: 2026-01-18
effort: xs
assignee: ai-agent
---

# Extract Dashboard Types and Tier Utilities

## Summary

First step of the Dashboard refactoring (VIBE-0003). Extract foundational TypeScript types and the `getTierInfo()` utility function with unit tests. This creates the foundation for all subsequent extraction steps.

## Current Behavior

Types and tier calculation logic are embedded inline in `dashboard/page.tsx`:
- `TIERS_ARRAY` constant (lines 8-15)
- `getTierInfo()` function (lines 17-40)
- `UserStats` type derived from function return (line 270)

## Expected Behavior

Clean separation with typed exports:

```
dashboard/
├── types.ts           (~60 lines) - All TypeScript interfaces
└── lib/
    └── tierUtils.ts   (~40 lines) - getTierInfo(), TIERS_ARRAY
```

## Acceptance Criteria

- [x] `types.ts` created with DashboardData, UserStats, ProcessedCertificate, ProcessedActivity interfaces
- [x] `tierUtils.ts` created with getTierInfo() and TIERS_ARRAY
- [x] Unit tests written FIRST in `tests/unit/app/dashboard/lib/tierUtils.test.ts`
- [x] All tier boundary conditions tested (0, 4999, 5000, 100000 points)
- [x] Progress percentage calculation tested
- [x] Tests pass: `npm run test -- tierUtils`
- [x] No changes to dashboard functionality

## Technical Approach

### 1. Write Tests First

```typescript
// tests/unit/app/dashboard/lib/tierUtils.test.ts
import { describe, it, expect } from 'vitest'
import { getTierInfo, TIERS_ARRAY } from '@/app/(dashboard)/dashboard/lib/tierUtils'

describe('TIERS_ARRAY', () => {
  it('has 6 tiers', () => {
    expect(TIERS_ARRAY).toHaveLength(6)
  })

  it('tiers are ordered by minPoints', () => {
    for (let i = 1; i < TIERS_ARRAY.length; i++) {
      expect(TIERS_ARRAY[i].minPoints).toBeGreaterThan(TIERS_ARRAY[i-1].minPoints)
    }
  })
})

describe('getTierInfo', () => {
  it('returns SMILE Starter for 0 points', () => {
    const result = getTierInfo(0)
    expect(result.current.tier.name).toBe('SMILE Starter')
    expect(result.is_max_tier).toBe(false)
  })

  it('returns SMILE Starter for 4999 points (boundary)', () => {
    const result = getTierInfo(4999)
    expect(result.current.tier.name).toBe('SMILE Starter')
  })

  it('returns SMILE Learner for 5000 points (boundary)', () => {
    const result = getTierInfo(5000)
    expect(result.current.tier.name).toBe('SMILE Learner')
  })

  it('returns SMILE Master for 100000+ points', () => {
    const result = getTierInfo(100000)
    expect(result.current.tier.name).toBe('SMILE Master')
    expect(result.is_max_tier).toBe(true)
    expect(result.points_to_next).toBe(0)
  })

  it('calculates progress percentage correctly at 50%', () => {
    // SMILE Starter: 0-4999, so 2500 = 50%
    const result = getTierInfo(2500)
    expect(result.current.progress_percentage).toBeCloseTo(50, 0)
  })

  it('calculates points_to_next correctly', () => {
    const result = getTierInfo(4000)
    expect(result.points_to_next).toBe(1000) // 5000 - 4000
  })
})
```

### 2. Create Types

```typescript
// dashboard/types.ts
export interface TierInfo {
  name: string
  minPoints: number
  maxPoints: number
  color: string
  icon: string
  description: string
}

export interface CurrentTierInfo {
  tier: TierInfo
  progress_percentage: number
}

export interface LevelInfo {
  current: CurrentTierInfo
  points_to_next: number
  is_max_tier: boolean
}

export interface ProcessedActivity {
  id: string
  title: string
  subtitle: string
  timestamp: Date
  icon: string
  color: string
  badge_progress: boolean
}

export interface CertificateActivity {
  activity_id: string
  activity_name: string
  required: boolean
  status: 'not_started' | 'in_progress' | 'passed' | 'failed'
}

export interface ProcessedCertificate {
  id: string
  name: string
  status: 'completed' | 'in_progress'
  enrollment_date: Date
  completion_date: Date | null
  progress_percentage: number
  activities: CertificateActivity[]
}

export interface UserStats {
  total_questions: number
  questions_this_week: number
  week_change: number
  quality_score: number
  day_streak: number
  total_badge_points: number
  badges_earned: number
  badge_names: string[]
  level_info: LevelInfo
  total_groups: number
  activities: ProcessedActivity[]
  user_certificates: ProcessedCertificate[]
  error?: string
}
```

### 3. Extract Tier Utils

```typescript
// dashboard/lib/tierUtils.ts
import { TIERS } from '@/lib/services/levelService'
import type { TierInfo, LevelInfo } from '../types'

export const TIERS_ARRAY: TierInfo[] = Object.values(TIERS).map(tier => ({
  name: tier.name,
  minPoints: tier.pointRange[0],
  maxPoints: tier.pointRange[1],
  color: tier.color,
  icon: tier.icon,
  description: tier.description,
}))

export function getTierInfo(points: number): LevelInfo {
  let currentTier = TIERS_ARRAY[0]
  let nextTier: TierInfo | null = TIERS_ARRAY[1]

  for (let i = TIERS_ARRAY.length - 1; i >= 0; i--) {
    if (points >= TIERS_ARRAY[i].minPoints) {
      currentTier = TIERS_ARRAY[i]
      nextTier = TIERS_ARRAY[i + 1] || null
      break
    }
  }

  const isMaxTier = !nextTier
  const pointsToNext = nextTier ? nextTier.minPoints - points : 0
  const progressPercentage = nextTier
    ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100

  return {
    current: { tier: currentTier, progress_percentage: progressPercentage },
    points_to_next: pointsToNext,
    is_max_tier: isMaxTier,
  }
}
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Source of extraction
- `src/lib/services/levelService.ts` - TIERS constant (keep as-is)

## Dependencies

**Blocked By:**
- None (first step)

**Blocks:**
- VIBE-0003B (Data Fetching)
- VIBE-0003C (Simple UI)
- VIBE-0003D (StatsGrid)
- VIBE-0003E (Activity Feeds)
- VIBE-0003F (Achievement Showcase)
- VIBE-0003G (Certificate Progress)

## Notes

- This is the foundation - all other VIBE-0003 items depend on these types
- Keep types generic enough to support future redesign
- Run tests with `npm run test -- tierUtils`

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as first step of VIBE-0003 breakdown |
