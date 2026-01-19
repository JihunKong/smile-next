/**
 * getDashboardData Tests
 *
 * Tests for the dashboard data fetching layer.
 * Uses mocked Prisma to avoid database calls.
 *
 * Part of VIBE-0003B refactoring.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock calls are hoisted, so we need to use vi.hoisted for shared mock objects
const mockPrisma = vi.hoisted(() => ({
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
}))

const mockGetUserStreak = vi.hoisted(() => vi.fn())

// Mock Prisma client
vi.mock('@/lib/db/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock streak service
vi.mock('@/lib/services/streakService', () => ({
  getUserStreak: mockGetUserStreak,
  BADGE_DEFINITIONS: {
    week_warrior: { id: 'week_warrior', name: 'Week Warrior', icon: '🔥' },
    month_master: { id: 'month_master', name: 'Month Master', icon: '🏆' },
    streak_starter: { id: 'streak_starter', name: 'Streak Starter', icon: '⚡' },
  },
}))

// Import after mocking
import { getDashboardData, getDefaultStats } from '@/app/(dashboard)/dashboard/lib/getDashboardData'

describe('getDashboardData', () => {
  const TEST_USER_ID = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks for empty state
    mockPrisma.question.count.mockResolvedValue(0)
    mockPrisma.question.findMany.mockResolvedValue([])
    mockPrisma.question.aggregate.mockResolvedValue({
      _avg: { questionEvaluationScore: null },
    })
    mockPrisma.groupUser.count.mockResolvedValue(0)
    mockPrisma.studentCertificate.findMany.mockResolvedValue([])
    mockGetUserStreak.mockResolvedValue({
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      weeklyActivityDays: 0,
      monthlyActivityDays: 0,
      badges: [],
    })
  })

  describe('default/empty state', () => {
    it('returns default values when user has no data', async () => {
      const result = await getDashboardData(TEST_USER_ID)

      expect(result.total_questions).toBe(0)
      expect(result.questions_this_week).toBe(0)
      expect(result.week_change).toBe(0)
      expect(result.quality_score).toBe(0)
      expect(result.day_streak).toBe(0)
      expect(result.total_badge_points).toBe(0)
      expect(result.badges_earned).toBe(0)
      expect(result.badge_names).toEqual([])
      expect(result.total_groups).toBe(0)
      expect(result.activities).toEqual([])
      expect(result.user_certificates).toEqual([])
      expect(result.error).toBeUndefined()
    })

    it('returns level_info for 0 points', async () => {
      const result = await getDashboardData(TEST_USER_ID)

      expect(result.level_info).toBeDefined()
      expect(result.level_info.current.tier.name).toBe('SMILE Starter')
      expect(result.level_info.is_max_tier).toBe(false)
    })
  })

  describe('question counts', () => {
    it('returns correct total question count', async () => {
      mockPrisma.question.count
        .mockResolvedValueOnce(25) // total
        .mockResolvedValueOnce(0) // this week
        .mockResolvedValueOnce(0) // last week

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.total_questions).toBe(25)
    })

    it('returns correct questions this week count', async () => {
      mockPrisma.question.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(10) // this week
        .mockResolvedValueOnce(5) // last week

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.questions_this_week).toBe(10)
    })

    it('calculates positive week_change correctly', async () => {
      mockPrisma.question.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(10) // this week
        .mockResolvedValueOnce(5) // last week

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.week_change).toBe(5) // 10 - 5
    })

    it('calculates negative week_change correctly', async () => {
      mockPrisma.question.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(3) // this week
        .mockResolvedValueOnce(8) // last week

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.week_change).toBe(-5) // 3 - 8
    })

    it('calculates zero week_change correctly', async () => {
      mockPrisma.question.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(7) // this week
        .mockResolvedValueOnce(7) // last week

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.week_change).toBe(0)
    })
  })

  describe('quality score', () => {
    it('calculates quality score average correctly', async () => {
      mockPrisma.question.aggregate.mockResolvedValue({
        _avg: { questionEvaluationScore: 8.5 },
      })

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.quality_score).toBe(8.5)
    })

    it('rounds quality score to one decimal', async () => {
      mockPrisma.question.aggregate.mockResolvedValue({
        _avg: { questionEvaluationScore: 7.777 },
      })

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.quality_score).toBe(7.8)
    })

    it('returns 0 for quality score when no scores available', async () => {
      mockPrisma.question.aggregate.mockResolvedValue({
        _avg: { questionEvaluationScore: null },
      })

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.quality_score).toBe(0)
    })
  })

  describe('groups count', () => {
    it('returns correct total groups count', async () => {
      mockPrisma.groupUser.count.mockResolvedValue(5)

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.total_groups).toBe(5)
    })
  })

  describe('streak and badges from streakService', () => {
    it('uses streak from streakService', async () => {
      mockGetUserStreak.mockResolvedValue({
        currentStreak: 7,
        longestStreak: 14,
        lastActivityDate: new Date(),
        weeklyActivityDays: 5,
        monthlyActivityDays: 20,
        badges: [],
      })

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.day_streak).toBe(7)
    })

    it('counts badges correctly', async () => {
      mockGetUserStreak.mockResolvedValue({
        currentStreak: 7,
        longestStreak: 14,
        lastActivityDate: new Date(),
        weeklyActivityDays: 5,
        monthlyActivityDays: 20,
        badges: [
          { badgeId: 'week_warrior', badgeName: 'Week Warrior' },
          { badgeId: 'streak_starter', badgeName: 'Streak Starter' },
        ],
      })

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.badges_earned).toBe(2)
    })

    it('formats badge names with icons', async () => {
      mockGetUserStreak.mockResolvedValue({
        currentStreak: 30,
        longestStreak: 30,
        lastActivityDate: new Date(),
        weeklyActivityDays: 7,
        monthlyActivityDays: 30,
        badges: [
          { badgeId: 'week_warrior', badgeName: 'Week Warrior' },
          { badgeId: 'month_master', badgeName: 'Month Master' },
        ],
      })

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.badge_names).toContain('🔥 Week Warrior')
      expect(result.badge_names).toContain('🏆 Month Master')
    })

    it('falls back to badge name when definition not found', async () => {
      mockGetUserStreak.mockResolvedValue({
        currentStreak: 7,
        longestStreak: 7,
        lastActivityDate: new Date(),
        weeklyActivityDays: 5,
        monthlyActivityDays: 20,
        badges: [
          { badgeId: 'unknown_badge', badgeName: 'Unknown Badge' },
        ],
      })

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.badge_names).toContain('Unknown Badge')
    })

    it('calculates total badge points (10 points per badge)', async () => {
      mockGetUserStreak.mockResolvedValue({
        currentStreak: 7,
        longestStreak: 7,
        lastActivityDate: new Date(),
        weeklyActivityDays: 5,
        monthlyActivityDays: 20,
        badges: [
          { badgeId: 'week_warrior', badgeName: 'Week Warrior' },
          { badgeId: 'streak_starter', badgeName: 'Streak Starter' },
          { badgeId: 'month_master', badgeName: 'Month Master' },
        ],
      })

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.total_badge_points).toBe(30) // 3 badges * 10 points
    })
  })

  describe('recent activities processing', () => {
    it('processes recent activities correctly', async () => {
      const now = new Date()
      mockPrisma.question.findMany.mockResolvedValue([
        {
          id: 'q-1',
          content: 'This is a test question content that is quite long',
          createdAt: now,
          questionEvaluationScore: 9,
          activity: { id: 'act-1', name: 'Math 101' },
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].id).toBe('q-1')
      expect(result.activities[0].title).toBe('Created question in Math 101')
      expect(result.activities[0].icon).toBe('fa-question-circle')
      expect(result.activities[0].color).toBe('blue')
    })

    it('truncates long content in activity subtitle', async () => {
      const longContent = 'This is a very long question content that exceeds fifty characters and should be truncated'
      mockPrisma.question.findMany.mockResolvedValue([
        {
          id: 'q-1',
          content: longContent,
          createdAt: new Date(),
          questionEvaluationScore: 5,
          activity: { id: 'act-1', name: 'Test Activity' },
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.activities[0].subtitle.length).toBeLessThanOrEqual(53) // 50 chars + '...'
      expect(result.activities[0].subtitle).toContain('...')
    })

    it('marks high-quality questions (score >= 8) with badge_progress', async () => {
      mockPrisma.question.findMany.mockResolvedValue([
        {
          id: 'q-1',
          content: 'High quality question',
          createdAt: new Date(),
          questionEvaluationScore: 9,
          activity: { id: 'act-1', name: 'Test' },
        },
        {
          id: 'q-2',
          content: 'Normal quality question',
          createdAt: new Date(),
          questionEvaluationScore: 6,
          activity: { id: 'act-2', name: 'Test 2' },
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.activities[0].badge_progress).toBe(true)
      expect(result.activities[1].badge_progress).toBe(false)
    })

    it('filters out activities with missing activity relation', async () => {
      mockPrisma.question.findMany.mockResolvedValue([
        {
          id: 'q-1',
          content: 'Valid question',
          createdAt: new Date(),
          questionEvaluationScore: 7,
          activity: { id: 'act-1', name: 'Valid Activity' },
        },
        {
          id: 'q-2',
          content: 'Question with null activity',
          createdAt: new Date(),
          questionEvaluationScore: 7,
          activity: null,
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.activities).toHaveLength(1)
      expect(result.activities[0].id).toBe('q-1')
    })
  })

  describe('certificates processing', () => {
    it('processes certificates correctly', async () => {
      const enrollmentDate = new Date('2024-01-15')
      mockPrisma.studentCertificate.findMany.mockResolvedValue([
        {
          id: 'cert-1',
          enrollmentDate,
          completionDate: null,
          certificate: {
            name: 'Test Certificate',
            activities: [
              {
                activityId: 'act-1',
                required: true,
                activity: { name: 'Activity 1' },
              },
            ],
          },
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.user_certificates).toHaveLength(1)
      expect(result.user_certificates[0].id).toBe('cert-1')
      expect(result.user_certificates[0].name).toBe('Test Certificate')
      expect(result.user_certificates[0].status).toBe('in_progress')
      expect(result.user_certificates[0].activities).toHaveLength(1)
    })

    it('marks completed certificates correctly', async () => {
      const completionDate = new Date('2024-02-15')
      mockPrisma.studentCertificate.findMany.mockResolvedValue([
        {
          id: 'cert-1',
          enrollmentDate: new Date('2024-01-15'),
          completionDate,
          certificate: {
            name: 'Completed Certificate',
            activities: [],
          },
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.user_certificates[0].status).toBe('completed')
      expect(result.user_certificates[0].completion_date).toEqual(completionDate)
    })

    it('filters out certificates with missing certificate relation', async () => {
      mockPrisma.studentCertificate.findMany.mockResolvedValue([
        {
          id: 'cert-1',
          enrollmentDate: new Date(),
          completionDate: null,
          certificate: {
            name: 'Valid Certificate',
            activities: [],
          },
        },
        {
          id: 'cert-2',
          enrollmentDate: new Date(),
          completionDate: null,
          certificate: null,
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.user_certificates).toHaveLength(1)
      expect(result.user_certificates[0].id).toBe('cert-1')
    })

    it('filters out activities with missing activity relation in certificates', async () => {
      mockPrisma.studentCertificate.findMany.mockResolvedValue([
        {
          id: 'cert-1',
          enrollmentDate: new Date(),
          completionDate: null,
          certificate: {
            name: 'Test Certificate',
            activities: [
              {
                activityId: 'act-1',
                required: true,
                activity: { name: 'Valid Activity' },
              },
              {
                activityId: 'act-2',
                required: false,
                activity: null,
              },
            ],
          },
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.user_certificates[0].activities).toHaveLength(1)
      expect(result.user_certificates[0].activities[0].activity_name).toBe('Valid Activity')
    })

    it('handles certificate name fallback for missing name', async () => {
      mockPrisma.studentCertificate.findMany.mockResolvedValue([
        {
          id: 'cert-1',
          enrollmentDate: new Date(),
          completionDate: null,
          certificate: {
            name: null, // Missing name
            activities: [],
          },
        },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.user_certificates[0].name).toBe('Unknown Certificate')
    })
  })

  describe('error handling', () => {
    it('returns default stats on Prisma error', async () => {
      mockPrisma.question.count.mockRejectedValue(new Error('Database connection failed'))

      const result = await getDashboardData(TEST_USER_ID)

      expect(result.error).toBeDefined()
      expect(result.error).toBe('Database connection failed')
      expect(result.total_questions).toBe(0)
      expect(result.activities).toEqual([])
    })

    it('handles streak service error gracefully with fallback calculation', async () => {
      // Setup streak service to fail
      mockGetUserStreak.mockRejectedValue(new Error('Streak service unavailable'))

      // Setup dayStreak data for fallback calculation
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      // Return questions for fallback streak calculation
      mockPrisma.question.findMany.mockResolvedValue([
        { createdAt: today },
        { createdAt: yesterday },
        { createdAt: twoDaysAgo },
      ])

      const result = await getDashboardData(TEST_USER_ID)

      // Should fall back to local calculation without error
      expect(result.error).toBeUndefined()
      expect(result.day_streak).toBeGreaterThanOrEqual(0)
    })

    it('handles certificate fetch error gracefully', async () => {
      mockPrisma.studentCertificate.findMany.mockRejectedValue(
        new Error('Certificate table not found')
      )

      const result = await getDashboardData(TEST_USER_ID)

      // Should continue without certificates
      expect(result.user_certificates).toEqual([])
      expect(result.error).toBeUndefined() // Other data should still work
    })
  })
})

describe('getDefaultStats', () => {
  it('returns correct default values', () => {
    const result = getDefaultStats()

    expect(result.total_questions).toBe(0)
    expect(result.questions_this_week).toBe(0)
    expect(result.week_change).toBe(0)
    expect(result.quality_score).toBe(0)
    expect(result.day_streak).toBe(0)
    expect(result.total_badge_points).toBe(0)
    expect(result.badges_earned).toBe(0)
    expect(result.badge_names).toEqual([])
    expect(result.total_groups).toBe(0)
    expect(result.activities).toEqual([])
    expect(result.user_certificates).toEqual([])
    expect(result.level_info).toBeDefined()
  })

  it('includes error message when provided', () => {
    const error = new Error('Test error message')
    const result = getDefaultStats(error)

    expect(result.error).toBe('Test error message')
  })

  it('handles non-Error objects', () => {
    const result = getDefaultStats('string error')

    expect(result.error).toBe('Failed to load statistics')
  })
})
