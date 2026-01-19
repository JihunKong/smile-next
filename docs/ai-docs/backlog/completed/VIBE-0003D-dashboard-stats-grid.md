---
id: VIBE-0003D
title: Extract Dashboard StatsGrid component with tests
status: completed
completed: 2026-01-18
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Extract Dashboard StatsGrid Component

## Summary

Extract the 4-card statistics grid from `dashboard/page.tsx`. This includes Questions This Week, Avg Quality Score, Day Streak, and SMILE Points cards. Each card has conditional rendering logic and progress indicators.

## Current Behavior

Stats grid in `page.tsx` (lines 383-532) - ~150 lines containing:
- Questions This Week card with week change indicator
- Avg Quality Score card with conditional empty state
- Day Streak card with streak display
- SMILE Points & Tier card with progress bar

## Expected Behavior

```
dashboard/components/
└── StatsGrid.tsx  (~180 lines) - All 4 stat cards
```

Could optionally split into sub-components if needed:
```
dashboard/components/
├── StatsGrid.tsx
└── stats/
    ├── QuestionsCard.tsx
    ├── QualityCard.tsx
    ├── StreakCard.tsx
    └── PointsCard.tsx
```

## Acceptance Criteria

- [ ] Unit tests written FIRST covering all card states
- [ ] `StatsGrid.tsx` renders all 4 stat cards
- [ ] Week change shows positive/negative/zero states correctly
- [ ] Quality score shows empty state when 0
- [ ] Streak shows appropriate messages for 0/positive
- [ ] Tier progress bar renders with correct percentage
- [ ] Tests pass: `npm run test -- StatsGrid`
- [ ] Visual output identical to current

## Technical Approach

### 1. Write Tests First

```typescript
// tests/unit/app/dashboard/components/StatsGrid.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsGrid } from '@/app/(dashboard)/dashboard/components'
import type { UserStats } from '@/app/(dashboard)/dashboard/types'

const createMockStats = (overrides: Partial<UserStats> = {}): UserStats => ({
  total_questions: 25,
  questions_this_week: 5,
  week_change: 2,
  quality_score: 8.5,
  day_streak: 7,
  total_badge_points: 150,
  badges_earned: 3,
  badge_names: ['🔥 Week Warrior'],
  level_info: {
    current: {
      tier: { name: 'SMILE Learner', icon: '📚', color: '#3B82F6', minPoints: 5000, maxPoints: 9999, description: '' },
      progress_percentage: 30,
    },
    points_to_next: 350,
    is_max_tier: false,
  },
  total_groups: 2,
  activities: [],
  user_certificates: [],
  ...overrides,
})

describe('StatsGrid', () => {
  describe('Questions Card', () => {
    it('displays questions this week', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('This Week')).toBeInTheDocument()
    })

    it('shows total questions', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText(/25 total questions/)).toBeInTheDocument()
    })

    it('shows positive week change with up arrow', () => {
      render(<StatsGrid stats={createMockStats({ week_change: 3 })} />)
      expect(screen.getByText(/\+3 from last week/)).toBeInTheDocument()
    })

    it('shows negative week change with down arrow', () => {
      render(<StatsGrid stats={createMockStats({ week_change: -2 })} />)
      expect(screen.getByText(/-2 from last week/)).toBeInTheDocument()
    })

    it('shows no change message when week_change is 0', () => {
      render(<StatsGrid stats={createMockStats({ week_change: 0 })} />)
      expect(screen.getByText(/No change from last week/)).toBeInTheDocument()
    })
  })

  describe('Quality Score Card', () => {
    it('displays quality score when available', () => {
      render(<StatsGrid stats={createMockStats({ quality_score: 8.5 })} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
      expect(screen.getByText('Avg Quality Score')).toBeInTheDocument()
    })

    it('shows dash when quality score is 0', () => {
      render(<StatsGrid stats={createMockStats({ quality_score: 0 })} />)
      expect(screen.getByText('-')).toBeInTheDocument()
      expect(screen.getByText(/Create questions to see your score/)).toBeInTheDocument()
    })
  })

  describe('Streak Card', () => {
    it('displays day streak', () => {
      render(<StatsGrid stats={createMockStats({ day_streak: 7 })} />)
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('Day Streak')).toBeInTheDocument()
    })

    it('shows fire emoji for active streak', () => {
      render(<StatsGrid stats={createMockStats({ day_streak: 5 })} />)
      expect(screen.getByText(/5 day streak!/)).toBeInTheDocument()
    })

    it('shows start message when streak is 0 but has questions', () => {
      render(<StatsGrid stats={createMockStats({ day_streak: 0, total_questions: 5 })} />)
      expect(screen.getByText(/Start your streak!/)).toBeInTheDocument()
    })
  })

  describe('Points & Tier Card', () => {
    it('displays total badge points', () => {
      render(<StatsGrid stats={createMockStats({ total_badge_points: 150 })} />)
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('SMILE Points')).toBeInTheDocument()
    })

    it('displays current tier name', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText('SMILE Learner')).toBeInTheDocument()
    })

    it('shows progress to next tier', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText(/350 points to go/)).toBeInTheDocument()
    })

    it('shows max tier message when at SMILE Master', () => {
      const maxTierStats = createMockStats({
        level_info: {
          current: {
            tier: { name: 'SMILE Master', icon: '🏆', color: '#FFD700', minPoints: 100000, maxPoints: Infinity, description: '' },
            progress_percentage: 100,
          },
          points_to_next: 0,
          is_max_tier: true,
        },
      })
      render(<StatsGrid stats={maxTierStats} />)
      expect(screen.getByText(/Master Level Achieved!/)).toBeInTheDocument()
    })
  })
})
```

### 2. Create Component

```typescript
// dashboard/components/StatsGrid.tsx
import type { UserStats } from '../types'

interface StatsGridProps {
  stats: UserStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <QuestionsCard
        thisWeek={stats.questions_this_week}
        total={stats.total_questions}
        weekChange={stats.week_change}
      />
      <QualityCard
        score={stats.quality_score}
        totalQuestions={stats.total_questions}
      />
      <StreakCard
        streak={stats.day_streak}
        totalQuestions={stats.total_questions}
      />
      <PointsCard
        points={stats.total_badge_points}
        levelInfo={stats.level_info}
      />
    </div>
  )
}

// Internal sub-components (not exported)
function QuestionsCard({ thisWeek, total, weekChange }: { ... }) { ... }
function QualityCard({ score, totalQuestions }: { ... }) { ... }
function StreakCard({ streak, totalQuestions }: { ... }) { ... }
function PointsCard({ points, levelInfo }: { ... }) { ... }
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Source (lines 383-532)

## Dependencies

**Blocked By:**
- VIBE-0003A (Types)

**Blocks:**
- VIBE-0003H (Final Composition)

## Notes

- Consider using internal sub-components for each card
- Tailwind dynamic classes for colors need safelist or static classes
- Progress bar animation should be preserved

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as part of VIBE-0003 breakdown |
