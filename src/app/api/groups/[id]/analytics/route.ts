import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get group with membership check
    const group = await prisma.group.findUnique({
      where: { id: groupId, isDeleted: false },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                createdAt: true,
              },
            },
          },
        },
        activities: {
          where: { isDeleted: false },
          include: {
            _count: {
              select: {
                questions: true,
                examAttempts: true,
                inquiryAttempts: true,
                caseAttempts: true,
              },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check access
    const isCreator = group.creatorId === session.user.id
    const isMember = group.members.some(m => m.userId === session.user.id)
    if (!isCreator && !isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get aggregate stats
    const activityIds = group.activities.map(a => a.id)

    const [
      totalQuestions,
      totalResponses,
      examAttempts,
      inquiryAttempts,
      caseAttempts,
    ] = await Promise.all([
      prisma.question.count({
        where: {
          activityId: { in: activityIds },
          isDeleted: false,
        },
      }),
      prisma.response.count({
        where: {
          question: { activityId: { in: activityIds } },
          isDeleted: false,
        },
      }),
      prisma.examAttempt.findMany({
        where: { activityId: { in: activityIds } },
        select: {
          userId: true,
          score: true,
          status: true,
          completedAt: true,
        },
      }),
      prisma.inquiryAttempt.findMany({
        where: { activityId: { in: activityIds } },
        select: {
          userId: true,
          status: true,
          completedAt: true,
        },
      }),
      prisma.caseAttempt.findMany({
        where: { activityId: { in: activityIds } },
        select: {
          userId: true,
          totalScore: true,
          status: true,
          completedAt: true,
        },
      }),
    ])

    // Calculate average score
    const completedExamScores = examAttempts
      .filter(e => e.status === 'completed' && e.score !== null)
      .map(e => e.score!)
    const completedCaseScores = caseAttempts
      .filter(c => c.status === 'completed' && c.totalScore !== null)
      .map(c => c.totalScore!)
    const allScores = [...completedExamScores, ...completedCaseScores]
    const averageScore = allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
      : null

    // Get member activity stats
    const memberActivity = await Promise.all(
      group.members.map(async (membership) => {
        const userId = membership.userId
        const user = membership.user

        const [questionsCreated, responsesGiven, memberExams, lastActivity] = await Promise.all([
          prisma.question.count({
            where: {
              creatorId: userId,
              activityId: { in: activityIds },
              isDeleted: false,
            },
          }),
          prisma.response.count({
            where: {
              creatorId: userId,
              question: { activityId: { in: activityIds } },
              isDeleted: false,
            },
          }),
          prisma.examAttempt.findMany({
            where: {
              userId,
              activityId: { in: activityIds },
              status: 'completed',
            },
            select: { score: true },
          }),
          prisma.examAttempt.findFirst({
            where: { userId, activityId: { in: activityIds } },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          }),
        ])

        const memberScores = memberExams.filter(e => e.score !== null).map(e => e.score!)
        const memberAvgScore = memberScores.length > 0
          ? memberScores.reduce((sum, s) => sum + s, 0) / memberScores.length
          : null

        return {
          userId,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
          questionsCreated,
          responsesGiven,
          examsTaken: memberExams.length,
          averageScore: memberAvgScore,
          lastActive: lastActivity?.createdAt?.toISOString() || null,
        }
      })
    )

    // Get activity performance
    const activityPerformance = await Promise.all(
      group.activities.map(async (activity) => {
        const activityExams = await prisma.examAttempt.findMany({
          where: { activityId: activity.id, status: 'completed' },
          select: { score: true, userId: true },
        })

        const activityScores = activityExams.filter(e => e.score !== null).map(e => e.score!)
        const activityAvgScore = activityScores.length > 0
          ? activityScores.reduce((sum, s) => sum + s, 0) / activityScores.length
          : null

        const uniqueParticipants = new Set(activityExams.map(e => e.userId)).size

        return {
          activityId: activity.id,
          activityName: activity.name,
          mode: activity.mode,
          participantCount: uniqueParticipants,
          averageScore: activityAvgScore,
          completionRate: null, // Would need to compare with total expected participants
        }
      })
    )

    // Calculate weekly trends (last 8 weeks)
    const weeklyTrends: Array<{ week: string; questions: number; responses: number; examsTaken: number }> = []
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (i + 1) * 7)
      const weekEnd = new Date(now)
      weekEnd.setDate(now.getDate() - i * 7)

      const [weekQuestions, weekResponses, weekExams] = await Promise.all([
        prisma.question.count({
          where: {
            activityId: { in: activityIds },
            createdAt: { gte: weekStart, lt: weekEnd },
            isDeleted: false,
          },
        }),
        prisma.response.count({
          where: {
            question: { activityId: { in: activityIds } },
            createdAt: { gte: weekStart, lt: weekEnd },
            isDeleted: false,
          },
        }),
        prisma.examAttempt.count({
          where: {
            activityId: { in: activityIds },
            createdAt: { gte: weekStart, lt: weekEnd },
          },
        }),
      ])

      weeklyTrends.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        questions: weekQuestions,
        responses: weekResponses,
        examsTaken: weekExams,
      })
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        memberCount: group.members.length,
        activityCount: group.activities.length,
        createdAt: group.createdAt.toISOString(),
      },
      overview: {
        totalQuestions,
        totalResponses,
        averageScore,
        totalExamAttempts: examAttempts.length,
        totalInquiryAttempts: inquiryAttempts.length,
        totalCaseAttempts: caseAttempts.length,
      },
      memberActivity: memberActivity.sort((a, b) => (b.examsTaken + b.questionsCreated) - (a.examsTaken + a.questionsCreated)),
      activityPerformance: activityPerformance.sort((a, b) => b.participantCount - a.participantCount),
      weeklyTrends,
    })
  } catch (error) {
    console.error('Failed to fetch group analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
