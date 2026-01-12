import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/export/analytics
 * Export analytics data for an activity as CSV
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const activityId = searchParams.get('activityId')

  if (!activityId) {
    return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
  }

  try {
    // Verify user has access to this activity
    const activity = await prisma.activity.findFirst({
      where: {
        id: activityId,
        owningGroup: {
          members: {
            some: {
              userId: session.user.id,
              role: { gte: 1 }, // Admin or higher
            },
          },
        },
      },
      include: {
        owningGroup: {
          select: { name: true },
        },
        _count: {
          select: { questions: true },
        },
      },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    // Get participant statistics
    const participants = await prisma.response.groupBy({
      by: ['creatorId'],
      where: {
        question: {
          activityId,
          isDeleted: false,
        },
        isDeleted: false,
      },
      _count: {
        id: true,
      },
    })

    // Get daily activity data
    const responses = await prisma.response.findMany({
      where: {
        question: {
          activityId,
          isDeleted: false,
        },
        isDeleted: false,
      },
      select: {
        createdAt: true,
        score: true,
      },
    })

    // Aggregate by date
    const dailyData: Record<string, { count: number; totalScore: number; scoredCount: number }> = {}
    responses.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, totalScore: 0, scoredCount: 0 }
      }
      dailyData[date].count++
      if (r.score) {
        dailyData[date].totalScore += r.score
        dailyData[date].scoredCount++
      }
    })

    // Get question stats
    const questions = await prisma.question.findMany({
      where: {
        activityId,
        isDeleted: false,
      },
      select: {
        questionEvaluationScore: true,
      },
    })

    const avgAiScore =
      questions.filter((q) => q.questionEvaluationScore).reduce((sum, q) => sum + (q.questionEvaluationScore || 0), 0) /
      (questions.filter((q) => q.questionEvaluationScore).length || 1)

    // Generate CSV with summary and daily data
    const summaryRows = [
      ['Activity Analytics Export'],
      [''],
      ['Summary'],
      ['Activity Name', `"${activity.name}"`],
      ['Group', `"${activity.owningGroup.name}"`],
      ['Total Questions', activity._count.questions.toString()],
      ['Total Responses', responses.length.toString()],
      ['Unique Participants', participants.length.toString()],
      ['Average AI Score', avgAiScore.toFixed(2)],
      ['Export Date', new Date().toISOString()],
      [''],
      ['Daily Activity'],
      ['Date', 'Responses', 'Average Score'],
    ]

    const dailyRows = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => [
        date,
        data.count.toString(),
        data.scoredCount > 0 ? (data.totalScore / data.scoredCount).toFixed(2) : 'N/A',
      ])

    const csv = [...summaryRows, ...dailyRows].map((row) => row.join(',')).join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${activityId}.csv"`,
      },
    })
  } catch (error) {
    console.error('Failed to export analytics:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
