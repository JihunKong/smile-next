import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * Activity Analytics Overview API
 * Returns summary statistics for an activity
 */

interface OverviewResponse {
  total_questions: number
  total_students: number
  average_quality: string
  total_responses: number
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

    // Get all questions for this activity
    const questions = await prisma.question.findMany({
      where: {
        activityId,
        isDeleted: false,
      },
      select: {
        id: true,
        creatorId: true,
        questionEvaluationScore: true,
        evaluation: {
          select: {
            overallScore: true,
          },
        },
      },
    })

    // Count unique students who created questions
    const uniqueStudentIds = new Set(questions.map(q => q.creatorId))

    // Calculate average quality (from question evaluation scores)
    const scores = questions
      .map(q => q.questionEvaluationScore ?? q.evaluation?.overallScore)
      .filter((s): s is number => s !== null && s !== undefined)

    const averageQuality = scores.length > 0
      ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(2)
      : '0.00'

    // Count total responses to questions in this activity
    const totalResponses = await prisma.response.count({
      where: {
        question: {
          activityId,
          isDeleted: false,
        },
        isDeleted: false,
      },
    })

    const response: OverviewResponse = {
      total_questions: questions.length,
      total_students: uniqueStudentIds.size,
      average_quality: averageQuality,
      total_responses: totalResponses,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch analytics overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}
