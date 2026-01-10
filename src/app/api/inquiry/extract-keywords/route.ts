import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { extractKeywords } from '@/lib/services/inquiryKeywordService'

/**
 * POST /api/inquiry/extract-keywords
 *
 * Extract keywords from chapter text using AI.
 * Only accessible to teachers/admins.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      chapterText,
      pool1Count = 10,
      pool2Count = 10,
      subject,
      educationLevel,
      activityId,
    } = body

    if (!chapterText || typeof chapterText !== 'string') {
      return NextResponse.json(
        { error: 'chapterText is required and must be a string' },
        { status: 400 }
      )
    }

    if (chapterText.length < 50) {
      return NextResponse.json(
        { error: 'chapterText must be at least 50 characters' },
        { status: 400 }
      )
    }

    // If activityId provided, verify user has permission
    if (activityId) {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId, isDeleted: false },
        include: {
          owningGroup: {
            select: {
              creatorId: true,
              members: {
                where: { userId: session.user.id },
                select: { role: true },
              },
            },
          },
        },
      })

      if (!activity) {
        return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
      }

      const isCreator = activity.creatorId === session.user.id
      const isGroupOwner = activity.owningGroup.creatorId === session.user.id
      const membership = activity.owningGroup.members[0]
      const isAdmin = membership?.role && membership.role >= 2

      if (!isCreator && !isGroupOwner && !isAdmin) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }
    }

    // Extract keywords using AI
    const result = await extractKeywords(chapterText, {
      pool1Count: Math.min(Math.max(1, pool1Count), 20),
      pool2Count: Math.min(Math.max(1, pool2Count), 20),
      subject,
      educationLevel,
    })

    return NextResponse.json({
      success: true,
      pool1: result.pool1,
      pool2: result.pool2,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('[extract-keywords] Error:', error)
    return NextResponse.json(
      { error: 'Failed to extract keywords' },
      { status: 500 }
    )
  }
}
