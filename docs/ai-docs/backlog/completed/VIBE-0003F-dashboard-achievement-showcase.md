---
id: VIBE-0003F
title: Extract Dashboard AchievementShowcase with tests
status: completed
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
completed: 2026-01-18
effort: s
assignee: ai-agent
---

# Extract Dashboard Achievement Showcase

## Summary

Extract the 3-column achievements grid from `dashboard/page.tsx`. This includes Recent Achievements, Getting Started guide, and Your Progress sections. Each has conditional rendering based on user state.

## Current Behavior

Three-column grid in `page.tsx` (lines 829-973) - ~145 lines containing:
- **Recent Achievements** - Badge display or getting started message
- **Getting Started** - Onboarding steps for new users
- **Your Progress** - Progress summary or coming soon message

## Expected Behavior

```
dashboard/components/
└── AchievementShowcase.tsx  (~180 lines) - 3-column showcase grid
```

## Acceptance Criteria

- [ ] Unit tests written FIRST covering all user states
- [ ] `AchievementShowcase.tsx` handles: new user, user with questions, user with badges
- [ ] Recent Achievements shows badges when earned
- [ ] Getting Started shows onboarding for new users
- [ ] Your Progress shows appropriate message
- [ ] Tests pass: `npm run test -- AchievementShowcase`
- [ ] Visual output identical to current

## Technical Approach

### 1. Write Tests First

```typescript
// tests/unit/app/dashboard/components/AchievementShowcase.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AchievementShowcase } from '@/app/(dashboard)/dashboard/components'

describe('AchievementShowcase', () => {
  describe('Recent Achievements section', () => {
    it('shows badges when user has earned some', () => {
      render(
        <AchievementShowcase
          badgesEarned={3}
          badgeNames={['🔥 Week Warrior', '📚 Question Master']}
          totalQuestions={50}
        />
      )
      expect(screen.getByText('Recent Achievements')).toBeInTheDocument()
      expect(screen.getByText('🔥 Week Warrior')).toBeInTheDocument()
      expect(screen.getByText('📚 Question Master')).toBeInTheDocument()
    })

    it('shows "view complete badge gallery" link when has badges', () => {
      render(
        <AchievementShowcase badgesEarned={1} badgeNames={['🔥 Test']} totalQuestions={10} />
      )
      expect(screen.getByRole('link', { name: /View complete badge gallery/i })).toHaveAttribute(
        'href',
        '/profile#achievements-tab'
      )
    })

    it('shows progress message when user has questions but no badges', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={10} />)
      expect(screen.getByText(/Keep creating questions/)).toBeInTheDocument()
      expect(screen.getByText(/making progress toward your first badge/)).toBeInTheDocument()
    })

    it('shows getting started message for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByText(/Ready to get started/)).toBeInTheDocument()
      expect(screen.getByText(/Create your first question/)).toBeInTheDocument()
    })
  })

  describe('Getting Started section', () => {
    it('shows challenges message for users with questions', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={10} />)
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText(/Challenges coming soon/)).toBeInTheDocument()
    })

    it('shows onboarding steps for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByText('Create Your First Question')).toBeInTheDocument()
      expect(screen.getByText('Build Your Profile')).toBeInTheDocument()
      expect(screen.getByText('Explore Features')).toBeInTheDocument()
    })

    it('shows Find Groups link for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByRole('link', { name: /Find Groups/i })).toHaveAttribute('href', '/groups')
    })
  })

  describe('Your Progress section', () => {
    it('shows community features coming soon for users with questions', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={10} />)
      expect(screen.getByText('Your Progress')).toBeInTheDocument()
      expect(screen.getByText(/Community features coming soon/)).toBeInTheDocument()
    })

    it('shows journey start message for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByText(/Your journey starts here/)).toBeInTheDocument()
      expect(screen.getByText(/Track your question quality scores/)).toBeInTheDocument()
    })
  })
})
```

### 2. Create Component

```typescript
// dashboard/components/AchievementShowcase.tsx
import Link from 'next/link'

interface AchievementShowcaseProps {
  badgesEarned: number
  badgeNames: string[]
  totalQuestions: number
}

export function AchievementShowcase({
  badgesEarned,
  badgeNames,
  totalQuestions,
}: AchievementShowcaseProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <RecentAchievements
        badgesEarned={badgesEarned}
        badgeNames={badgeNames}
        totalQuestions={totalQuestions}
      />
      <GettingStarted totalQuestions={totalQuestions} />
      <YourProgress totalQuestions={totalQuestions} />
    </div>
  )
}

function RecentAchievements({ badgesEarned, badgeNames, totalQuestions }: {
  badgesEarned: number
  badgeNames: string[]
  totalQuestions: number
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-trophy text-yellow-500 mr-2"></i>Recent Achievements
      </h3>
      
      {badgesEarned > 0 ? (
        <BadgeList badgeNames={badgeNames} />
      ) : totalQuestions > 0 ? (
        <ProgressMessage />
      ) : (
        <NewUserMessage />
      )}
    </div>
  )
}

function GettingStarted({ totalQuestions }: { totalQuestions: number }) {
  // Render onboarding or challenges based on totalQuestions
}

function YourProgress({ totalQuestions }: { totalQuestions: number }) {
  // Render progress or journey start based on totalQuestions
}

// Helper components
function BadgeList({ badgeNames }: { badgeNames: string[] }) { ... }
function ProgressMessage() { ... }
function NewUserMessage() { ... }
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Source (lines 829-973)

## Dependencies

**Blocked By:**
- VIBE-0003A (Types)

**Blocks:**
- VIBE-0003H (Final Composition)

## Notes

- Complex conditional rendering based on user state
- Consider reusing `src/components/gamification/BadgeGrid` in future
- Three distinct user states: new, active, badged

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as part of VIBE-0003 breakdown |
