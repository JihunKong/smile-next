import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { queueResponseEvaluation } from '@/lib/queue/bull'

/**
 * POST: Create a new response to a question
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId, questionId } = await params
    const { content, isAnonymous = false } = await request.json()

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response content is required' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Response is too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    // Get question with activity and group info
    const question = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      include: {
        activity: {
          include: {
            owningGroup: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Verify activity ID matches
    if (question.activityId !== activityId) {
      return NextResponse.json(
        { error: 'Question does not belong to this activity' },
        { status: 400 }
      )
    }

    // Check if user is a group member
    if (question.activity.owningGroup.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    // Check if anonymous is allowed
    if (isAnonymous && !question.activity.isAnonymousAuthorAllowed) {
      return NextResponse.json(
        { error: 'Anonymous responses are not allowed in this activity' },
        { status: 400 }
      )
    }

    // Create response
    const response = await prisma.response.create({
      data: {
        content: content.trim(),
        creatorId: session.user.id,
        questionId: questionId,
        isAnonymous: isAnonymous,
        aiEvaluationStatus: 'pending',
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Update question's numberOfAnswers
    await prisma.question.update({
      where: { id: questionId },
      data: { numberOfAnswers: { increment: 1 } },
    })

    // Update activity's numberOfAnswers
    await prisma.activity.update({
      where: { id: activityId },
      data: { numberOfAnswers: { increment: 1 } },
    })

    // Queue AI evaluation job (fire and forget)
    if (question.activity.aiRatingEnabled) {
      queueResponseEvaluation({
        responseId: response.id,
        responseContent: content.trim(),
        questionContent: question.content,
        activityId: activityId,
        userId: session.user.id,
        context: {
          activityName: question.activity.name,
          groupName: question.activity.owningGroup.name,
        },
      }).catch((error) => {
        console.warn('[POST /api/.../responses] Failed to queue response evaluation:', error)
      })
    }

    // Format creator info
    const creatorInfo = response.isAnonymous ? null : {
      id: response.creator.id,
      name: response.creator.firstName && response.creator.lastName
        ? `${response.creator.firstName} ${response.creator.lastName}`
        : response.creator.email.split('@')[0],
      email: response.creator.email,
      image: response.creator.avatarUrl,
    }

    return NextResponse.json({
      success: true,
      response: {
        id: response.id,
        content: response.content,
        createdAt: response.createdAt,
        isAnonymous: response.isAnonymous,
        creator: creatorInfo,
        aiEvaluationStatus: response.aiEvaluationStatus,
      },
    })
  } catch (error) {
    console.error('[POST /api/.../responses] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create response' },
      { status: 500 }
    )
  }
}

/**
 * GET: Get all responses for a question
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId, questionId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Verify question exists and user has access
    const question = await prisma.question.findUnique({
      where: { id: questionId, isDeleted: false },
      include: {
        activity: {
          include: {
            owningGroup: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (question.activityId !== activityId) {
      return NextResponse.json(
        { error: 'Question does not belong to this activity' },
        { status: 400 }
      )
    }

    // Check if user is a group member
    if (question.activity.owningGroup.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    // Get responses with pagination
    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where: { questionId: questionId, isDeleted: false },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { likes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.response.count({
        where: { questionId: questionId, isDeleted: false },
      }),
    ])

    // Get user's likes using ResponseLike
    const userLikes = await prisma.responseLike.findMany({
      where: {
        userId: session.user.id,
        responseId: { in: responses.map((r) => r.id) },
      },
      select: { responseId: true },
    })
    const likedResponseIds = new Set(userLikes.map((l) => l.responseId))

    // Format responses
    const formattedResponses = responses.map((response) => {
      const creatorInfo = response.isAnonymous ? null : {
        id: response.creator.id,
        name: response.creator.firstName && response.creator.lastName
          ? `${response.creator.firstName} ${response.creator.lastName}`
          : response.creator.email.split('@')[0],
        email: response.creator.email,
        image: response.creator.avatarUrl,
      }

      return {
        id: response.id,
        content: response.content,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        isAnonymous: response.isAnonymous,
        creator: creatorInfo,
        isOwnResponse: response.creatorId === session.user.id,
        likeCount: response._count.likes,
        isLiked: likedResponseIds.has(response.id),
        aiEvaluationStatus: response.aiEvaluationStatus,
        aiEvaluationRating: response.aiEvaluationRating,
        aiEvaluationScore: response.aiEvaluationScore,
        aiEvaluationFeedback: response.aiEvaluationFeedback,
      }
    })

    return NextResponse.json({
      responses: formattedResponses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/.../responses] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get responses' },
      { status: 500 }
    )
  }
}
