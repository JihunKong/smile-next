import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's group memberships
    const memberships = await prisma.groupUser.findMany({
      where: { userId: session.user.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            isDeleted: true,
          },
        },
      },
    })

    // Also include groups the user created
    const createdGroups = await prisma.group.findMany({
      where: {
        creatorId: session.user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
    })

    const groupIds = [
      ...memberships.filter(m => !m.group.isDeleted).map(m => m.group.id),
      ...createdGroups.map(g => g.id),
    ]
    const uniqueGroupIds = [...new Set(groupIds)]

    // Get leaderboards for each group
    const leaderboards = await Promise.all(
      uniqueGroupIds.map(async (groupId) => {
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: { id: true, name: true },
        })

        if (!group) return null

        // Get activities in this group
        const activities = await prisma.activity.findMany({
          where: { owningGroupId: groupId, isDeleted: false },
          select: { id: true },
        })
        const activityIds = activities.map(a => a.id)

        if (activityIds.length === 0) {
          return {
            groupId: group.id,
            groupName: group.name,
            entries: [],
          }
        }

        // Aggregate user stats for this group
        const groupMembers = await prisma.groupUser.findMany({
          where: { groupId },
          select: { userId: true },
        })
        const groupCreator = await prisma.group.findUnique({
          where: { id: groupId },
          select: { creatorId: true },
        })

        const memberIds = [...new Set([
          ...groupMembers.map(m => m.userId),
          groupCreator?.creatorId,
        ].filter(Boolean))] as string[]

        // Get stats for each member
        const memberStats = await Promise.all(
          memberIds.map(async (userId) => {
            const [
              user,
              totalQuestions,
              examAttempts,
              leaderboardScore,
            ] = await Promise.all([
              prisma.user.findUnique({
                where: { id: userId },
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              }),
              prisma.question.count({
                where: {
                  creatorId: userId,
                  activityId: { in: activityIds },
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
              prisma.leaderboard.aggregate({
                where: {
                  userId,
                  activityId: { in: activityIds },
                },
                _sum: { totalScore: true },
                _avg: { averageScore: true },
              }),
            ])

            if (!user) return null

            const examScores = examAttempts.filter(e => e.score !== null).map(e => e.score!)
            const averageScore = examScores.length > 0
              ? examScores.reduce((sum, s) => sum + s, 0) / examScores.length
              : null

            // Calculate total score: questions*10 + exam_completions*20 + leaderboard_bonus
            const totalScore =
              (totalQuestions * 10) +
              (examAttempts.length * 20) +
              (leaderboardScore._sum.totalScore || 0)

            // Determine badges
            const badges: string[] = []
            if (totalQuestions >= 50) badges.push('Question Master')
            if (examAttempts.length >= 20) badges.push('Exam Expert')
            if (averageScore && averageScore >= 90) badges.push('High Achiever')
            if (totalQuestions >= 10 && examAttempts.length >= 5) badges.push('Well-Rounded')

            return {
              userId: user.id,
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
              avatarUrl: user.avatarUrl,
              totalScore,
              totalQuestions,
              totalExams: examAttempts.length,
              averageScore,
              badges,
            }
          })
        )

        // Filter and sort
        const validStats = memberStats.filter(Boolean) as NonNullable<typeof memberStats[number]>[]
        const sortedStats = validStats
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((stat, index) => ({
            ...stat,
            rank: index + 1,
          }))

        return {
          groupId: group.id,
          groupName: group.name,
          entries: sortedStats,
        }
      })
    )

    // Filter out null entries
    const validLeaderboards = leaderboards.filter(Boolean)

    return NextResponse.json({ leaderboards: validLeaderboards })
  } catch (error) {
    console.error('Failed to fetch leaderboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboards' },
      { status: 500 }
    )
  }
}
