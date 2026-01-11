import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

/**
 * POST: Create a new comment on a question
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = await params
    const { content, parentId, isAnonymous = false } = await request.json()

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 2000 characters)' },
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
        { error: 'Anonymous comments are not allowed in this activity' },
        { status: 400 }
      )
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId, questionId: questionId, isDeleted: false },
      })
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        creatorId: session.user.id,
        questionId: questionId,
        parentId: parentId || null,
        isAnonymous: isAnonymous,
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

    // Format creator info
    const creatorInfo = comment.isAnonymous ? null : {
      id: comment.creator.id,
      name: comment.creator.firstName && comment.creator.lastName
        ? `${comment.creator.firstName} ${comment.creator.lastName}`
        : comment.creator.email.split('@')[0],
      email: comment.creator.email,
      image: comment.creator.avatarUrl,
    }

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        isAnonymous: comment.isAnonymous,
        parentId: comment.parentId,
        creator: creatorInfo,
        isOwnComment: true,
      },
    })
  } catch (error) {
    console.error('[POST /api/questions/[questionId]/comments] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

/**
 * GET: Get all comments for a question
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = await params

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

    // Check if user is a group member
    if (question.activity.owningGroup.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    // Get all top-level comments (no parent) with replies
    const comments = await prisma.comment.findMany({
      where: {
        questionId: questionId,
        isDeleted: false,
        parentId: null, // Top-level comments only
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
        replies: {
          where: { isDeleted: false },
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
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format comments
    const formattedComments = comments.map((comment) => {
      const creatorInfo = comment.isAnonymous ? null : {
        id: comment.creator.id,
        name: comment.creator.firstName && comment.creator.lastName
          ? `${comment.creator.firstName} ${comment.creator.lastName}`
          : comment.creator.email.split('@')[0],
        email: comment.creator.email,
        image: comment.creator.avatarUrl,
      }

      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isAnonymous: comment.isAnonymous,
        creator: creatorInfo,
        isOwnComment: comment.creatorId === session.user.id,
        replies: comment.replies.map((reply) => {
          const replyCreatorInfo = reply.isAnonymous ? null : {
            id: reply.creator.id,
            name: reply.creator.firstName && reply.creator.lastName
              ? `${reply.creator.firstName} ${reply.creator.lastName}`
              : reply.creator.email.split('@')[0],
            email: reply.creator.email,
            image: reply.creator.avatarUrl,
          }

          return {
            id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            isAnonymous: reply.isAnonymous,
            creator: replyCreatorInfo,
            isOwnComment: reply.creatorId === session.user.id,
          }
        }),
      }
    })

    return NextResponse.json({
      comments: formattedComments,
      total: comments.length,
    })
  } catch (error) {
    console.error('[GET /api/questions/[questionId]/comments] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get comments' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Delete a comment (soft delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { questionId } = await params
    const { commentId } = await request.json()

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    // Get the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId, questionId: questionId, isDeleted: false },
      include: {
        question: {
          include: {
            activity: {
              include: {
                owningGroup: true,
              },
            },
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check permission: comment creator, question creator, activity creator, group owner
    const canDelete =
      comment.creatorId === session.user.id ||
      comment.question.creatorId === session.user.id ||
      comment.question.activity.creatorId === session.user.id ||
      comment.question.activity.owningGroup.creatorId === session.user.id

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comment' },
        { status: 403 }
      )
    }

    // Soft delete
    await prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/questions/[questionId]/comments] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
