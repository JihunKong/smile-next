import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

interface LeaderboardEntry {
  userId: string
  userName: string
  totalScore: number
  averageScore: number | null
  rank: number
  attemptCount: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: activityId } = await params
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'exam'

  try {
    // Get activity to verify access
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      include: {
        owningGroup: {
          include: {
            members: {
              where: { userId: session.user.id },
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (activity.owningGroup.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    let entries: LeaderboardEntry[] = []

    if (mode === 'exam') {
      // Get exam attempts with best scores per user
      const attempts = await prisma.examAttempt.findMany({
        where: {
          activityId,
          status: 'completed',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          score: 'desc',
        },
      })

      // Group by user and get best score
      const userBestScores = new Map<string, {
        userId: string
        userName: string
        bestScore: number
        totalScore: number
        attemptCount: number
      }>()

      for (const attempt of attempts) {
        const userId = attempt.user.id
        const userName = `${attempt.user.firstName || ''} ${attempt.user.lastName || ''}`.trim() || 'Anonymous'
        const score = attempt.score || 0

        if (!userBestScores.has(userId)) {
          userBestScores.set(userId, {
            userId,
            userName,
            bestScore: score,
            totalScore: score,
            attemptCount: 1,
          })
        } else {
          const existing = userBestScores.get(userId)!
          existing.bestScore = Math.max(existing.bestScore, score)
          existing.totalScore += score
          existing.attemptCount++
        }
      }

      // Convert to leaderboard entries
      const sortedEntries = Array.from(userBestScores.values())
        .sort((a, b) => b.bestScore - a.bestScore)

      entries = sortedEntries.map((entry, index) => ({
        userId: entry.userId,
        userName: entry.userName,
        totalScore: entry.bestScore,
        averageScore: entry.totalScore / entry.attemptCount,
        rank: index + 1,
        attemptCount: entry.attemptCount,
      }))

    } else if (mode === 'inquiry') {
      // Get inquiry attempts with question evaluations
      const attempts = await prisma.inquiryAttempt.findMany({
        where: {
          activityId,
          status: 'completed',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      // Calculate average score from question evaluations
      const userScores = new Map<string, {
        userId: string
        userName: string
        totalScore: number
        attemptCount: number
      }>()

      for (const attempt of attempts) {
        const userId = attempt.user.id
        const userName = `${attempt.user.firstName || ''} ${attempt.user.lastName || ''}`.trim() || 'Anonymous'

        // Get average question evaluation score for this attempt
        // First get questions created by this user during the attempt
        const questions = await prisma.question.findMany({
          where: {
            activityId,
            creatorId: userId,
            questionType: 'inquiry',
            createdAt: {
              gte: attempt.startedAt,
              lte: attempt.completedAt || new Date(),
            },
          },
          select: {
            questionEvaluationScore: true,
          },
        })

        const scores = questions
          .map((q) => q.questionEvaluationScore)
          .filter((s): s is number => s !== null)

        const avgScore = scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0

        if (!userScores.has(userId)) {
          userScores.set(userId, {
            userId,
            userName,
            totalScore: avgScore,
            attemptCount: 1,
          })
        } else {
          const existing = userScores.get(userId)!
          existing.totalScore = Math.max(existing.totalScore, avgScore)
          existing.attemptCount++
        }
      }

      const sortedEntries = Array.from(userScores.values())
        .sort((a, b) => b.totalScore - a.totalScore)

      entries = sortedEntries.map((entry, index) => ({
        userId: entry.userId,
        userName: entry.userName,
        totalScore: entry.totalScore,
        averageScore: entry.totalScore,
        rank: index + 1,
        attemptCount: entry.attemptCount,
      }))

    } else if (mode === 'case') {
      // Get case attempts with best scores per user
      const attempts = await prisma.caseAttempt.findMany({
        where: {
          activityId,
          status: 'completed',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          totalScore: 'desc',
        },
      })

      // Group by user and get best score
      const userBestScores = new Map<string, {
        userId: string
        userName: string
        bestScore: number
        totalScore: number
        attemptCount: number
      }>()

      for (const attempt of attempts) {
        const userId = attempt.user.id
        const userName = `${attempt.user.firstName || ''} ${attempt.user.lastName || ''}`.trim() || 'Anonymous'
        const score = attempt.totalScore || 0

        if (!userBestScores.has(userId)) {
          userBestScores.set(userId, {
            userId,
            userName,
            bestScore: score,
            totalScore: score,
            attemptCount: 1,
          })
        } else {
          const existing = userBestScores.get(userId)!
          existing.bestScore = Math.max(existing.bestScore, score)
          existing.totalScore += score
          existing.attemptCount++
        }
      }

      const sortedEntries = Array.from(userBestScores.values())
        .sort((a, b) => b.bestScore - a.bestScore)

      entries = sortedEntries.map((entry, index) => ({
        userId: entry.userId,
        userName: entry.userName,
        totalScore: entry.bestScore,
        averageScore: entry.totalScore / entry.attemptCount,
        rank: index + 1,
        attemptCount: entry.attemptCount,
      }))
    }

    return NextResponse.json({
      entries,
      currentUserId: session.user.id,
    })

  } catch (error) {
    console.error('Failed to get leaderboard:', error)
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 })
  }
}
