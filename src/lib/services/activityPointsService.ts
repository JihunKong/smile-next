import { prisma } from '@/lib/db/prisma'
import { updateUserLevel, calculateLevel, getTierFromPoints, calculateTierProgress } from './levelService'
import { createNotification, notifyBadgeEarned } from './notificationService'

// Point values for different activities
export const POINT_VALUES = {
  // Questions
  CREATE_QUESTION: 5,
  QUESTION_LIKED: 2,
  QUESTION_HIGH_SCORE: 10, // Score >= 8
  QUESTION_PERFECT_SCORE: 25, // Score = 10

  // Responses
  CREATE_RESPONSE: 3,
  RESPONSE_LIKED: 1,
  RESPONSE_CORRECT: 5,
  RESPONSE_HIGH_SCORE: 8,

  // Evaluations received
  EVALUATION_RECEIVED: 2,

  // Streak bonuses
  STREAK_3_DAYS: 10,
  STREAK_7_DAYS: 25,
  STREAK_14_DAYS: 50,
  STREAK_30_DAYS: 100,

  // Special achievements
  FIRST_QUESTION: 10,
  FIRST_RESPONSE: 5,
  COMPLETE_EXAM: 15,
  PASS_EXAM: 25,
  COMPLETE_INQUIRY: 20,

  // Bloom's level bonuses
  BLOOMS_ANALYZE: 3,
  BLOOMS_EVALUATE: 5,
  BLOOMS_CREATE: 8,
} as const

export type PointType = keyof typeof POINT_VALUES

interface AwardPointsResult {
  success: boolean
  pointsAwarded: number
  newTotal: number
  leveledUp: boolean
  newLevel?: number
  tierChanged: boolean
  newTier?: string
  badgeEarned?: string
}

/**
 * Award points to a user
 */
export async function awardPoints(
  userId: string,
  pointType: PointType,
  metadata?: {
    entityType?: string
    entityId?: string
    multiplier?: number
    reason?: string
  }
): Promise<AwardPointsResult> {
  try {
    const basePoints = POINT_VALUES[pointType]
    const multiplier = metadata?.multiplier || 1
    const pointsToAward = Math.floor(basePoints * multiplier)

    // Get current user level
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId },
    })

    const previousLevel = userLevel?.currentLevel || 1
    const previousTier = userLevel?.currentTier || 'CURIOUS_STARTER'
    const previousPoints = userLevel?.totalPoints || 0
    const newTotalPoints = previousPoints + pointsToAward

    // Calculate new level and tier
    const newLevel = calculateLevel(newTotalPoints)
    const newTier = getTierFromPoints(newTotalPoints)
    const newProgress = calculateTierProgress(newTotalPoints)

    // Determine which category to update
    const categoryUpdate: Record<string, { increment: number }> = {}

    if (pointType.includes('QUESTION') || pointType === 'FIRST_QUESTION') {
      categoryUpdate.questionPoints = { increment: pointsToAward }
      categoryUpdate.questionsCreated = { increment: pointType === 'CREATE_QUESTION' ? 1 : 0 }
    } else if (pointType.includes('RESPONSE') || pointType === 'FIRST_RESPONSE') {
      categoryUpdate.responsePoints = { increment: pointsToAward }
      categoryUpdate.responsesGiven = { increment: pointType === 'CREATE_RESPONSE' ? 1 : 0 }
    } else if (pointType.includes('EVALUATION')) {
      categoryUpdate.evaluationPoints = { increment: pointsToAward }
      categoryUpdate.evaluationsReceived = { increment: 1 }
    } else if (pointType.includes('STREAK')) {
      categoryUpdate.streakPoints = { increment: pointsToAward }
    } else {
      categoryUpdate.bonusPoints = { increment: pointsToAward }
    }

    if (pointType.includes('PERFECT_SCORE')) {
      categoryUpdate.perfectScores = { increment: 1 }
    }

    // Update user level
    userLevel = await prisma.userLevel.upsert({
      where: { userId },
      update: {
        totalPoints: newTotalPoints,
        currentLevel: newLevel,
        currentTier: newTier,
        tierProgress: newProgress,
        lastPointsAt: new Date(),
        ...categoryUpdate,
      },
      create: {
        userId,
        totalPoints: newTotalPoints,
        currentLevel: newLevel,
        currentTier: newTier,
        tierProgress: newProgress,
        lastPointsAt: new Date(),
        ...Object.fromEntries(
          Object.entries(categoryUpdate).map(([key, value]) => [key, (value as { increment: number }).increment])
        ),
      },
    })

    const leveledUp = newLevel > previousLevel
    const tierChanged = newTier !== previousTier

    // Create notifications for level up and tier change
    if (leveledUp) {
      await createNotification({
        userId,
        type: 'badge_earned',
        title: `Level Up! You're now Level ${newLevel}`,
        message: `Congratulations! You've reached Level ${newLevel}. Keep up the great work!`,
        data: { newLevel, pointsAwarded: pointsToAward },
      })
    }

    if (tierChanged) {
      await createNotification({
        userId,
        type: 'badge_earned',
        title: `New Tier Unlocked!`,
        message: `You've advanced to ${newTier.replace(/_/g, ' ')}! Your dedication is paying off.`,
        data: { newTier, previousTier },
      })
    }

    // Check for badge opportunities
    let badgeEarned: string | undefined
    badgeEarned = await checkAndAwardBadges(userId, pointType, userLevel)

    return {
      success: true,
      pointsAwarded: pointsToAward,
      newTotal: newTotalPoints,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      tierChanged,
      newTier: tierChanged ? newTier : undefined,
      badgeEarned,
    }
  } catch (error) {
    console.error('[ActivityPointsService] Failed to award points:', error)
    return {
      success: false,
      pointsAwarded: 0,
      newTotal: 0,
      leveledUp: false,
      tierChanged: false,
    }
  }
}

/**
 * Check and award badges based on activity
 */
async function checkAndAwardBadges(
  userId: string,
  pointType: PointType,
  userLevel: { questionsCreated: number; responsesGiven: number; perfectScores: number; totalPoints: number }
): Promise<string | undefined> {
  const badgesToCheck = []

  // Question milestones
  if (userLevel.questionsCreated === 1) {
    badgesToCheck.push({ id: 'first_question', name: 'First Question', icon: '❓' })
  } else if (userLevel.questionsCreated === 10) {
    badgesToCheck.push({ id: 'question_asker_10', name: 'Curious Mind', icon: '🤔' })
  } else if (userLevel.questionsCreated === 50) {
    badgesToCheck.push({ id: 'question_asker_50', name: 'Question Master', icon: '🎯' })
  } else if (userLevel.questionsCreated === 100) {
    badgesToCheck.push({ id: 'question_asker_100', name: 'Inquiry Expert', icon: '🏆' })
  }

  // Response milestones
  if (userLevel.responsesGiven === 1) {
    badgesToCheck.push({ id: 'first_response', name: 'First Response', icon: '💬' })
  } else if (userLevel.responsesGiven === 25) {
    badgesToCheck.push({ id: 'responder_25', name: 'Helpful Hand', icon: '🤝' })
  } else if (userLevel.responsesGiven === 100) {
    badgesToCheck.push({ id: 'responder_100', name: 'Community Helper', icon: '⭐' })
  }

  // Perfect score badges
  if (userLevel.perfectScores === 1) {
    badgesToCheck.push({ id: 'first_perfect', name: 'First Perfect Score', icon: '💯' })
  } else if (userLevel.perfectScores === 10) {
    badgesToCheck.push({ id: 'perfectionist', name: 'Perfectionist', icon: '🌟' })
  }

  // Point milestones
  if (userLevel.totalPoints >= 100 && userLevel.totalPoints < 110) {
    badgesToCheck.push({ id: 'points_100', name: 'Century Club', icon: '💎' })
  } else if (userLevel.totalPoints >= 500 && userLevel.totalPoints < 510) {
    badgesToCheck.push({ id: 'points_500', name: 'High Achiever', icon: '🚀' })
  } else if (userLevel.totalPoints >= 1000 && userLevel.totalPoints < 1010) {
    badgesToCheck.push({ id: 'points_1000', name: 'SMILE Enthusiast', icon: '🎖️' })
  }

  // Bloom's level badge
  if (pointType === 'BLOOMS_CREATE') {
    badgesToCheck.push({ id: 'creative_thinker', name: 'Creative Thinker', icon: '🎨' })
  }

  // Award badges that haven't been earned yet
  for (const badge of badgesToCheck) {
    const existing = await prisma.badgeEarned.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    })

    if (!existing) {
      await prisma.badgeEarned.create({
        data: {
          userId,
          badgeId: badge.id,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          badgeType: 'achievement',
          context: { triggerType: pointType },
        },
      })

      await notifyBadgeEarned(userId, badge.name, badge.id)
      return badge.name
    }
  }

  return undefined
}

/**
 * Award streak bonus points
 */
export async function awardStreakBonus(userId: string, streakDays: number): Promise<AwardPointsResult | null> {
  let pointType: PointType | null = null

  if (streakDays === 3) {
    pointType = 'STREAK_3_DAYS'
  } else if (streakDays === 7) {
    pointType = 'STREAK_7_DAYS'
  } else if (streakDays === 14) {
    pointType = 'STREAK_14_DAYS'
  } else if (streakDays === 30) {
    pointType = 'STREAK_30_DAYS'
  }

  if (pointType) {
    return awardPoints(userId, pointType, { reason: `${streakDays}-day streak bonus` })
  }

  return null
}

/**
 * Award Bloom's level bonus
 */
export async function awardBloomsBonus(
  userId: string,
  bloomsLevel: string,
  entityId: string
): Promise<AwardPointsResult | null> {
  let pointType: PointType | null = null

  switch (bloomsLevel.toLowerCase()) {
    case 'analyze':
      pointType = 'BLOOMS_ANALYZE'
      break
    case 'evaluate':
      pointType = 'BLOOMS_EVALUATE'
      break
    case 'create':
      pointType = 'BLOOMS_CREATE'
      break
  }

  if (pointType) {
    return awardPoints(userId, pointType, {
      entityType: 'question',
      entityId,
      reason: `Bloom's ${bloomsLevel} level bonus`,
    })
  }

  return null
}

/**
 * Award exam completion points
 */
export async function awardExamPoints(
  userId: string,
  passed: boolean,
  score: number,
  attemptId: string
): Promise<AwardPointsResult> {
  // Base completion points
  const result = await awardPoints(userId, 'COMPLETE_EXAM', {
    entityType: 'exam_attempt',
    entityId: attemptId,
  })

  // Additional points if passed
  if (passed) {
    await awardPoints(userId, 'PASS_EXAM', {
      entityType: 'exam_attempt',
      entityId: attemptId,
    })

    // Bonus for high scores
    if (score >= 90) {
      await awardPoints(userId, 'QUESTION_PERFECT_SCORE', {
        entityType: 'exam_attempt',
        entityId: attemptId,
        reason: 'Exam score 90%+',
      })
    }
  }

  return result
}

/**
 * Award inquiry completion points
 */
export async function awardInquiryPoints(
  userId: string,
  averageScore: number,
  attemptId: string
): Promise<AwardPointsResult> {
  const result = await awardPoints(userId, 'COMPLETE_INQUIRY', {
    entityType: 'inquiry_attempt',
    entityId: attemptId,
  })

  // Bonus for high average score
  if (averageScore >= 8) {
    await awardPoints(userId, 'QUESTION_HIGH_SCORE', {
      entityType: 'inquiry_attempt',
      entityId: attemptId,
      reason: `High inquiry score (${averageScore.toFixed(1)})`,
    })
  }

  return result
}

/**
 * Get user's point history (recent point awards)
 */
export async function getPointHistory(userId: string, limit: number = 20) {
  // Since we don't have a separate point history table,
  // we'll aggregate from various sources
  const [questions, responses, badges] = await Promise.all([
    prisma.question.findMany({
      where: { creatorId: userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        questionEvaluationScore: true,
      },
    }),
    prisma.response.findMany({
      where: { creatorId: userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        aiEvaluationScore: true,
      },
    }),
    prisma.badgeEarned.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: limit,
      select: {
        badgeId: true,
        badgeName: true,
        earnedAt: true,
      },
    }),
  ])

  // Combine and sort by date
  const history = [
    ...questions.map(q => ({
      type: 'question',
      id: q.id,
      date: q.createdAt,
      points: POINT_VALUES.CREATE_QUESTION + (q.questionEvaluationScore && q.questionEvaluationScore >= 8 ? POINT_VALUES.QUESTION_HIGH_SCORE : 0),
      description: 'Created a question',
    })),
    ...responses.map(r => ({
      type: 'response',
      id: r.id,
      date: r.createdAt,
      points: POINT_VALUES.CREATE_RESPONSE,
      description: 'Gave a response',
    })),
    ...badges.map(b => ({
      type: 'badge',
      id: b.badgeId,
      date: b.earnedAt,
      points: 0, // Badges don't give points, but are shown
      description: `Earned badge: ${b.badgeName}`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit)

  return history
}
