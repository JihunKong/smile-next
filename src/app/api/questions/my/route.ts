import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/questions/my
 * Get questions created by the current user
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: {
          creatorId: session.user.id,
          isDeleted: false,
        },
        include: {
          activity: {
            select: {
              id: true,
              name: true,
              owningGroup: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.question.count({
        where: {
          creatorId: session.user.id,
          isDeleted: false,
        },
      }),
    ])

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q.id,
        content: q.content,
        activityId: q.activityId,
        activityName: q.activity?.name || 'Unknown Activity',
        groupName: q.activity?.owningGroup?.name || 'Unknown Group',
        createdAt: q.createdAt,
      })),
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Failed to get user questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
