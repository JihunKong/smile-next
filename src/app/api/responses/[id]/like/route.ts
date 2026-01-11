import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

/**
 * POST: Toggle like on a response
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: responseId } = await params
    const userId = session.user.id

    // Get the response with question and activity info
    const response = await prisma.response.findUnique({
      where: { id: responseId, isDeleted: false },
      include: {
        question: {
          include: {
            activity: {
              include: {
                owningGroup: {
                  include: {
                    members: {
                      where: { userId: userId },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Check if user is a group member
    if (response.question.activity.owningGroup.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    // Prevent self-liking
    if (response.creatorId === userId) {
      return NextResponse.json(
        { error: 'You cannot like your own response' },
        { status: 400 }
      )
    }

    // Check if already liked
    const existingLike = await prisma.responseLike.findUnique({
      where: {
        userId_responseId: {
          userId: userId,
          responseId: responseId,
        },
      },
    })

    let liked: boolean
    let newCount: number

    if (existingLike) {
      // Unlike
      await prisma.responseLike.delete({
        where: { id: existingLike.id },
      })
      liked = false
      newCount = response._count.likes - 1
    } else {
      // Like
      await prisma.responseLike.create({
        data: {
          userId: userId,
          responseId: responseId,
        },
      })
      liked = true
      newCount = response._count.likes + 1
    }

    return NextResponse.json({
      success: true,
      liked,
      count: newCount,
    })
  } catch (error) {
    console.error('[POST /api/responses/[id]/like] Error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

/**
 * GET: Get like status for a response
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: responseId } = await params
    const userId = session.user.id

    const response = await prisma.response.findUnique({
      where: { id: responseId, isDeleted: false },
      select: {
        id: true,
        _count: {
          select: { likes: true },
        },
      },
    })

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    const userLike = await prisma.responseLike.findUnique({
      where: {
        userId_responseId: {
          userId: userId,
          responseId: responseId,
        },
      },
    })

    return NextResponse.json({
      liked: !!userLike,
      count: response._count.likes,
    })
  } catch (error) {
    console.error('[GET /api/responses/[id]/like] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get like status' },
      { status: 500 }
    )
  }
}
