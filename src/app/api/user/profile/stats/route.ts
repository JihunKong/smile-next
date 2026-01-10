import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// Level tier definitions matching Flask implementation
const LEVEL_TIERS = [
  { name: 'SMILE Starter', icon: '✨', minPoints: 0, maxPoints: 4999, color: '#8B5CF6', description: 'Starting your SMILE journey' },
  { name: 'SMILE Learner', icon: '📚', minPoints: 5000, maxPoints: 9999, color: '#3B82F6', description: 'Building knowledge foundations' },
  { name: 'SMILE Apprentice', icon: '🌱', minPoints: 10000, maxPoints: 24999, color: '#10B981', description: 'Growing inquiry skills' },
  { name: 'SMILE Maker', icon: '🛠️', minPoints: 25000, maxPoints: 49999, color: '#F59E0B', description: 'Creating meaningful questions' },
  { name: 'SMILE Trainer', icon: '👨‍🏫', minPoints: 50000, maxPoints: 99999, color: '#EF4444', description: 'Teaching and mentoring others' },
  { name: 'SMILE Master', icon: '🏆', minPoints: 100000, maxPoints: null, color: '#FFD700', description: 'Mastery of inquiry learning' },
]

function getLevelInfo(points: number) {
  let currentTier = LEVEL_TIERS[0]
  let nextTier = LEVEL_TIERS[1]

  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    const tier = LEVEL_TIERS[i]
    if (points >= tier.minPoints && (tier.maxPoints === null || points <= tier.maxPoints)) {
      currentTier = tier
      nextTier = LEVEL_TIERS[i + 1] || null
      break
    }
  }

  const pointsToNext = nextTier ? nextTier.minPoints - points : 0
  const progressInTier = nextTier
    ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100

  return {
    current: {
      tier: currentTier,
      points: points,
    },
    next: nextTier,
    pointsToNext,
    progressPercent: Math.min(progressInTier, 100),
    allTiers: LEVEL_TIERS,
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get comprehensive user statistics
    const [
      totalQuestions,
      totalResponses,
      totalActivities,
      totalGroups,
      highQualityQuestions,
      examAttempts,
      passedExams,
      perfectExams,
      inquiryAttempts,
      caseAttempts,
      certificatesCompleted,
      user,
      weeklyQuestions,
      monthlyQuestions,
    ] = await Promise.all([
      // Total questions created by user
      prisma.question.count({
        where: {
          creatorId: userId,
          isDeleted: false,
        },
      }),
      // Total responses
      prisma.response.count({
        where: {
          creatorId: userId,
          isDeleted: false,
        },
      }),
      // Total unique activities participated in
      prisma.activity.count({
        where: {
          OR: [
            { creatorId: userId },
            { questions: { some: { creatorId: userId } } },
            { examAttempts: { some: { userId } } },
            { inquiryAttempts: { some: { userId } } },
            { caseAttempts: { some: { userId } } },
          ],
          isDeleted: false,
        },
      }),
      // Total groups
      prisma.groupUser.count({
        where: {
          userId,
          group: { isDeleted: false },
        },
      }),
      // High quality questions (8+ score)
      prisma.question.count({
        where: {
          creatorId: userId,
          questionEvaluationScore: { gte: 8 },
          isDeleted: false,
        },
      }),
      // Exam attempts
      prisma.examAttempt.count({
        where: { userId },
      }),
      // Passed exams
      prisma.examAttempt.count({
        where: { userId, passed: true },
      }),
      // Perfect exams (100% score)
      prisma.examAttempt.count({
        where: { userId, score: { gte: 1.0 } },
      }),
      // Inquiry attempts
      prisma.inquiryAttempt.count({
        where: { userId },
      }),
      // Case attempts
      prisma.caseAttempt.count({
        where: { userId },
      }),
      // Certificates completed
      prisma.studentCertificate.count({
        where: { studentId: userId, status: 'completed' },
      }),
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      }),
      // Weekly questions (last 7 days)
      prisma.question.count({
        where: {
          creatorId: userId,
          isDeleted: false,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Monthly questions (last 30 days)
      prisma.question.count({
        where: {
          creatorId: userId,
          isDeleted: false,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    // Calculate average exam score
    const examScores = await prisma.examAttempt.aggregate({
      where: {
        userId,
        status: 'completed',
        score: { not: null },
      },
      _avg: { score: true },
    })

    // Calculate average question quality score
    const questionScores = await prisma.question.aggregate({
      where: {
        creatorId: userId,
        isDeleted: false,
        questionEvaluationScore: { not: null },
      },
      _avg: { questionEvaluationScore: true },
    })

    // Calculate points breakdown
    const questionPoints = totalQuestions * 5
    const highQualityPoints = highQualityQuestions * 30
    const responsePoints = totalResponses * 2
    const examPoints = passedExams * 10 + perfectExams * 50
    const certificatePoints = certificatesCompleted * 100

    // Badge points calculation (simplified)
    let badgePoints = 0
    if (totalQuestions >= 1) badgePoints += 10 // First Question badge
    if (totalQuestions >= 10) badgePoints += 25 // Curious Mind badge
    if (totalQuestions >= 25) badgePoints += 50 // Momentum Builder badge
    if (totalQuestions >= 100) badgePoints += 100 // Question Master badge
    if (highQualityQuestions >= 10) badgePoints += 100 // Quality Creator badge
    if (totalResponses >= 1) badgePoints += 10 // First Response badge
    if (totalResponses >= 50) badgePoints += 50 // Helpful Responder badge
    if (examAttempts >= 1) badgePoints += 20 // First Exam badge
    if (passedExams >= 10) badgePoints += 150 // Exam Passer badge
    if (perfectExams >= 1) badgePoints += 300 // Exam Ace badge
    if (totalGroups >= 5) badgePoints += 100 // Community Builder badge
    if (certificatesCompleted >= 1) badgePoints += 200 // Certified badge
    if (certificatesCompleted >= 5) badgePoints += 500 // Multi-Certified badge

    // Early adopter badge
    if (user?.createdAt && new Date(user.createdAt) < new Date('2025-01-01')) {
      badgePoints += 1000
    }

    const totalPoints = questionPoints + highQualityPoints + responsePoints + examPoints + certificatePoints + badgePoints

    // Calculate streak (simplified - would need proper streak tracking table)
    const streak = weeklyQuestions > 0 ? Math.min(weeklyQuestions, 7) : 0

    // Points breakdown by category
    const pointsBreakdown = {
      questions: questionPoints,
      highQuality: highQualityPoints,
      responses: responsePoints,
      exams: examPoints,
      certificates: certificatePoints,
      badges: badgePoints,
      total: totalPoints,
    }

    // Get level info
    const levelInfo = getLevelInfo(totalPoints)

    return NextResponse.json({
      // Basic stats
      totalQuestions,
      totalResponses,
      totalActivities,
      totalGroups,

      // Question stats
      highQualityQuestions,
      weeklyQuestions,
      monthlyQuestions,
      averageQuestionScore: questionScores._avg.questionEvaluationScore || 0,

      // Exam stats
      examAttempts,
      passedExams,
      perfectExams,
      averageExamScore: examScores._avg.score || 0,

      // Other stats
      inquiryAttempts,
      caseAttempts,
      certificatesCompleted,

      // Engagement
      streak,

      // Points
      totalPoints,
      pointsBreakdown,

      // Level info
      levelInfo,

      // Meta
      memberSince: user?.createdAt || null,
    })
  } catch (error) {
    console.error('Failed to fetch profile stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
