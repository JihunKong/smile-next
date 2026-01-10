import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// Point calculation helper (matching stats route)
async function calculateUserPoints(userId: string): Promise<number> {
  const [
    totalQuestions,
    highQualityQuestions,
    totalResponses,
    passedExams,
    perfectExams,
    certificatesCompleted,
    user,
    totalGroups,
  ] = await Promise.all([
    prisma.question.count({
      where: { creatorId: userId, isDeleted: false },
    }),
    prisma.question.count({
      where: { creatorId: userId, questionEvaluationScore: { gte: 8 }, isDeleted: false },
    }),
    prisma.response.count({
      where: { creatorId: userId, isDeleted: false },
    }),
    prisma.examAttempt.count({
      where: { userId, passed: true },
    }),
    prisma.examAttempt.count({
      where: { userId, score: { gte: 1.0 } },
    }),
    prisma.studentCertificate.count({
      where: { studentId: userId, status: 'completed' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    }),
    prisma.groupUser.count({
      where: { userId, group: { isDeleted: false } },
    }),
  ])

  // Activity points
  const questionPoints = totalQuestions * 5
  const highQualityPoints = highQualityQuestions * 30
  const responsePoints = totalResponses * 2
  const examPoints = passedExams * 10 + perfectExams * 50
  const certificatePoints = certificatesCompleted * 100

  // Badge points
  let badgePoints = 0
  if (totalQuestions >= 1) badgePoints += 10
  if (totalQuestions >= 10) badgePoints += 25
  if (totalQuestions >= 25) badgePoints += 50
  if (totalQuestions >= 100) badgePoints += 100
  if (highQualityQuestions >= 10) badgePoints += 100
  if (totalResponses >= 1) badgePoints += 10
  if (totalResponses >= 50) badgePoints += 50
  if (passedExams >= 10) badgePoints += 150
  if (perfectExams >= 1) badgePoints += 300
  if (totalGroups >= 5) badgePoints += 100
  if (certificatesCompleted >= 1) badgePoints += 200
  if (certificatesCompleted >= 5) badgePoints += 500

  if (user?.createdAt && new Date(user.createdAt) < new Date('2025-01-01')) {
    badgePoints += 1000
  }

  return questionPoints + highQualityPoints + responsePoints + examPoints + certificatePoints + badgePoints
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

    // Get current user's points
    const userPoints = await calculateUserPoints(userId)

    // Get total user count (excluding deleted users)
    const totalUsers = await prisma.user.count({
      where: { isDeleted: false },
    })

    // Get all users with their question counts for ranking
    // Note: For a large-scale app, this would need to be optimized with a leaderboard table
    const usersWithQuestions = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        _count: {
          select: {
            createdQuestions: {
              where: { isDeleted: false },
            },
            responses: {
              where: { isDeleted: false },
            },
          },
        },
      },
    })

    // Calculate approximate points for ranking (simplified for performance)
    // In production, this should be pre-calculated and stored
    const userScores = usersWithQuestions.map(u => ({
      id: u.id,
      // Simplified score calculation for ranking
      score: u._count.createdQuestions * 5 + u._count.responses * 2,
    }))

    // Sort by score descending
    userScores.sort((a, b) => b.score - a.score)

    // Find user's rank
    const userRankIndex = userScores.findIndex(u => u.id === userId)
    const globalRank = userRankIndex !== -1 ? userRankIndex + 1 : totalUsers

    // Calculate percentile (lower is better - top 10% means you're in the top 10%)
    const percentile = Math.round((globalRank / totalUsers) * 100)

    // Get user's group rankings
    const userGroups = await prisma.groupUser.findMany({
      where: {
        userId,
        group: { isDeleted: false },
      },
      select: {
        group: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    })

    // Calculate ranking within each group
    const groupRankings = await Promise.all(
      userGroups.map(async (membership) => {
        const group = membership.group
        const memberIds = group.members.map(m => m.userId)

        // Get question counts for all members in this group
        const memberQuestions = await prisma.question.groupBy({
          by: ['creatorId'],
          where: {
            creatorId: { in: memberIds },
            isDeleted: false,
            activity: {
              owningGroupId: group.id,
            },
          },
          _count: {
            id: true,
          },
        })

        // Create a map of userId to question count
        const questionCounts = new Map<string, number>()
        for (const mq of memberQuestions) {
          questionCounts.set(mq.creatorId, mq._count.id)
        }

        // Sort members by question count
        const sortedMembers = [...memberIds].sort((a, b) => {
          return (questionCounts.get(b) || 0) - (questionCounts.get(a) || 0)
        })

        const rankInGroup = sortedMembers.indexOf(userId) + 1
        const userQuestionsInGroup = questionCounts.get(userId) || 0

        // Calculate approximate group points
        const groupPoints = userQuestionsInGroup * 18 + 45 // Matches Flask formula

        return {
          groupId: group.id,
          groupName: group.name,
          rank: rankInGroup,
          totalMembers: memberIds.length,
          questionsInGroup: userQuestionsInGroup,
          groupPoints,
        }
      })
    )

    // Get top performers for context (top 5)
    const topPerformers = userScores.slice(0, 5).map((u, index) => ({
      rank: index + 1,
      userId: u.id,
      score: u.score,
    }))

    // Get users around current user's rank for context
    const nearbyRanks = []
    const startIndex = Math.max(0, userRankIndex - 2)
    const endIndex = Math.min(userScores.length, userRankIndex + 3)

    for (let i = startIndex; i < endIndex; i++) {
      nearbyRanks.push({
        rank: i + 1,
        userId: userScores[i].id,
        score: userScores[i].score,
        isCurrentUser: userScores[i].id === userId,
      })
    }

    return NextResponse.json({
      globalRank,
      totalUsers,
      percentile,
      userPoints,
      groupRankings,
      topPerformers,
      nearbyRanks,
    })
  } catch (error) {
    console.error('Failed to fetch ranking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ranking' },
      { status: 500 }
    )
  }
}
