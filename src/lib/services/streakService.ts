import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

// Badge definitions
export const BADGE_DEFINITIONS = {
  // Streak badges
  week_warrior: {
    id: 'week_warrior',
    name: '주간 전사',
    nameEn: 'Week Warrior',
    icon: '🔥',
    description: '7일 연속 활동',
    type: 'streak',
    condition: (streak: number) => streak >= 7,
  },
  month_master: {
    id: 'month_master',
    name: '월간 마스터',
    nameEn: 'Month Master',
    icon: '🏆',
    description: '30일 연속 활동',
    type: 'streak',
    condition: (streak: number) => streak >= 30,
  },
  streak_starter: {
    id: 'streak_starter',
    name: '연속 시작',
    nameEn: 'Streak Starter',
    icon: '⚡',
    description: '3일 연속 활동',
    type: 'streak',
    condition: (streak: number) => streak >= 3,
  },

  // Milestone badges
  first_question: {
    id: 'first_question',
    name: '첫 질문',
    nameEn: 'First Question',
    icon: '❓',
    description: '첫 질문 생성',
    type: 'milestone',
    condition: () => true,
  },
  question_master: {
    id: 'question_master',
    name: '질문 마스터',
    nameEn: 'Question Master',
    icon: '🎯',
    description: '50개 이상 질문 생성',
    type: 'milestone',
    condition: (count: number) => count >= 50,
  },
  first_response: {
    id: 'first_response',
    name: '첫 응답',
    nameEn: 'First Response',
    icon: '💬',
    description: '첫 응답 제출',
    type: 'milestone',
    condition: () => true,
  },
  response_pro: {
    id: 'response_pro',
    name: '응답 프로',
    nameEn: 'Response Pro',
    icon: '📝',
    description: '100개 이상 응답',
    type: 'milestone',
    condition: (count: number) => count >= 100,
  },

  // Exam badges
  exam_ace: {
    id: 'exam_ace',
    name: '시험 에이스',
    nameEn: 'Exam Ace',
    icon: '🌟',
    description: '시험에서 100점 획득',
    type: 'achievement',
    condition: (score: number) => score === 100,
  },
  exam_complete: {
    id: 'exam_complete',
    name: '첫 시험 완료',
    nameEn: 'First Exam Complete',
    icon: '📋',
    description: '첫 시험 완료',
    type: 'milestone',
    condition: () => true,
  },

  // Inquiry badges
  inquiry_explorer: {
    id: 'inquiry_explorer',
    name: '탐구 탐험가',
    nameEn: 'Inquiry Explorer',
    icon: '🔍',
    description: '첫 탐구 학습 완료',
    type: 'milestone',
    condition: () => true,
  },

  // Case badges
  case_solver: {
    id: 'case_solver',
    name: '케이스 해결사',
    nameEn: 'Case Solver',
    icon: '💡',
    description: '첫 케이스 학습 완료',
    type: 'milestone',
    condition: () => true,
  },

  // Community badges
  top_contributor: {
    id: 'top_contributor',
    name: '최고 기여자',
    nameEn: 'Top Contributor',
    icon: '👑',
    description: '그룹 내 최고 기여자',
    type: 'achievement',
    condition: () => true,
  },
  helpful_responder: {
    id: 'helpful_responder',
    name: '도움되는 응답자',
    nameEn: 'Helpful Responder',
    icon: '🤝',
    description: '10개 이상의 좋아요 받음',
    type: 'achievement',
    condition: (likes: number) => likes >= 10,
  },
}

export type BadgeId = keyof typeof BADGE_DEFINITIONS

/**
 * Get or create user streak record
 */
export async function getOrCreateStreak(userId: string) {
  let streak = await prisma.userStreak.findUnique({
    where: { userId },
  })

  if (!streak) {
    streak = await prisma.userStreak.create({
      data: { userId },
    })
  }

  return streak
}

/**
 * Record user activity and update streak
 * Call this when user performs any meaningful activity
 */
export async function recordActivity(userId: string): Promise<{
  streak: number
  isNewDay: boolean
  earnedBadges: string[]
}> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const streak = await getOrCreateStreak(userId)
  const lastActivity = streak.lastActivityDate
    ? new Date(streak.lastActivityDate.getFullYear(), streak.lastActivityDate.getMonth(), streak.lastActivityDate.getDate())
    : null

  let newCurrentStreak = streak.currentStreak
  let isNewDay = false
  const earnedBadges: string[] = []

  if (!lastActivity) {
    // First activity ever
    newCurrentStreak = 1
    isNewDay = true
  } else if (today.getTime() === lastActivity.getTime()) {
    // Same day - no streak change
    isNewDay = false
  } else if (today.getTime() - lastActivity.getTime() === 86400000) {
    // Consecutive day
    newCurrentStreak = streak.currentStreak + 1
    isNewDay = true
  } else {
    // Streak broken - start over
    newCurrentStreak = 1
    isNewDay = true
  }

  // Check week/month reset
  const oneWeekAgo = new Date(today)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const oneMonthAgo = new Date(today)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  let weeklyDays = streak.weeklyActivityDays
  let monthlyDays = streak.monthlyActivityDays
  let lastWeekReset = streak.lastWeekReset
  let lastMonthReset = streak.lastMonthReset

  // Reset weekly if it's been more than a week since last reset
  if (!lastWeekReset || new Date(lastWeekReset) < oneWeekAgo) {
    weeklyDays = 0
    lastWeekReset = today
  }

  // Reset monthly if it's been more than a month
  if (!lastMonthReset || new Date(lastMonthReset) < oneMonthAgo) {
    monthlyDays = 0
    lastMonthReset = today
  }

  if (isNewDay) {
    weeklyDays++
    monthlyDays++
  }

  // Update streak record
  const longestStreak = Math.max(streak.longestStreak, newCurrentStreak)

  await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak,
      lastActivityDate: now,
      weeklyActivityDays: weeklyDays,
      monthlyActivityDays: monthlyDays,
      lastWeekReset,
      lastMonthReset,
    },
  })

  // Check for streak badges
  if (isNewDay) {
    const streakBadges = ['streak_starter', 'week_warrior', 'month_master'] as const

    for (const badgeId of streakBadges) {
      const badge = BADGE_DEFINITIONS[badgeId]
      if (badge.condition(newCurrentStreak)) {
        const earned = await awardBadge(userId, badgeId, {
          streakValue: newCurrentStreak,
          earnedOn: now.toISOString(),
        })
        if (earned) {
          earnedBadges.push(badgeId)
        }
      }
    }
  }

  return {
    streak: newCurrentStreak,
    isNewDay,
    earnedBadges,
  }
}

/**
 * Award a badge to user (if not already earned)
 */
export async function awardBadge(
  userId: string,
  badgeId: BadgeId,
  context?: Record<string, unknown>
): Promise<boolean> {
  const badge = BADGE_DEFINITIONS[badgeId]
  if (!badge) return false

  // Check if already earned
  const existing = await prisma.badgeEarned.findUnique({
    where: {
      userId_badgeId: { userId, badgeId },
    },
  })

  if (existing) return false

  // Award the badge
  await prisma.badgeEarned.create({
    data: {
      userId,
      badgeId,
      badgeType: badge.type,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      context: (context || {}) as Prisma.InputJsonValue,
    },
  })

  // Create serializable badge data (without condition function)
  const badgeData = {
    id: badge.id,
    name: badge.name,
    nameEn: badge.nameEn,
    icon: badge.icon,
    description: badge.description,
    type: badge.type,
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'badge_earned',
      title: '새로운 배지 획득!',
      message: `${badge.icon} ${badge.name} 배지를 획득했습니다!`,
      entityType: 'badge',
      entityId: badgeId,
      data: { badge: badgeData } as Prisma.InputJsonValue,
    },
  })

  return true
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string) {
  const earnedBadges = await prisma.badgeEarned.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
  })

  return earnedBadges.map((badge) => ({
    ...badge,
    definition: BADGE_DEFINITIONS[badge.badgeId as BadgeId],
  }))
}

/**
 * Get user's streak info
 */
export async function getUserStreak(userId: string) {
  const streak = await getOrCreateStreak(userId)
  const badges = await getUserBadges(userId)

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActivityDate: streak.lastActivityDate,
    weeklyActivityDays: streak.weeklyActivityDays,
    monthlyActivityDays: streak.monthlyActivityDays,
    badges,
  }
}

/**
 * Check milestone badges based on user's stats
 */
export async function checkMilestoneBadges(userId: string) {
  const earnedBadges: string[] = []

  // Count questions
  const questionCount = await prisma.question.count({
    where: { creatorId: userId, isDeleted: false },
  })

  if (questionCount >= 1) {
    const earned = await awardBadge(userId, 'first_question', { totalQuestions: questionCount })
    if (earned) earnedBadges.push('first_question')
  }

  if (questionCount >= 50) {
    const earned = await awardBadge(userId, 'question_master', { totalQuestions: questionCount })
    if (earned) earnedBadges.push('question_master')
  }

  // Count responses
  const responseCount = await prisma.response.count({
    where: { creatorId: userId, isDeleted: false },
  })

  if (responseCount >= 1) {
    const earned = await awardBadge(userId, 'first_response', { totalResponses: responseCount })
    if (earned) earnedBadges.push('first_response')
  }

  if (responseCount >= 100) {
    const earned = await awardBadge(userId, 'response_pro', { totalResponses: responseCount })
    if (earned) earnedBadges.push('response_pro')
  }

  // Count total likes received
  const likeCount = await prisma.responseLike.count({
    where: {
      response: { creatorId: userId },
    },
  })

  if (likeCount >= 10) {
    const earned = await awardBadge(userId, 'helpful_responder', { totalLikes: likeCount })
    if (earned) earnedBadges.push('helpful_responder')
  }

  // Count exam completions
  const examCount = await prisma.examAttempt.count({
    where: { userId, status: 'completed' },
  })

  if (examCount >= 1) {
    const earned = await awardBadge(userId, 'exam_complete', { totalExams: examCount })
    if (earned) earnedBadges.push('exam_complete')
  }

  // Check for perfect exam score
  const perfectExam = await prisma.examAttempt.findFirst({
    where: { userId, status: 'completed', score: 100 },
  })

  if (perfectExam) {
    const earned = await awardBadge(userId, 'exam_ace', { examId: perfectExam.id })
    if (earned) earnedBadges.push('exam_ace')
  }

  // Count inquiry completions
  const inquiryCount = await prisma.inquiryAttempt.count({
    where: { userId, status: 'completed' },
  })

  if (inquiryCount >= 1) {
    const earned = await awardBadge(userId, 'inquiry_explorer', { totalInquiries: inquiryCount })
    if (earned) earnedBadges.push('inquiry_explorer')
  }

  // Count case completions
  const caseCount = await prisma.caseAttempt.count({
    where: { userId, status: 'completed' },
  })

  if (caseCount >= 1) {
    const earned = await awardBadge(userId, 'case_solver', { totalCases: caseCount })
    if (earned) earnedBadges.push('case_solver')
  }

  return earnedBadges
}
