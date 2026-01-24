/**
 * Exam Results Page
 *
 * Displays the exam results after completion.
 * Refactored to use feature module components.
 *
 * @see VIBE-0004C
 */

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import type { QuestionResult, ExamSettings } from '@/features/exam-mode'
import {
  ExamScoreCard,
  ExamResultStats,
  ExamFeedback,
  QuestionResultList,
  ResultsActions,
} from '@/features/exam-mode/components'

interface ExamResultsPageProps {
  params: Promise<{ id: string; attemptId: string }>
}

export default async function ExamResultsPage({ params }: ExamResultsPageProps) {
  const { id: activityId, attemptId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

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

  if (!attempt || attempt.userId !== session.user.id) {
    notFound()
  }

  if (attempt.status !== 'completed') {
    redirect(`/activities/${activityId}/exam/take`)
  }

  // Get exam settings with defaults
  const examSettings = (attempt.activity.examSettings as unknown as ExamSettings) || {
    timeLimit: 30,
    questionsToShow: 10,
    passThreshold: 60,
    maxAttempts: 1,
    showFeedback: true,
    showScore: true,
    showPassFail: true,
    showLeaderboard: true,
    enableAiCoaching: false,
  }

  const showScore = examSettings.showScore !== false
  const showPassFail = examSettings.showPassFail !== false
  const showFeedback = examSettings.showFeedback !== false
  const showLeaderboard = examSettings.showLeaderboard !== false
  const enableAiCoaching = examSettings.enableAiCoaching === true

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
      explanation: true,
    },
  })

  // Build response map
  const responseMap = new Map(
    attempt.responses.map((r) => [r.questionId, { choice: r.choice, isCorrect: r.isCorrect }])
  )

  // Build question results in order
  const questionResults: QuestionResult[] = questionOrder.map((qId) => {
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
      explanation: question.explanation || null,
      shuffleMap,
    }
  })

  // Check remaining attempts
  const attemptCount = await prisma.examAttempt.count({
    where: {
      userId: session.user.id,
      activityId,
      status: 'completed',
    },
  })
  const remainingAttempts = (examSettings.maxAttempts || 1) - attemptCount

  // Calculate time spent
  const timeSpent = attempt.timeSpentSeconds || 0
  const minutes = Math.floor(timeSpent / 60)
  const seconds = timeSpent % 60

  // Get passed status
  const passed = attempt.passed === true
  const score = attempt.score || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 max-w-4xl py-8">
        {/* Score Card with Pass/Fail Status */}
        <ExamScoreCard
          score={score}
          passed={passed}
          activityName={attempt.activity.name}
          showPassFail={showPassFail}
          showScore={showScore}
        />

        {/* Results Breakdown */}
        {showScore && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <ExamResultStats
              correctAnswers={attempt.correctAnswers || 0}
              totalQuestions={attempt.totalQuestions}
              timeSpentMinutes={minutes}
              timeSpentSeconds={seconds}
              passThreshold={examSettings.passThreshold || 60}
              completedAt={attempt.completedAt}
              remainingAttempts={remainingAttempts}
              showScore={showScore}
            />
          </div>
        )}

        {/* AI Coaching Feedback Section */}
        <ExamFeedback enabled={enableAiCoaching} />

        {/* Question-by-Question Review */}
        <QuestionResultList results={questionResults} showFeedback={showFeedback} />

        {/* Actions */}
        <ResultsActions
          activityId={activityId}
          attemptId={attemptId}
          activityName={attempt.activity.name}
          score={score}
          passed={passed}
          remainingAttempts={remainingAttempts}
          showLeaderboard={showLeaderboard}
        />
      </div>
    </div>
  )
}
