import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

/**
 * Activity Analytics Student Performance API
 * Returns performance metrics for each student in the activity
 */

interface StudentPerformanceData {
  student_name: string
  student_id: string
  question_count: number
  avg_quality: string
  responses_received: number
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
    const { searchParams } = new URL(request.url)

    // Pagination and sorting params
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const sortBy = searchParams.get('sortBy') || 'avg_quality'
    const order = searchParams.get('order') || 'desc'

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

    // Get all questions for this activity with their creators and response counts
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
        _count: {
          select: {
            responses: {
              where: { isDeleted: false },
            },
          },
        },
      },
    })

    // Get unique creator IDs
    const creatorIds = [...new Set(questions.map(q => q.creatorId))]

    // Fetch user details for all creators
    const users = await prisma.user.findMany({
      where: {
        id: { in: creatorIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    // Aggregate stats by student
    const studentStats = new Map<string, {
      question_count: number
      total_quality: number
      scores_count: number
      responses_received: number
    }>()

    for (const question of questions) {
      const creatorId = question.creatorId
      const score = question.questionEvaluationScore ?? question.evaluation?.overallScore
      const responseCount = question._count.responses

      if (!studentStats.has(creatorId)) {
        studentStats.set(creatorId, {
          question_count: 0,
          total_quality: 0,
          scores_count: 0,
          responses_received: 0,
        })
      }

      const stats = studentStats.get(creatorId)!
      stats.question_count++
      stats.responses_received += responseCount

      if (score !== null && score !== undefined) {
        stats.total_quality += score
        stats.scores_count++
      }
    }

    // Convert to array format
    const performanceData: StudentPerformanceData[] = []

    for (const [studentId, stats] of studentStats) {
      const user = userMap.get(studentId)
      const studentName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Anonymous'
        : 'Anonymous'

      const avgQuality = stats.scores_count > 0
        ? (stats.total_quality / stats.scores_count).toFixed(2)
        : '0.00'

      performanceData.push({
        student_id: studentId,
        student_name: studentName,
        question_count: stats.question_count,
        avg_quality: avgQuality,
        responses_received: stats.responses_received,
      })
    }

    // Sort the data
    performanceData.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'student_name':
          comparison = a.student_name.localeCompare(b.student_name)
          break
        case 'question_count':
          comparison = a.question_count - b.question_count
          break
        case 'responses_received':
          comparison = a.responses_received - b.responses_received
          break
        case 'avg_quality':
        default:
          comparison = parseFloat(a.avg_quality) - parseFloat(b.avg_quality)
          break
      }

      return order === 'desc' ? -comparison : comparison
    })

    // Apply pagination
    const total = performanceData.length
    const startIndex = (page - 1) * limit
    const paginatedData = performanceData.slice(startIndex, startIndex + limit)

    // Return simple array for compatibility with the analytics page
    // The frontend expects a direct array, not an object with pagination
    return NextResponse.json(paginatedData)
  } catch (error) {
    console.error('Failed to fetch student performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student performance' },
      { status: 500 }
    )
  }
}
