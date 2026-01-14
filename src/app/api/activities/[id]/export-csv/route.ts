import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId } = await params

    // Get activity with questions
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      select: {
        id: true,
        name: true,
        creatorId: true,
        owningGroup: {
          select: {
            members: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
        questions: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            isAnonymous: true,
            evaluation: true,
            creator: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check permission (creator or group admin)
    const isCreator = activity.creatorId === session.user.id
    const isAdmin = (activity.owningGroup?.members[0]?.role ?? 0) >= 1

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Build CSV content
    const headers = ['ID', 'Question', 'Author', 'Anonymous', 'Score', 'Bloom Level', 'Created At']
    const rows: string[][] = []

    for (const question of activity.questions) {
      const evaluation = question.evaluation as { overall_score?: number; bloom_level?: string } | null
      const authorName = question.isAnonymous
        ? 'Anonymous'
        : question.creator?.username ||
          `${question.creator?.firstName || ''} ${question.creator?.lastName || ''}`.trim() ||
          'Unknown'

      rows.push([
        question.id,
        escapeCsvField(question.content),
        authorName,
        question.isAnonymous ? 'Yes' : 'No',
        evaluation?.overall_score?.toString() || '',
        evaluation?.bloom_level || '',
        question.createdAt.toISOString(),
      ])
    }

    // Generate CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    // Return as downloadable file
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(activity.name)}_questions.csv"`,
      },
    })
  } catch (error) {
    console.error('Failed to export CSV:', error)
    return NextResponse.json({ error: 'Failed to export questions' }, { status: 500 })
  }
}

function escapeCsvField(field: string): string {
  // Remove newlines and clean up for CSV
  return field.replace(/[\r\n]+/g, ' ').trim()
}
