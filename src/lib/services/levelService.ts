import { prisma } from '@/lib/db/prisma'

// Tier definitions - Flask 6-tier system
export const TIERS = {
  SMILE_STARTER: {
    id: 'SMILE_STARTER',
    name: 'SMILE Starter',
    nameKo: 'SMILE 스타터',
    icon: '✨',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    pointRange: [0, 4999] as [number, number],
    levelRange: [1, 10] as [number, number],
    description: 'Beginning your SMILE journey',
    descriptionKo: 'SMILE 여정을 시작하는 단계',
  },
  SMILE_LEARNER: {
    id: 'SMILE_LEARNER',
    name: 'SMILE Learner',
    nameKo: 'SMILE 학습자',
    icon: '📚',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    pointRange: [5000, 9999] as [number, number],
    levelRange: [11, 20] as [number, number],
    description: 'Growing through questions and inquiry',
    descriptionKo: '질문과 탐구를 통해 성장하는 단계',
  },
  SMILE_APPRENTICE: {
    id: 'SMILE_APPRENTICE',
    name: 'SMILE Apprentice',
    nameKo: 'SMILE 견습생',
    icon: '🌱',
    color: '#10B981',
    bgColor: '#ECFDF5',
    pointRange: [10000, 24999] as [number, number],
    levelRange: [21, 35] as [number, number],
    description: 'Developing strong inquiry skills',
    descriptionKo: '탄탄한 탐구 능력을 개발하는 단계',
  },
  SMILE_MAKER: {
    id: 'SMILE_MAKER',
    name: 'SMILE Maker',
    nameKo: 'SMILE 메이커',
    icon: '🔨',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    pointRange: [25000, 49999] as [number, number],
    levelRange: [36, 55] as [number, number],
    description: 'Creating meaningful learning experiences',
    descriptionKo: '의미 있는 학습 경험을 창출하는 단계',
  },
  SMILE_TRAINER: {
    id: 'SMILE_TRAINER',
    name: 'SMILE Trainer',
    nameKo: 'SMILE 트레이너',
    icon: '👨‍🏫',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    pointRange: [50000, 99999] as [number, number],
    levelRange: [56, 80] as [number, number],
    description: 'Guiding others in their learning journey',
    descriptionKo: '다른 사람의 학습 여정을 이끄는 단계',
  },
  SMILE_MASTER: {
    id: 'SMILE_MASTER',
    name: 'SMILE Master',
    nameKo: 'SMILE 마스터',
    icon: '🏆',
    color: '#FFD700',
    bgColor: '#FFFEF0',
    pointRange: [100000, Infinity] as [number, number],
    levelRange: [81, 100] as [number, number],
    description: 'Master of inquiry-based learning',
    descriptionKo: '탐구 기반 학습의 마스터',
  },
} as const

export type TierId = keyof typeof TIERS

// Level calculation constants
const POINTS_PER_LEVEL_BASE = 20
const LEVEL_SCALING_FACTOR = 1.1

/**
 * Calculate level from total points
 */
export function calculateLevel(totalPoints: number): number {
  let level = 1
  let pointsNeeded = POINTS_PER_LEVEL_BASE

  while (totalPoints >= pointsNeeded && level < 100) {
    totalPoints -= pointsNeeded
    level++
    pointsNeeded = Math.floor(POINTS_PER_LEVEL_BASE * Math.pow(LEVEL_SCALING_FACTOR, level - 1))
  }

  return level
}

/**
 * Calculate points needed for next level
 */
export function getPointsForNextLevel(currentLevel: number): number {
  return Math.floor(POINTS_PER_LEVEL_BASE * Math.pow(LEVEL_SCALING_FACTOR, currentLevel))
}

/**
 * Calculate total points needed to reach a level
 */
export function getTotalPointsForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += Math.floor(POINTS_PER_LEVEL_BASE * Math.pow(LEVEL_SCALING_FACTOR, i - 1))
  }
  return total
}

/**
 * Get tier from total points
 */
export function getTierFromPoints(totalPoints: number): TierId {
  for (const [tierId, tier] of Object.entries(TIERS)) {
    if (totalPoints >= tier.pointRange[0] && totalPoints <= tier.pointRange[1]) {
      return tierId as TierId
    }
  }
  return 'SMILE_MASTER'
}

/**
 * Get tier from level
 */
export function getTierFromLevel(level: number): TierId {
  for (const [tierId, tier] of Object.entries(TIERS)) {
    if (level >= tier.levelRange[0] && level <= tier.levelRange[1]) {
      return tierId as TierId
    }
  }
  return 'SMILE_MASTER'
}

/**
 * Calculate tier progress (0.0 to 1.0)
 */
export function calculateTierProgress(totalPoints: number): number {
  const tier = TIERS[getTierFromPoints(totalPoints)]
  const [minPoints, maxPoints] = tier.pointRange

  if (maxPoints === Infinity) {
    // For the top tier, show progress within a virtual 5000-point range
    return Math.min(1, (totalPoints - minPoints) / 5000)
  }

  return (totalPoints - minPoints) / (maxPoints - minPoints)
}

/**
 * Get or create user level record
 */
export async function getUserLevel(userId: string) {
  let userLevel = await prisma.userLevel.findUnique({
    where: { userId },
  })

  if (!userLevel) {
    // Create default level record
    userLevel = await prisma.userLevel.create({
      data: {
        userId,
        totalPoints: 0,
        currentLevel: 1,
        currentTier: 'SMILE_STARTER',
        tierProgress: 0,
      },
    })
  }

  const tier = TIERS[userLevel.currentTier as TierId] || TIERS.SMILE_STARTER
  const pointsForNextLevel = getPointsForNextLevel(userLevel.currentLevel)
  const pointsInCurrentLevel = userLevel.totalPoints - getTotalPointsForLevel(userLevel.currentLevel)

  return {
    ...userLevel,
    tier: {
      ...tier,
      id: userLevel.currentTier,
    },
    levelProgress: pointsInCurrentLevel / pointsForNextLevel,
    pointsForNextLevel,
    pointsInCurrentLevel,
  }
}

/**
 * Get detailed level information for a user
 */
export async function getUserLevelInfo(userId: string) {
  const userLevel = await getUserLevel(userId)

  // Get recent activity
  const recentActivity = await prisma.question.count({
    where: {
      creatorId: userId,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  })

  // Get user's rank (position among all users by points)
  const higherRankCount = await prisma.userLevel.count({
    where: {
      totalPoints: { gt: userLevel.totalPoints },
    },
  })

  return {
    ...userLevel,
    rank: higherRankCount + 1,
    recentActivity: {
      questionsThisWeek: recentActivity,
    },
    nextTier: getNextTier(userLevel.currentTier as TierId),
    pointsToNextTier: getPointsToNextTier(userLevel.totalPoints),
  }
}

/**
 * Get tier progress information
 */
export async function getTierProgress(userId: string) {
  const userLevel = await getUserLevel(userId)
  const currentTier = TIERS[userLevel.currentTier as TierId]
  const nextTier = getNextTier(userLevel.currentTier as TierId)

  return {
    currentTier: {
      ...currentTier,
      id: userLevel.currentTier,
    },
    nextTier: nextTier ? {
      ...nextTier,
      id: Object.entries(TIERS).find(([, t]) => t === nextTier)?.[0],
    } : null,
    progress: userLevel.tierProgress,
    currentPoints: userLevel.totalPoints,
    pointsToNextTier: getPointsToNextTier(userLevel.totalPoints),
    currentLevel: userLevel.currentLevel,
    levelProgress: userLevel.levelProgress,
  }
}

/**
 * Get the next tier
 */
function getNextTier(currentTierId: TierId) {
  const tierOrder: TierId[] = [
    'SMILE_STARTER',
    'SMILE_LEARNER',
    'SMILE_APPRENTICE',
    'SMILE_MAKER',
    'SMILE_TRAINER',
    'SMILE_MASTER',
  ]

  const currentIndex = tierOrder.indexOf(currentTierId)
  if (currentIndex < tierOrder.length - 1) {
    return TIERS[tierOrder[currentIndex + 1]]
  }
  return null
}

/**
 * Calculate points needed to reach next tier
 */
function getPointsToNextTier(totalPoints: number): number {
  const currentTier = TIERS[getTierFromPoints(totalPoints)]
  if (currentTier.pointRange[1] === Infinity) {
    return 0 // Already at max tier
  }
  return currentTier.pointRange[1] + 1 - totalPoints
}

/**
 * Get all tiers information
 */
export function getAllTiers() {
  return Object.values(TIERS)
}

/**
 * Get leaderboard by tier
 */
export async function getTierLeaderboard(tierId?: TierId, limit: number = 20) {
  const where = tierId ? { currentTier: tierId } : {}

  const users = await prisma.userLevel.findMany({
    where,
    orderBy: { totalPoints: 'desc' },
    take: limit,
    select: {
      userId: true,
      totalPoints: true,
      currentLevel: true,
      currentTier: true,
    },
  })

  // Get user details
  const userIds = users.map(u => u.userId)
  const userDetails = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  })

  const userMap = new Map(userDetails.map(u => [u.id, u]))

  return users.map((user, index) => {
    const details = userMap.get(user.userId)
    const tier = TIERS[user.currentTier as TierId]
    return {
      rank: index + 1,
      userId: user.userId,
      name: `${details?.firstName || ''} ${details?.lastName || ''}`.trim() || 'Anonymous',
      avatarUrl: details?.avatarUrl,
      totalPoints: user.totalPoints,
      level: user.currentLevel,
      tier: {
        id: user.currentTier,
        name: tier?.name || 'Unknown',
        icon: tier?.icon || '❓',
        color: tier?.color || '#6B7280',
      },
    }
  })
}

/**
 * Update user level based on new points
 */
export async function updateUserLevel(userId: string, newTotalPoints: number) {
  const newLevel = calculateLevel(newTotalPoints)
  const newTier = getTierFromPoints(newTotalPoints)
  const newProgress = calculateTierProgress(newTotalPoints)

  const updated = await prisma.userLevel.upsert({
    where: { userId },
    update: {
      totalPoints: newTotalPoints,
      currentLevel: newLevel,
      currentTier: newTier,
      tierProgress: newProgress,
      lastPointsAt: new Date(),
    },
    create: {
      userId,
      totalPoints: newTotalPoints,
      currentLevel: newLevel,
      currentTier: newTier,
      tierProgress: newProgress,
      lastPointsAt: new Date(),
    },
  })

  return updated
}

/**
 * Get achievements summary for a user
 */
export async function getAchievementsSummary(userId: string) {
  const [userLevel, badges, streak] = await Promise.all([
    getUserLevel(userId),
    prisma.badgeEarned.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.userStreak.findUnique({
      where: { userId },
    }),
  ])

  const tier = TIERS[userLevel.currentTier as TierId]

  return {
    level: {
      current: userLevel.currentLevel,
      progress: userLevel.levelProgress,
      pointsToNext: userLevel.pointsForNextLevel - userLevel.pointsInCurrentLevel,
    },
    tier: {
      id: userLevel.currentTier,
      name: tier?.name || 'Unknown',
      icon: tier?.icon || '❓',
      color: tier?.color || '#6B7280',
      progress: userLevel.tierProgress,
    },
    points: {
      total: userLevel.totalPoints,
      questions: userLevel.questionPoints,
      responses: userLevel.responsePoints,
      evaluations: userLevel.evaluationPoints,
      streak: userLevel.streakPoints,
      bonus: userLevel.bonusPoints,
    },
    badges: {
      total: badges.length,
      recent: badges.slice(0, 5).map(b => ({
        id: b.badgeId,
        name: b.badgeName,
        icon: b.badgeIcon,
        earnedAt: b.earnedAt,
      })),
    },
    streak: {
      current: streak?.currentStreak || 0,
      longest: streak?.longestStreak || 0,
    },
    activity: {
      questions: userLevel.questionsCreated,
      responses: userLevel.responsesGiven,
      evaluations: userLevel.evaluationsReceived,
      perfectScores: userLevel.perfectScores,
    },
  }
}
