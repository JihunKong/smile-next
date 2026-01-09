import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

interface ActivityEvent {
  id: string
  type: string
  title: string
  subtitle: string | null
  timestamp: Date
  icon: string
  color: string
  badgeProgress: boolean
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const events: ActivityEvent[] = []

    // Fetch high-quality questions (4+ star rating)
    const highQualityQuestions = await prisma.question.findMany({
      where: {
        creatorId: session.user.id,
        questionEvaluationScore: { gte: 8 }, // 8+ out of 10 ≈ 4+ stars
      },
      select: {
        id: true,
        content: true,
        questionEvaluationScore: true,
        createdAt: true,
        activity: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    for (const q of highQualityQuestions) {
      events.push({
        id: `question-${q.id}`,
        type: 'question_quality',
        title: `Created a high-quality question`,
        subtitle: q.activity?.name || null,
        timestamp: q.createdAt,
        icon: 'fa-question-circle',
        color: 'blue',
        badgeProgress: (q.questionEvaluationScore ?? 0) >= 9,
      })
    }

    // Fetch exam pass events
    const examPasses = await prisma.examAttempt.findMany({
      where: {
        userId: session.user.id,
        passed: true,
      },
      select: {
        id: true,
        score: true,
        completedAt: true,
        activity: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    })

    for (const exam of examPasses) {
      if (exam.completedAt) {
        events.push({
          id: `exam-${exam.id}`,
          type: 'exam_pass',
          title: `Passed exam: ${exam.activity.name}`,
          subtitle: `Score: ${Math.round((exam.score ?? 0) * 100)}%`,
          timestamp: exam.completedAt,
          icon: 'fa-check-circle',
          color: 'green',
          badgeProgress: (exam.score ?? 0) >= 0.9,
        })
      }
    }

    // Fetch group join events
    const groupJoins = await prisma.groupUser.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        joinedAt: true,
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 10,
    })

    for (const membership of groupJoins) {
      events.push({
        id: `group-${membership.id}`,
        type: 'group_join',
        title: `Joined group: ${membership.group.name}`,
        subtitle: null,
        timestamp: membership.joinedAt,
        icon: 'fa-users',
        color: 'purple',
        badgeProgress: false,
      })
    }

    // Fetch certificate completions
    const certificateCompletions = await prisma.studentCertificate.findMany({
      where: {
        studentId: session.user.id,
        status: 'completed',
      },
      select: {
        id: true,
        completionDate: true,
        certificate: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { completionDate: 'desc' },
      take: 10,
    })

    for (const cert of certificateCompletions) {
      if (cert.completionDate) {
        events.push({
          id: `certificate-${cert.id}`,
          type: 'certificate',
          title: `Completed certificate: ${cert.certificate.name}`,
          subtitle: null,
          timestamp: cert.completionDate,
          icon: 'fa-certificate',
          color: 'indigo',
          badgeProgress: true,
        })
      }
    }

    // Sort all events by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      events: events.slice(0, 50), // Limit to 50 most recent events
    })
  } catch (error) {
    console.error('Failed to fetch user events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
