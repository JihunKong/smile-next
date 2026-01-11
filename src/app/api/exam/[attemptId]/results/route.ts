import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface QuestionResult {
  questionId: string
  questionContent: string
  choices: string[]
  studentAnswerIndex: number | null
  correctAnswerIndex: number
  isCorrect: boolean
  explanation: string | null
  shuffleMap: number[] | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { attemptId } = await params

  try {
    // Fetch attempt with related data
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
        activity: {
          select: {
            id: true,
            name: true,
            examSettings: true,
            owningGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        responses: {
          select: {
            questionId: true,
            choice: true,
            isCorrect: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Only allow the owner to see their results
    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (attempt.status !== 'completed') {
      return NextResponse.json({ error: 'Exam not completed yet' }, { status: 400 })
    }

    // Get exam settings with defaults
    const examSettings = (attempt.activity.examSettings as {
      timeLimit?: number
      questionsToShow?: number
      passThreshold?: number
      maxAttempts?: number
      showFeedback?: boolean
      showScore?: boolean
      showPassFail?: boolean
      showLeaderboard?: boolean
      enableAiCoaching?: boolean
    }) || {}

    const showScore = examSettings.showScore !== false
    const showPassFail = examSettings.showPassFail !== false
    const showFeedback = examSettings.showFeedback !== false
    const showLeaderboard = examSettings.showLeaderboard !== false

    // Get question order from attempt
    const questionOrder = (attempt.questionOrder as string[]) || []
    const choiceShuffles = (attempt.choiceShuffles as Record<string, number[]>) || {}

    // Fetch questions
    const questions = await prisma.question.findMany({
      where: { id: { in: questionOrder } },
      select: {
        id: true,
        content: true,
        choices: true,
        correctAnswers: true,
      },
    })

    // Build response map
    const responseMap = new Map(
      attempt.responses.map((r) => [r.questionId, { choice: r.choice, isCorrect: r.isCorrect }])
    )

    // Build question results in order (only if feedback is enabled)
    let questionResults: QuestionResult[] = []
    if (showFeedback) {
      questionResults = questionOrder.map((qId) => {
        const question = questions.find((q) => q.id === qId)
        if (!question) {
          return {
            questionId: qId,
            questionContent: '[Question not found]',
            choices: [],
            studentAnswerIndex: null,
            correctAnswerIndex: -1,
            isCorrect: false,
            explanation: null,
            shuffleMap: null,
          }
        }

        const choices = (question.choices as string[]) || []
        const correctAnswers = (question.correctAnswers as string[]) || []
        const correctAnswerIndex = correctAnswers.length > 0 ? parseInt(correctAnswers[0], 10) : -1

        const response = responseMap.get(qId)
        let studentAnswerIndex: number | null = null
        if (response?.choice) {
          studentAnswerIndex = parseInt(response.choice, 10)
        }

        const shuffleMap = choiceShuffles[qId] || null

        return {
          questionId: qId,
          questionContent: question.content,
          choices,
          studentAnswerIndex,
          correctAnswerIndex,
          isCorrect: response?.isCorrect === true,
          explanation: null,
          shuffleMap,
        }
      })
    }

    // Check remaining attempts
    const attemptCount = await prisma.examAttempt.count({
      where: {
        userId: session.user.id,
        activityId: attempt.activityId,
        status: 'completed',
      },
    })
    const maxAttempts = examSettings.maxAttempts || 1
    const remainingAttempts = maxAttempts - attemptCount

    // Calculate time spent formatted
    const timeSpentSeconds = attempt.timeSpentSeconds || 0
    const minutes = Math.floor(timeSpentSeconds / 60)
    const seconds = timeSpentSeconds % 60

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        score: showScore ? attempt.score : null,
        passed: showPassFail ? attempt.passed : null,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: showScore ? attempt.correctAnswers : null,
        timeSpent: {
          seconds: timeSpentSeconds,
          formatted: `${minutes}m ${seconds}s`,
        },
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      },
      activity: {
        id: attempt.activity.id,
        name: attempt.activity.name,
        group: attempt.activity.owningGroup,
      },
      examSettings: {
        passThreshold: examSettings.passThreshold || 60,
        showFeedback,
        showScore,
        showPassFail,
        showLeaderboard,
      },
      questionResults,
      remainingAttempts,
    })
  } catch (error) {
    console.error('Failed to fetch exam results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
