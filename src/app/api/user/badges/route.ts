import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// Badge definitions (matching Flask badge-display.html)
const badgeDefinitions = [
  // Question badges
  { id: 'question-master', name: 'Question Master', description: 'Create 100 high-quality questions', icon: 'fas fa-question-circle', level: 'gold', points: 500, category: 'Questions' },
  { id: 'first-question', name: 'First Question', description: 'Create your first question', icon: 'fas fa-lightbulb', level: 'bronze', points: 10, category: 'Questions' },
  { id: 'quality-creator', name: 'Quality Creator', description: 'Create 10 questions rated 4+ stars', icon: 'fas fa-star', level: 'silver', points: 100, category: 'Questions' },

  // Response badges
  { id: 'helpful-responder', name: 'Helpful Responder', description: 'Provide 50 helpful responses', icon: 'fas fa-comments', level: 'silver', points: 200, category: 'Responses' },
  { id: 'first-response', name: 'First Response', description: 'Submit your first response', icon: 'fas fa-comment', level: 'bronze', points: 10, category: 'Responses' },

  // Exam badges
  { id: 'exam-ace', name: 'Exam Ace', description: 'Score 100% on an exam', icon: 'fas fa-graduation-cap', level: 'gold', points: 300, category: 'Exams' },
  { id: 'exam-passer', name: 'Exam Passer', description: 'Pass 10 exams', icon: 'fas fa-check-circle', level: 'silver', points: 150, category: 'Exams' },
  { id: 'first-exam', name: 'First Exam', description: 'Complete your first exam', icon: 'fas fa-clipboard-check', level: 'bronze', points: 20, category: 'Exams' },

  // Group badges
  { id: 'community-builder', name: 'Community Builder', description: 'Join 5 groups', icon: 'fas fa-users', level: 'silver', points: 100, category: 'Community' },
  { id: 'group-creator', name: 'Group Creator', description: 'Create your first group', icon: 'fas fa-user-plus', level: 'bronze', points: 50, category: 'Community' },

  // Streak badges
  { id: 'week-warrior', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'fas fa-fire', level: 'silver', points: 100, category: 'Engagement' },
  { id: 'month-master', name: 'Month Master', description: 'Maintain a 30-day streak', icon: 'fas fa-fire-alt', level: 'gold', points: 500, category: 'Engagement' },

  // Certificate badges
  { id: 'certified', name: 'Certified', description: 'Complete your first certificate', icon: 'fas fa-certificate', level: 'silver', points: 200, category: 'Certificates' },
  { id: 'multi-certified', name: 'Multi-Certified', description: 'Complete 5 certificates', icon: 'fas fa-award', level: 'gold', points: 500, category: 'Certificates' },

  // Special badges
  { id: 'early-adopter', name: 'Early Adopter', description: 'Join during beta period', icon: 'fas fa-rocket', level: 'platinum', points: 1000, category: 'Special' },
  { id: 'top-contributor', name: 'Top Contributor', description: 'Be in top 10 monthly contributors', icon: 'fas fa-crown', level: 'platinum', points: 1000, category: 'Special' },
]

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's activity stats
    const [
      questionCount,
      highQualityQuestionCount,
      responseCount,
      examAttempts,
      passedExams,
      perfectExams,
      groupCount,
      certificateCount,
      user,
    ] = await Promise.all([
      // Total questions created
      prisma.question.count({
        where: { creatorId: session.user.id },
      }),
      // High quality questions (8+ score)
      prisma.question.count({
        where: {
          creatorId: session.user.id,
          questionEvaluationScore: { gte: 8 },
        },
      }),
      // Total responses
      prisma.response.count({
        where: { creatorId: session.user.id },
      }),
      // Total exam attempts
      prisma.examAttempt.count({
        where: { userId: session.user.id },
      }),
      // Passed exams
      prisma.examAttempt.count({
        where: {
          userId: session.user.id,
          passed: true,
        },
      }),
      // Perfect exams (100% score)
      prisma.examAttempt.count({
        where: {
          userId: session.user.id,
          score: { gte: 1.0 },
        },
      }),
      // Groups joined
      prisma.groupUser.count({
        where: { userId: session.user.id },
      }),
      // Certificates completed
      prisma.studentCertificate.count({
        where: {
          studentId: session.user.id,
          status: 'completed',
        },
      }),
      // User data
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          createdAt: true,
        },
      }),
    ])

    // Calculate which badges are earned
    const earnedBadges: Array<{
      id: string
      badge: typeof badgeDefinitions[0]
      earnedAt: Date
      isFeatured: boolean
    }> = []

    // Question badges
    if (questionCount >= 1) {
      earnedBadges.push({
        id: 'first-question',
        badge: badgeDefinitions.find(b => b.id === 'first-question')!,
        earnedAt: new Date(),
        isFeatured: false,
      })
    }
    if (highQualityQuestionCount >= 10) {
      earnedBadges.push({
        id: 'quality-creator',
        badge: badgeDefinitions.find(b => b.id === 'quality-creator')!,
        earnedAt: new Date(),
        isFeatured: false,
      })
    }
    if (questionCount >= 100 && highQualityQuestionCount >= 50) {
      earnedBadges.push({
        id: 'question-master',
        badge: badgeDefinitions.find(b => b.id === 'question-master')!,
        earnedAt: new Date(),
        isFeatured: true,
      })
    }

    // Response badges
    if (responseCount >= 1) {
      earnedBadges.push({
        id: 'first-response',
        badge: badgeDefinitions.find(b => b.id === 'first-response')!,
        earnedAt: new Date(),
        isFeatured: false,
      })
    }
    if (responseCount >= 50) {
      earnedBadges.push({
        id: 'helpful-responder',
        badge: badgeDefinitions.find(b => b.id === 'helpful-responder')!,
        earnedAt: new Date(),
        isFeatured: false,
      })
    }

    // Exam badges
    if (examAttempts >= 1) {
      earnedBadges.push({
        id: 'first-exam',
        badge: badgeDefinitions.find(b => b.id === 'first-exam')!,
        earnedAt: new Date(),
        isFeatured: false,
      })
    }
    if (passedExams >= 10) {
      earnedBadges.push({
        id: 'exam-passer',
        badge: badgeDefinitions.find(b => b.id === 'exam-passer')!,
        earnedAt: new Date(),
        isFeatured: false,
      })
    }
    if (perfectExams >= 1) {
      earnedBadges.push({
        id: 'exam-ace',
        badge: badgeDefinitions.find(b => b.id === 'exam-ace')!,
        earnedAt: new Date(),
        isFeatured: true,
      })
    }

    // Group badges
    if (groupCount >= 5) {
      earnedBadges.push({
        id: 'community-builder',
        badge: badgeDefinitions.find(b => b.id === 'community-builder')!,
        earnedAt: new Date(),
        isFeatured: false,
      })
    }

    // Certificate badges
    if (certificateCount >= 1) {
      earnedBadges.push({
        id: 'certified',
        badge: badgeDefinitions.find(b => b.id === 'certified')!,
        earnedAt: new Date(),
        isFeatured: false,
      })
    }
    if (certificateCount >= 5) {
      earnedBadges.push({
        id: 'multi-certified',
        badge: badgeDefinitions.find(b => b.id === 'multi-certified')!,
        earnedAt: new Date(),
        isFeatured: true,
      })
    }

    // Early adopter (joined before 2025)
    if (user?.createdAt && new Date(user.createdAt) < new Date('2025-01-01')) {
      earnedBadges.push({
        id: 'early-adopter',
        badge: badgeDefinitions.find(b => b.id === 'early-adopter')!,
        earnedAt: user.createdAt,
        isFeatured: true,
      })
    }

    // Calculate total points from earned badges + activity
    const badgePoints = earnedBadges.reduce((sum, ub) => sum + (ub.badge?.points || 0), 0)
    const activityPoints = questionCount * 5 + responseCount * 2 + passedExams * 10
    const totalPoints = badgePoints + activityPoints

    // Calculate user level based on points
    let level = 1
    let pointsNeeded = 100
    let accumulatedPoints = 0

    while (accumulatedPoints + pointsNeeded <= totalPoints) {
      accumulatedPoints += pointsNeeded
      level++
      pointsNeeded = 100 + 50 * (level - 1)
    }

    return NextResponse.json({
      earnedBadges,
      allBadges: badgeDefinitions,
      userStats: {
        totalPoints,
        level,
        currentStreak: 0, // Would need streak tracking table
      },
    })
  } catch (error) {
    console.error('Failed to fetch user badges:', error)
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
  }
}
