import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * Activity Analytics Quality Distribution API
 * Returns distribution of question quality scores (1-5 star ratings)
 */

interface QualityDistribution {
  level: number
  count: number
}

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

    // Get activity and verify user has manager/admin access
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      include: {
        owningGroup: {
          include: {
            members: {
              where: { userId: session.user.id },
              select: { userId: true, role: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user has permission to view analytics
    // Must be activity creator, group creator, or group admin (role >= 1)
    const isActivityCreator = activity.creatorId === session.user.id
    const isGroupCreator = activity.owningGroup.creatorId === session.user.id
    const membership = activity.owningGroup.members[0]
    const isGroupAdmin = membership && membership.role >= 1

    if (!isActivityCreator && !isGroupCreator && !isGroupAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Only activity managers can view analytics.' },
        { status: 403 }
      )
    }

    // Get all questions with their evaluation scores
    const questions = await prisma.question.findMany({
      where: {
        activityId,
        isDeleted: false,
      },
      select: {
        questionEvaluationScore: true,
        evaluation: {
          select: {
            overallScore: true,
          },
        },
      },
    })

    // Initialize distribution buckets (1-5 stars)
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    // Categorize each question's score into 1-5 range
    // Scores are typically 0-5, we'll round to nearest integer
    for (const question of questions) {
      const score = question.questionEvaluationScore ?? question.evaluation?.overallScore

      if (score !== null && score !== undefined) {
        // Convert score to 1-5 star rating
        // Scores are usually 0-5, round and clamp to 1-5
        let starRating = Math.round(score)
        starRating = Math.max(1, Math.min(5, starRating))

        // Handle score of 0 as 1 star
        if (score < 0.5) {
          starRating = 1
        }

        distribution[starRating]++
      } else {
        // Questions without scores count as 1 star (needs evaluation)
        distribution[1]++
      }
    }

    // Convert to array format expected by frontend
    const response: QualityDistribution[] = [
      { level: 1, count: distribution[1] },
      { level: 2, count: distribution[2] },
      { level: 3, count: distribution[3] },
      { level: 4, count: distribution[4] },
      { level: 5, count: distribution[5] },
    ]

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch quality distribution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality distribution' },
      { status: 500 }
    )
  }
}
