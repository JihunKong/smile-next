---
id: VIBE-0003E
title: Extract Dashboard ActivityFeed and CommunityFeed with tests
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: s
assignee: ai-agent
---

# Extract Dashboard Activity Feeds

## Summary

Extract the two-column activity section from `dashboard/page.tsx`: the user's personal activity feed and the community buzz feed. These are displayed side-by-side on larger screens.

## Current Behavior

Two-column grid in `page.tsx` (lines 708-826) - ~120 lines containing:
- **Your Activity** (lines 710-757) - User's recent questions with empty state
- **Community Buzz** (lines 759-826) - Static community feed with challenge

## Expected Behavior

```
dashboard/components/
├── ActivityFeed.tsx    (~100 lines) - User's recent activity
└── CommunityFeed.tsx   (~100 lines) - Community buzz section
```

## Acceptance Criteria

- [ ] Unit tests written FIRST for both components
- [ ] `ActivityFeed.tsx` shows user's recent activities
- [ ] `ActivityFeed.tsx` shows empty state when no activities
- [ ] `CommunityFeed.tsx` renders community items
- [ ] `CommunityFeed.tsx` shows weekly challenge with dynamic participant count
- [ ] Tests pass: `npm run test -- ActivityFeeds`
- [ ] Visual output identical to current

## Technical Approach

### 1. Write Tests First

```typescript
// tests/unit/app/dashboard/components/ActivityFeeds.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ActivityFeed, CommunityFeed } from '@/app/(dashboard)/dashboard/components'

describe('ActivityFeed', () => {
  it('shows empty state when no activities', () => {
    render(<ActivityFeed activities={[]} totalQuestions={0} />)
    expect(screen.getByText('No recent activity')).toBeInTheDocument()
    expect(screen.getByText(/Start by joining a group/)).toBeInTheDocument()
  })

  it('renders activity items', () => {
    const activities = [{
      id: '1',
      title: 'Created question in Math 101',
      subtitle: 'What is the derivative of...',
      timestamp: new Date('2026-01-18'),
      icon: 'fa-question-circle',
      color: 'blue',
      badge_progress: true,
    }]
    render(<ActivityFeed activities={activities} totalQuestions={5} />)
    expect(screen.getByText('Created question in Math 101')).toBeInTheDocument()
  })

  it('shows high quality badge when badge_progress is true', () => {
    const activities = [{
      id: '1',
      title: 'Test',
      subtitle: '',
      timestamp: new Date(),
      icon: 'fa-question-circle',
      color: 'blue',
      badge_progress: true,
    }]
    render(<ActivityFeed activities={activities} totalQuestions={5} />)
    expect(screen.getByText(/High Quality!/)).toBeInTheDocument()
  })

  it('shows View All link', () => {
    render(<ActivityFeed activities={[]} totalQuestions={0} />)
    expect(screen.getByRole('link', { name: /View All/i })).toHaveAttribute('href', '/my-events')
  })

  it('shows call-to-action button', () => {
    render(<ActivityFeed activities={[]} totalQuestions={0} />)
    expect(screen.getByRole('link', { name: /Ask Today's Question/i })).toHaveAttribute('href', '/activities')
  })
})

describe('CommunityFeed', () => {
  it('renders Community Buzz heading', () => {
    render(<CommunityFeed totalQuestions={10} />)
    expect(screen.getByText('Community Buzz')).toBeInTheDocument()
  })

  it('shows Live badge', () => {
    render(<CommunityFeed totalQuestions={10} />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('shows community member activities', () => {
    render(<CommunityFeed totalQuestions={10} />)
    expect(screen.getByText(/Dr. Sarah Chen/)).toBeInTheDocument()
    expect(screen.getByText(/Marcus Rodriguez/)).toBeInTheDocument()
  })

  it('shows weekly challenge', () => {
    render(<CommunityFeed totalQuestions={10} />)
    expect(screen.getByText(/Weekly Challenge/)).toBeInTheDocument()
    expect(screen.getByText(/Subject Explorer/)).toBeInTheDocument()
  })

  it('shows Join Challenge button', () => {
    render(<CommunityFeed totalQuestions={10} />)
    expect(screen.getByRole('link', { name: /Join Challenge/i })).toHaveAttribute('href', '/dashboard/join-challenge')
  })

  it('shows active learners count', () => {
    render(<CommunityFeed totalQuestions={10} />)
    expect(screen.getByText(/847.*active learners/)).toBeInTheDocument()
  })

  it('adjusts participant count based on totalQuestions', () => {
    // When totalQuestions > 0, shows 156 participants
    render(<CommunityFeed totalQuestions={5} />)
    expect(screen.getByText(/156 participants/)).toBeInTheDocument()
  })
})
```

### 2. Create Components

```typescript
// dashboard/components/ActivityFeed.tsx
import Link from 'next/link'
import type { ProcessedActivity } from '../types'

interface ActivityFeedProps {
  activities: ProcessedActivity[]
  totalQuestions: number
}

export function ActivityFeed({ activities, totalQuestions }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <i className="fas fa-user-clock text-blue-500 mr-2"></i>Your Activity
        </h2>
        <Link href="/my-events" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <EmptyState />
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-3">🎯 Keep your streak alive!</div>
          <Link
            href="/activities"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <i className="fas fa-plus mr-2"></i>Ask Today&apos;s Question
          </Link>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: ProcessedActivity }) { ... }
function EmptyState() { ... }
```

```typescript
// dashboard/components/CommunityFeed.tsx
import Link from 'next/link'

interface CommunityFeedProps {
  totalQuestions: number
}

// Static community data (could be dynamic in future)
const COMMUNITY_ITEMS = [
  { initials: 'SC', name: 'Dr. Sarah Chen', action: 'earned the', badge: '🏆 Research Master', time: '15 minutes ago', detail: '10 questions with perfect AI scores', color: 'blue' },
  { initials: 'MR', name: 'Marcus Rodriguez', action: 'asked', quote: 'How will quantum computing change cryptography?', time: '2 hours ago', detail: '7 responses already', color: 'green' },
  // ... more items
]

export function CommunityFeed({ totalQuestions }: CommunityFeedProps) {
  const participantCount = totalQuestions > 0 ? 156 : 89
  const streakDays = totalQuestions > 1 ? 25 : 7

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <i className="fas fa-globe text-green-500 mr-2"></i>Community Buzz
        </h2>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
      </div>

      <div className="space-y-4">
        {/* Community items */}
        {/* Weekly challenge */}
        {/* Active learners count */}
      </div>
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Source (lines 708-826)

## Dependencies

**Blocked By:**
- VIBE-0003A (Types)

**Blocks:**
- VIBE-0003H (Final Composition)

## Notes

- CommunityFeed has mostly static/placeholder data currently
- Consider making community data dynamic in future enhancement
- ActivityFeed uses dynamic Tailwind classes for colors

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as part of VIBE-0003 breakdown |
