import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

interface TimelineEvent {
  id: string
  type: 'question' | 'response' | 'exam' | 'inquiry' | 'case' | 'badge' | 'group' | 'certificate'
  title: string
  description: string | null
  timestamp: Date
  icon: string
  color: string
  metadata?: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // Optional filter by type
    const offset = (page - 1) * limit

    const events: TimelineEvent[] = []

    // Fetch questions created
    const questions = await prisma.question.findMany({
      where: {
        creatorId: userId,
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        questionEvaluationScore: true,
        createdAt: true,
        activity: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    for (const q of questions) {
      if (!type || type === 'question') {
        const isHighQuality = (q.questionEvaluationScore ?? 0) >= 8
        events.push({
          id: `question-${q.id}`,
          type: 'question',
          title: isHighQuality ? 'Created a high-quality question' : 'Created a question',
          description: q.content.length > 100 ? q.content.substring(0, 100) + '...' : q.content,
          timestamp: q.createdAt,
          icon: isHighQuality ? 'star' : 'question-circle',
          color: isHighQuality ? 'yellow' : 'blue',
          metadata: {
            activityName: q.activity?.name,
            activityId: q.activity?.id,
            score: q.questionEvaluationScore,
          },
        })
      }
    }

    // Fetch responses
    const responses = await prisma.response.findMany({
      where: {
        creatorId: userId,
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        isCorrect: true,
        score: true,
        createdAt: true,
        question: {
          select: {
            content: true,
            activity: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    for (const r of responses) {
      if (!type || type === 'response') {
        events.push({
          id: `response-${r.id}`,
          type: 'response',
          title: 'Submitted a response',
          description: r.content.length > 100 ? r.content.substring(0, 100) + '...' : r.content,
          timestamp: r.createdAt,
          icon: 'comment',
          color: r.isCorrect ? 'green' : 'gray',
          metadata: {
            questionContent: r.question?.content?.substring(0, 50),
            activityName: r.question?.activity?.name,
            isCorrect: r.isCorrect,
            score: r.score,
          },
        })
      }
    }

    // Fetch exam attempts
    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: {
        id: true,
        score: true,
        passed: true,
        completedAt: true,
        totalQuestions: true,
        correctAnswers: true,
        activity: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    })

    for (const exam of examAttempts) {
      if ((!type || type === 'exam') && exam.completedAt) {
        const scorePercent = Math.round((exam.score ?? 0) * 100)
        events.push({
          id: `exam-${exam.id}`,
          type: 'exam',
          title: exam.passed ? `Passed exam: ${exam.activity.name}` : `Completed exam: ${exam.activity.name}`,
          description: `Score: ${scorePercent}% (${exam.correctAnswers}/${exam.totalQuestions} correct)`,
          timestamp: exam.completedAt,
          icon: exam.passed ? 'check-circle' : 'clipboard-check',
          color: exam.passed ? 'green' : 'gray',
          metadata: {
            activityId: exam.activity.id,
            score: exam.score,
            passed: exam.passed,
          },
        })
      }
    }

    // Fetch inquiry attempts
    const inquiryAttempts = await prisma.inquiryAttempt.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: {
        id: true,
        questionsGenerated: true,
        questionsRequired: true,
        completedAt: true,
        activity: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    })

    for (const inquiry of inquiryAttempts) {
      if ((!type || type === 'inquiry') && inquiry.completedAt) {
        events.push({
          id: `inquiry-${inquiry.id}`,
          type: 'inquiry',
          title: `Completed inquiry: ${inquiry.activity.name}`,
          description: `Generated ${inquiry.questionsGenerated} questions`,
          timestamp: inquiry.completedAt,
          icon: 'lightbulb',
          color: 'purple',
          metadata: {
            activityId: inquiry.activity.id,
            questionsGenerated: inquiry.questionsGenerated,
          },
        })
      }
    }

    // Fetch case attempts
    const caseAttempts = await prisma.caseAttempt.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: {
        id: true,
        totalScore: true,
        passed: true,
        completedAt: true,
        activity: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    })

    for (const caseAttempt of caseAttempts) {
      if ((!type || type === 'case') && caseAttempt.completedAt) {
        events.push({
          id: `case-${caseAttempt.id}`,
          type: 'case',
          title: `Completed case study: ${caseAttempt.activity.name}`,
          description: `Score: ${Math.round((caseAttempt.totalScore ?? 0) * 100)}%`,
          timestamp: caseAttempt.completedAt,
          icon: 'briefcase',
          color: caseAttempt.passed ? 'green' : 'orange',
          metadata: {
            activityId: caseAttempt.activity.id,
            score: caseAttempt.totalScore,
            passed: caseAttempt.passed,
          },
        })
      }
    }

    // Fetch group memberships
    const groupMemberships = await prisma.groupUser.findMany({
      where: {
        userId,
        group: { isDeleted: false },
      },
      select: {
        id: true,
        joinedAt: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 15,
    })

    for (const membership of groupMemberships) {
      if (!type || type === 'group') {
        events.push({
          id: `group-${membership.id}`,
          type: 'group',
          title: `Joined group: ${membership.group.name}`,
          description: null,
          timestamp: membership.joinedAt,
          icon: 'users',
          color: 'indigo',
          metadata: {
            groupId: membership.group.id,
          },
        })
      }
    }

    // Fetch certificate completions
    const certificates = await prisma.studentCertificate.findMany({
      where: {
        studentId: userId,
        status: 'completed',
      },
      select: {
        id: true,
        completionDate: true,
        certificate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { completionDate: 'desc' },
      take: 10,
    })

    for (const cert of certificates) {
      if ((!type || type === 'certificate') && cert.completionDate) {
        events.push({
          id: `certificate-${cert.id}`,
          type: 'certificate',
          title: `Earned certificate: ${cert.certificate.name}`,
          description: 'Completed all required activities',
          timestamp: cert.completionDate,
          icon: 'certificate',
          color: 'gold',
          metadata: {
            certificateId: cert.certificate.id,
          },
        })
      }
    }

    // Sort all events by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedEvents = events.slice(offset, offset + limit)
    const totalEvents = events.length
    const hasMore = offset + limit < totalEvents

    // Group events by date for frontend display
    const groupedEvents: Record<string, TimelineEvent[]> = {}
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    for (const event of paginatedEvents) {
      const eventDate = new Date(event.timestamp)
      let dateGroup: string

      if (eventDate >= today) {
        dateGroup = 'Today'
      } else if (eventDate >= yesterday) {
        dateGroup = 'Yesterday'
      } else if (eventDate >= thisWeek) {
        dateGroup = 'This Week'
      } else if (eventDate >= thisMonth) {
        dateGroup = 'This Month'
      } else {
        dateGroup = 'Earlier'
      }

      if (!groupedEvents[dateGroup]) {
        groupedEvents[dateGroup] = []
      }
      groupedEvents[dateGroup].push(event)
    }

    return NextResponse.json({
      events: paginatedEvents,
      groupedEvents,
      pagination: {
        page,
        limit,
        total: totalEvents,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Failed to fetch timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}
