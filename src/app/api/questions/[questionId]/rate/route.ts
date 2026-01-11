import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

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
    const { rating } = await request.json()

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5' },
        { status: 400 }
      )
    }

    // Get the current question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        ratings: true,
        averageRating: true,
        numberOfRatings: true,
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Calculate new average rating
    // Note: This is a simplified calculation. In a real system, you'd want to
    // track individual user ratings to prevent duplicate ratings
    const currentTotal = (question.averageRating || 0) * (question.numberOfRatings || 0)
    const newTotal = currentTotal + rating
    const newCount = (question.numberOfRatings || 0) + 1
    const newAverage = newTotal / newCount

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        ratings: newAverage,
        averageRating: newAverage,
        numberOfRatings: newCount,
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
    })
  } catch (error) {
    console.error('[POST /api/questions/[questionId]/rate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    )
  }
}
