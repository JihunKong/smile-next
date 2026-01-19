---
id: VIBE-0003B
title: Extract Dashboard data fetching layer with mocked tests
status: completed
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-19
completed: 2026-01-19
effort: s
assignee: ai-agent
---

# Extract Dashboard Data Fetching Layer

## Summary

Extract the `getUserStats()` function (~226 lines) from `dashboard/page.tsx` into a dedicated `getDashboardData.ts` module with comprehensive mocked Prisma tests. This isolates all database queries and enables parallel data fetching.

## Current Behavior

`getUserStats()` function in `page.tsx` (lines 42-268):
- Sequential Prisma queries
- Mixed business logic and error handling
- Streak calculation with fallback
- Certificate processing
- Activity processing

## Expected Behavior

Clean data layer:

```
dashboard/lib/
└── getDashboardData.ts  (~200 lines) - All data fetching with Promise.all
```

## Acceptance Criteria

- [x] Unit tests written FIRST with mocked Prisma
- [x] `getDashboardData.ts` created with parallel Promise.all queries
- [x] All Prisma queries moved from page.tsx
- [x] Error handling preserved (graceful fallbacks)
- [x] Streak service integration maintained
- [x] Tests cover: empty data, normal data, error cases
- [x] Tests pass: `npm run test -- getDashboardData`
- [x] No changes to dashboard functionality

## Technical Approach

### 1. Write Tests First

```typescript
// tests/unit/app/dashboard/lib/getDashboardData.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
const mockPrisma = {
  question: {
    count: vi.fn(),
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
  groupUser: {
    count: vi.fn(),
  },
  studentCertificate: {
    findMany: vi.fn(),
  },
}

vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock streak service
vi.mock('@/lib/services/streakService', () => ({
  getUserStreak: vi.fn(),
  BADGE_DEFINITIONS: {},
}))

import { getDashboardData } from '@/app/(dashboard)/dashboard/lib/getDashboardData'
import { getUserStreak } from '@/lib/services/streakService'

describe('getDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mocks
    mockPrisma.question.count.mockResolvedValue(0)
    mockPrisma.question.findMany.mockResolvedValue([])
    mockPrisma.question.aggregate.mockResolvedValue({ _avg: { questionEvaluationScore: null } })
    mockPrisma.groupUser.count.mockResolvedValue(0)
    mockPrisma.studentCertificate.findMany.mockResolvedValue([])
    ;(getUserStreak as any).mockResolvedValue({ currentStreak: 0, badges: [] })
  })

  it('returns default values when user has no data', async () => {
    const result = await getDashboardData('user-123')
    
    expect(result.total_questions).toBe(0)
    expect(result.questions_this_week).toBe(0)
    expect(result.day_streak).toBe(0)
    expect(result.activities).toEqual([])
    expect(result.user_certificates).toEqual([])
  })

  it('calculates week_change correctly', async () => {
    mockPrisma.question.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(5)  // this week
      .mockResolvedValueOnce(3)  // last week
    
    const result = await getDashboardData('user-123')
    
    expect(result.week_change).toBe(2) // 5 - 3
  })

  it('calculates quality score average', async () => {
    mockPrisma.question.aggregate.mockResolvedValue({
      _avg: { questionEvaluationScore: 8.5 }
    })
    
    const result = await getDashboardData('user-123')
    
    expect(result.quality_score).toBe(8.5)
  })

  it('uses streak from streakService', async () => {
    ;(getUserStreak as any).mockResolvedValue({
      currentStreak: 7,
      badges: [{ badgeId: 'week_warrior', badgeName: 'Week Warrior' }]
    })
    
    const result = await getDashboardData('user-123')
    
    expect(result.day_streak).toBe(7)
    expect(result.badges_earned).toBe(1)
  })

  it('handles Prisma errors gracefully', async () => {
    mockPrisma.question.count.mockRejectedValue(new Error('DB error'))
    
    const result = await getDashboardData('user-123')
    
    expect(result.error).toBeDefined()
    expect(result.total_questions).toBe(0) // fallback
  })

  it('processes certificates correctly', async () => {
    mockPrisma.studentCertificate.findMany.mockResolvedValue([{
      id: 'cert-1',
      enrollmentDate: new Date(),
      completionDate: null,
      certificate: {
        name: 'Test Certificate',
        activities: [
          { activityId: 'act-1', required: true, activity: { name: 'Activity 1' } }
        ]
      }
    }])
    
    const result = await getDashboardData('user-123')
    
    expect(result.user_certificates).toHaveLength(1)
    expect(result.user_certificates[0].name).toBe('Test Certificate')
    expect(result.user_certificates[0].activities).toHaveLength(1)
  })

  it('processes recent activities correctly', async () => {
    mockPrisma.question.findMany.mockResolvedValue([{
      id: 'q-1',
      content: 'Test question content here',
      createdAt: new Date(),
      questionEvaluationScore: 9,
      activity: { id: 'act-1', name: 'Math 101' }
    }])
    
    const result = await getDashboardData('user-123')
    
    expect(result.activities).toHaveLength(1)
    expect(result.activities[0].title).toContain('Math 101')
  })
})
```

### 2. Extract Data Fetching

```typescript
// dashboard/lib/getDashboardData.ts
import { prisma } from '@/lib/db/prisma'
import { getUserStreak, BADGE_DEFINITIONS } from '@/lib/services/streakService'
import { getTierInfo } from './tierUtils'
import type { UserStats, ProcessedCertificate, ProcessedActivity } from '../types'

export async function getDashboardData(userId: string): Promise<UserStats> {
  try {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Parallel fetch for performance
    const [
      totalQuestions,
      questionsThisWeek,
      questionsLastWeek,
      totalGroups,
      qualityScores,
      recentActivities,
      userCertificates,
      streakData,
    ] = await Promise.all([
      prisma.question.count({ where: { creatorId: userId, isDeleted: false } }),
      prisma.question.count({ where: { creatorId: userId, isDeleted: false, createdAt: { gte: oneWeekAgo } } }),
      prisma.question.count({ where: { creatorId: userId, isDeleted: false, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.groupUser.count({ where: { userId, group: { isDeleted: false } } }),
      prisma.question.aggregate({ where: { creatorId: userId, isDeleted: false, questionEvaluationScore: { not: null } }, _avg: { questionEvaluationScore: true } }),
      fetchRecentActivities(userId),
      fetchUserCertificates(userId),
      fetchStreakData(userId),
    ])

    // Process results...
    return {
      total_questions: totalQuestions,
      questions_this_week: questionsThisWeek,
      week_change: questionsThisWeek - questionsLastWeek,
      // ... rest of processing
    }
  } catch (error) {
    console.error('Failed to get dashboard data:', error)
    return getDefaultStats(error)
  }
}

// Helper functions for complex queries
async function fetchRecentActivities(userId: string): Promise<ProcessedActivity[]> { ... }
async function fetchUserCertificates(userId: string): Promise<ProcessedCertificate[]> { ... }
async function fetchStreakData(userId: string) { ... }
function getDefaultStats(error?: unknown): UserStats { ... }
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Source (lines 42-268)
- `src/lib/db/prisma.ts` - Prisma client
- `src/lib/services/streakService.ts` - Streak logic

## Dependencies

**Blocked By:**
- VIBE-0003A (Types and Tier Utils)

**Blocks:**
- VIBE-0003H (Final Composition)

## Notes

- Use `Promise.all` for parallel queries (performance improvement)
- Keep error handling identical to current behavior
- Mock Prisma using `vi.mock()` - don't hit real database
- Consider extracting helper functions for readability

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as part of VIBE-0003 breakdown |
