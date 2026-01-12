import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/export/responses
 * Export all responses for an activity as CSV
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

    // Get all responses with related data
    const responses = await prisma.response.findMany({
      where: {
        question: {
          activityId,
          isDeleted: false,
        },
        isDeleted: false,
      },
      include: {
        creator: {
          select: { firstName: true, lastName: true, username: true, email: true },
        },
        question: {
          select: { content: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Generate CSV
    const headers = ['Student Name', 'Email', 'Question', 'Response', 'Created At', 'Score']
    const rows = responses.map((r) => [
      `${r.creator.firstName || ''} ${r.creator.lastName || ''}`.trim() || r.creator.username || 'Anonymous',
      r.creator.email || '',
      `"${(r.question.content || '').replace(/"/g, '""')}"`,
      `"${(r.content || '').replace(/"/g, '""')}"`,
      r.createdAt.toISOString(),
      r.score?.toString() || '',
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="responses-${activityId}.csv"`,
      },
    })
  } catch (error) {
    console.error('Failed to export responses:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
