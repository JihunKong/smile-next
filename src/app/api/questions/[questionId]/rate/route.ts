import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

interface Review {
  user: string
  rating: number
  comment?: string
  createdAt: string
  updatedAt?: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { questionId } = await params
    const { rating, comment } = await request.json()

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    // Get the current question with creator info
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        creatorId: true,
        reviews: true,
        ratings: true,
        averageRating: true,
        numberOfRatings: true,
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Prevent self-rating
    if (question.creatorId === userId) {
      return NextResponse.json(
        { error: 'You cannot rate your own question' },
        { status: 400 }
      )
    }

    // Parse existing reviews
    const reviews: Review[] = Array.isArray(question.reviews)
      ? (question.reviews as unknown as Review[])
      : []

    // Check if user already rated this question
    const existingReviewIndex = reviews.findIndex(r => r.user === userId)
    const now = new Date().toISOString()

    if (existingReviewIndex >= 0) {
      // Update existing review
      reviews[existingReviewIndex] = {
        ...reviews[existingReviewIndex],
        rating,
        comment: comment || reviews[existingReviewIndex].comment,
        updatedAt: now,
      }
    } else {
      // Add new review
      reviews.push({
        user: userId,
        rating,
        comment: comment || undefined,
        createdAt: now,
      })
    }

    // Calculate new average from all reviews
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
    const newCount = reviews.length
    const newAverage = newCount > 0 ? totalRating / newCount : 0

    // Update the question with new reviews and recalculated average
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        reviews: reviews as unknown as import('@prisma/client').Prisma.InputJsonValue,
        ratings: newAverage,
        averageRating: newAverage,
        numberOfRatings: newCount,
        numOfReviews: newCount,
      },
      select: {
        id: true,
        averageRating: true,
        numberOfRatings: true,
      },
    })

    return NextResponse.json({
      success: true,
      averageRating: updatedQuestion.averageRating,
      numberOfRatings: updatedQuestion.numberOfRatings,
      isUpdate: existingReviewIndex >= 0,
    })
  } catch (error) {
    console.error('[POST /api/questions/[questionId]/rate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    )
  }
}

// GET: Get user's rating for a question
export async function GET(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { questionId } = await params

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        reviews: true,
        averageRating: true,
        numberOfRatings: true,
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const reviews: Review[] = Array.isArray(question.reviews)
      ? (question.reviews as unknown as Review[])
      : []

    const userReview = reviews.find(r => r.user === userId)

    return NextResponse.json({
      averageRating: question.averageRating,
      numberOfRatings: question.numberOfRatings,
      userRating: userReview?.rating || null,
      userComment: userReview?.comment || null,
    })
  } catch (error) {
    console.error('[GET /api/questions/[questionId]/rate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get rating' },
      { status: 500 }
    )
  }
}
