/**
 * Dashboard Data Fetching Layer
 *
 * Centralized data fetching for the dashboard page.
 * All Prisma queries are executed with error handling and graceful fallbacks.
 *
 * Part of VIBE-0003B refactoring.
 */

import { prisma } from '@/lib/db/prisma'
import { getUserStreak, BADGE_DEFINITIONS } from '@/lib/services/streakService'
import { getTierInfo } from './tierUtils'
import type {
  UserStats,
  ProcessedCertificate,
  ProcessedActivity,
  CertificateActivityStatus,
} from '../types'

// ============================================================================
// Main Data Fetching Function
// ============================================================================

/**
 * Fetch all dashboard data for a user.
 *
 * @param userId - The user's ID
 * @returns UserStats object with all dashboard data
 */
export async function getDashboardData(userId: string): Promise<UserStats> {
  try {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Execute core queries (essential data)
    const [
      totalQuestions,
      questionsThisWeek,
      questionsLastWeek,
      totalGroups,
      qualityScores,
    ] = await Promise.all([
      prisma.question.count({
        where: { creatorId: userId, isDeleted: false },
      }),
      prisma.question.count({
        where: {
          creatorId: userId,
          isDeleted: false,
          createdAt: { gte: oneWeekAgo },
        },
      }),
      prisma.question.count({
        where: {
          creatorId: userId,
          isDeleted: false,
          createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      prisma.groupUser.count({
        where: { userId, group: { isDeleted: false } },
      }),
      prisma.question.aggregate({
        where: {
          creatorId: userId,
          isDeleted: false,
          questionEvaluationScore: { not: null },
        },
        _avg: { questionEvaluationScore: true },
      }),
    ])

    // Fetch secondary data (can fail gracefully)
    const [recentActivities, dayStreakData, streakResult, userCertificates] =
      await Promise.all([
        fetchRecentActivities(userId),
        fetchDayStreakData(userId),
        fetchStreakData(userId),
        fetchUserCertificates(userId),
      ])

    // Calculate week change
    const weekChange = questionsThisWeek - questionsLastWeek

    // Process streak and badges
    const { streak, badgesEarned, badgeNames, totalBadgePoints } = processStreakData(
      streakResult,
      dayStreakData
    )

    // Get tier info
    const levelInfo = getTierInfo(totalBadgePoints)

    // Process quality score
    const qualityScore = qualityScores._avg.questionEvaluationScore
      ? Math.round(qualityScores._avg.questionEvaluationScore * 10) / 10
      : 0

    // Process activities and certificates
    const processedActivities = processRecentActivities(recentActivities)
    const processedCertificates = processCertificates(userCertificates)

    return {
      total_questions: totalQuestions,
      questions_this_week: questionsThisWeek,
      week_change: weekChange,
      quality_score: qualityScore,
      day_streak: streak,
      total_badge_points: totalBadgePoints,
      badges_earned: badgesEarned,
      badge_names: badgeNames,
      level_info: levelInfo,
      total_groups: totalGroups,
      activities: processedActivities,
      user_certificates: processedCertificates,
    }
  } catch (error) {
    console.error('Failed to get dashboard data:', error)
    return getDefaultStats(error)
  }
}

// ============================================================================
// Helper Functions for Data Fetching
// ============================================================================

/**
 * Fetch recent activities (questions) for the user.
 */
async function fetchRecentActivities(userId: string) {
  try {
    return await prisma.question.findMany({
      where: {
        creatorId: userId,
        isDeleted: false,
        activity: { isDeleted: false },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        questionEvaluationScore: true,
        activity: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
  } catch (error) {
    console.error('Failed to fetch recent activities:', error)
    return []
  }
}

/**
 * Fetch day streak data for fallback calculation.
 */
async function fetchDayStreakData(userId: string) {
  try {
    return await prisma.question.findMany({
      where: { creatorId: userId, isDeleted: false },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
  } catch (error) {
    console.error('Failed to fetch day streak data:', error)
    return []
  }
}

/**
 * Fetch streak data from streak service.
 */
async function fetchStreakData(userId: string) {
  try {
    return await getUserStreak(userId)
  } catch (error) {
    console.error('Failed to fetch streak data:', error)
    return null
  }
}

/**
 * Fetch user certificates.
 */
async function fetchUserCertificates(userId: string) {
  try {
    return await prisma.studentCertificate.findMany({
      where: { studentId: userId },
      include: {
        certificate: {
          include: {
            activities: {
              include: {
                activity: true,
              },
            },
          },
        },
      },
      orderBy: { enrollmentDate: 'desc' },
      take: 3,
    })
  } catch (error) {
    console.error('Failed to fetch certificates:', error)
    return []
  }
}

// ============================================================================
// Data Processing Functions
// ============================================================================

/**
 * Process streak data from service or fallback to local calculation.
 */
function processStreakData(
  streakResult: Awaited<ReturnType<typeof getUserStreak>> | null,
  dayStreakData: { createdAt: Date }[]
): {
  streak: number
  badgesEarned: number
  badgeNames: string[]
  totalBadgePoints: number
} {
  if (streakResult) {
    const badgeNames = streakResult.badges.map((b) => {
      const def = BADGE_DEFINITIONS[b.badgeId as keyof typeof BADGE_DEFINITIONS]
      return def ? `${def.icon} ${def.name}` : b.badgeName || b.badgeId
    })

    return {
      streak: streakResult.currentStreak,
      badgesEarned: streakResult.badges.length,
      badgeNames,
      totalBadgePoints: streakResult.badges.length * 10,
    }
  }

  // Fallback to local streak calculation
  const streak = calculateLocalStreak(dayStreakData)

  return {
    streak,
    badgesEarned: 0,
    badgeNames: [],
    totalBadgePoints: 0,
  }
}

/**
 * Calculate streak locally from question creation dates.
 * Used as fallback when streak service is unavailable.
 */
function calculateLocalStreak(dayStreakData: { createdAt: Date }[]): number {
  if (dayStreakData.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const uniqueDays = new Set<string>()
  dayStreakData.forEach((q) => {
    const date = new Date(q.createdAt)
    date.setHours(0, 0, 0, 0)
    uniqueDays.add(date.toISOString())
  })

  const sortedDays = Array.from(uniqueDays).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  let streak = 0
  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    expectedDate.setHours(0, 0, 0, 0)

    if (sortedDays[i] === expectedDate.toISOString()) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/**
 * Process recent activities into display format.
 */
function processRecentActivities(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentActivities: any[]
): ProcessedActivity[] {
  return recentActivities
    .filter((q) => q.activity)
    .map((q) => ({
      id: q.id,
      title: `Created question in ${q.activity!.name}`,
      subtitle:
        q.content.substring(0, 50) + (q.content.length > 50 ? '...' : ''),
      timestamp: q.createdAt,
      icon: 'fa-question-circle',
      color: 'blue',
      badge_progress: q.questionEvaluationScore && q.questionEvaluationScore >= 8,
    }))
}

/**
 * Process certificates into display format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processCertificates(userCertificates: any[]): ProcessedCertificate[] {
  return userCertificates
    .filter((uc) => uc.certificate)
    .map((uc) => {
      const activities = uc.certificate?.activities || []
      const totalActivities = activities.length
      // For now, simplified progress calculation
      const completedActivities = 0 // Would need to check actual completion status
      const progressPercentage =
        totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0

      return {
        id: uc.id,
        name: uc.certificate?.name || 'Unknown Certificate',
        status: uc.completionDate
          ? ('completed' as const)
          : ('in_progress' as const),
        enrollment_date: uc.enrollmentDate,
        completion_date: uc.completionDate,
        progress_percentage: progressPercentage,
        /* eslint-disable @typescript-eslint/no-explicit-any */
        activities: activities
          .filter((ca: any) => ca.activity)
          .map((ca: any) => ({
            /* eslint-enable @typescript-eslint/no-explicit-any */
            activity_id: ca.activityId,
            activity_name: ca.activity?.name || 'Unknown Activity',
            required: ca.required,
            status: 'not_started' as CertificateActivityStatus,
          })),
      }
    })
}

// ============================================================================
// Default Stats
// ============================================================================

/**
 * Get default stats for error cases.
 *
 * @param error - Optional error to include in response
 * @returns UserStats with default/empty values
 */
export function getDefaultStats(error?: unknown): UserStats {
  return {
    total_questions: 0,
    questions_this_week: 0,
    week_change: 0,
    quality_score: 0,
    day_streak: 0,
    total_badge_points: 0,
    badges_earned: 0,
    badge_names: [],
    level_info: getTierInfo(0),
    total_groups: 0,
    activities: [],
    user_certificates: [],
    error: error instanceof Error ? error.message : error ? 'Failed to load statistics' : undefined,
  }
}
