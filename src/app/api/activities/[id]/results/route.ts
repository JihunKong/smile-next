import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: activityId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get activity with group info
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      include: {
        owningGroup: {
          select: {
            id: true,
            name: true,
            creatorId: true,
            members: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    // Check access: must be group member or creator
    const isCreator = activity.owningGroup.creatorId === session.user.id
    const isMember = activity.owningGroup.members.length > 0
    if (!isCreator && !isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get stats based on activity mode
    const [
      totalQuestions,
      totalResponses,
      examAttempts,
      inquiryAttempts,
      caseAttempts,
      leaderboardEntries,
      questionEvaluations,
    ] = await Promise.all([
      prisma.question.count({
        where: { activityId, isDeleted: false },
      }),
      prisma.response.count({
        where: {
          question: { activityId },
          isDeleted: false,
        },
      }),
      prisma.examAttempt.findMany({
        where: { activityId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 50,
      }),
      prisma.inquiryAttempt.findMany({
        where: { activityId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 50,
      }),
      prisma.caseAttempt.findMany({
        where: { activityId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 50,
      }),
      prisma.leaderboard.findMany({
        where: { activityId },
        orderBy: { totalScore: 'desc' },
        take: 20,
      }),
      prisma.questionEvaluation.findMany({
        where: { activityId },
        select: { bloomsLevel: true },
      }),
    ])

    // Calculate stats
    const allAttempts = [...examAttempts, ...caseAttempts]
    const completedAttempts = allAttempts.filter(a => a.status === 'completed')
    const passedAttempts = [...examAttempts.filter(e => e.passed), ...caseAttempts.filter(c => c.passed)]

    const scores = completedAttempts
      .map(a => 'score' in a ? a.score : ('totalScore' in a ? a.totalScore : null))
      .filter((s): s is number => s !== null)

    const averageScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null

    const passRate = completedAttempts.length > 0
      ? (passedAttempts.length / completedAttempts.length) * 100
      : null

    // Get unique participants
    const participantIds = new Set([
      ...examAttempts.map(e => e.userId),
      ...inquiryAttempts.map(i => i.userId),
      ...caseAttempts.map(c => c.userId),
    ])

    // Calculate Bloom's distribution
    const bloomsDistribution: Record<string, number> = {
      Remember: 0,
      Understand: 0,
      Apply: 0,
      Analyze: 0,
      Evaluate: 0,
      Create: 0,
    }
    questionEvaluations.forEach(qe => {
      if (qe.bloomsLevel && qe.bloomsLevel in bloomsDistribution) {
        bloomsDistribution[qe.bloomsLevel]++
      }
    })

    // Get top performers from leaderboard
    const topPerformerIds = leaderboardEntries.map(l => l.userId)
    const topPerformersUsers = await prisma.user.findMany({
      where: { id: { in: topPerformerIds } },
      select: { id: true, firstName: true, lastName: true },
    })
    const userMap = new Map(topPerformersUsers.map(u => [u.id, u]))

    const topPerformers = leaderboardEntries.map((entry, index) => {
      const user = userMap.get(entry.userId)
      return {
        rank: index + 1,
        userId: entry.userId,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous',
        score: entry.averageScore || 0,
        questionsAnswered: entry.totalResponses,
      }
    })

    // Format recent attempts
    const recentAttempts = [
      ...examAttempts.map(e => ({
        id: e.id,
        userId: e.userId,
        userName: `${e.user.firstName || ''} ${e.user.lastName || ''}`.trim() || 'Anonymous',
        score: e.score,
        status: e.status,
        completedAt: e.completedAt?.toISOString() || null,
        timeSpent: e.timeSpentSeconds,
      })),
      ...caseAttempts.map(c => ({
        id: c.id,
        userId: c.userId,
        userName: `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || 'Anonymous',
        score: c.totalScore,
        status: c.status,
        completedAt: c.completedAt?.toISOString() || null,
        timeSpent: c.timeSpentSeconds,
      })),
    ].sort((a, b) => {
      if (!a.completedAt) return 1
      if (!b.completedAt) return -1
      return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    }).slice(0, 20)

    return NextResponse.json({
      id: activity.id,
      activityName: activity.name,
      activityType: activity.activityType,
      mode: activity.mode,
      owningGroup: {
        id: activity.owningGroup.id,
        name: activity.owningGroup.name,
      },
      stats: {
        totalQuestions,
        totalResponses,
        totalParticipants: participantIds.size,
        averageScore,
        passRate,
        completionRate: allAttempts.length > 0
          ? (completedAttempts.length / allAttempts.length) * 100
          : null,
      },
      topPerformers,
      recentAttempts,
      bloomsDistribution,
    })
  } catch (error) {
    console.error('Failed to fetch activity results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    )
  }
}
