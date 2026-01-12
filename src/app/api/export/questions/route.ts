import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/export/questions
 * Export all questions for an activity as CSV
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
      select: { id: true, name: true },
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found or access denied' },
        { status: 404 }
      )
    }

    // Get all questions with related data
    const questions = await prisma.question.findMany({
      where: {
        activityId,
        isDeleted: false,
      },
      include: {
        creator: {
          select: { firstName: true, lastName: true, username: true },
        },
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Generate CSV
    const headers = ['Question ID', 'Content', 'Creator', 'AI Score', 'Response Count', 'Created At', 'Anonymous']
    const rows = questions.map((q) => [
      q.id,
      `"${(q.content || '').replace(/"/g, '""')}"`,
      q.isAnonymous ? 'Anonymous' : (`${q.creator.firstName || ''} ${q.creator.lastName || ''}`.trim() || q.creator.username || 'Unknown'),
      q.questionEvaluationScore?.toString() || '',
      q._count.responses.toString(),
      q.createdAt.toISOString(),
      q.isAnonymous ? 'Yes' : 'No',
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="questions-${activityId}.csv"`,
      },
    })
  } catch (error) {
    console.error('Failed to export questions:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
