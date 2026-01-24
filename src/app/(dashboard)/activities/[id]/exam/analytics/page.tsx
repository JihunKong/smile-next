/**
 * Exam Analytics Page
 *
 * Displays analytics and statistics for exam attempts (teacher view).
 * Refactored to use feature module components.
 *
 * @see VIBE-0004C
 */

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { ExamSettings } from '@/types/activities'
import type { QuestionAnalytics, StudentPerformance } from '@/features/exam-mode'
import {
  ExamOverviewStats,
  ScoreDistributionChart,
  QuestionDifficultyTable,
  StudentPerformanceTable,
} from '@/features/exam-mode/components'

interface ExamAnalyticsPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamAnalyticsPage({ params }: ExamAnalyticsPageProps) {
  const { id: activityId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Get activity with exam settings
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      owningGroup: {
        select: {
          id: true,
          name: true,
          creatorId: true,
        },
      },
    },
  })

  if (!activity) {
    notFound()
  }

  // Check if user is owner or admin (roleId 0 or 1 is admin)
  const isOwner = activity.owningGroup.creatorId === session.user.id
  const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1
  if (!isOwner && !isAdmin) {
    redirect(`/activities/${activityId}`)
  }

  const examSettings = (activity.examSettings as unknown as ExamSettings) || {
    passThreshold: 70,
  }

  // Get all completed exam attempts
  const attempts = await prisma.examAttempt.findMany({
    where: {
      activityId,
      status: 'completed',
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      responses: true,
    },
    orderBy: {
      completedAt: 'desc',
    },
  })

  // Get all questions for this activity
  const questions = await prisma.question.findMany({
    where: { activityId },
    select: {
      id: true,
      content: true,
      choices: true,
      correctAnswers: true,
    },
  })

  // Calculate overall statistics
  const totalAttempts = attempts.length
  const uniqueStudents = new Set(attempts.map((a) => a.userId)).size

  // Calculate pass rate and scores
  let totalScore = 0
  let passedStudents = 0
  let totalTimeSeconds = 0
  let minTimeSeconds = Infinity
  let maxTimeSeconds = 0

  const studentPerformance: StudentPerformance[] = []

  for (const attempt of attempts) {
    const score = attempt.score || 0
    totalScore += score

    if (score >= examSettings.passThreshold) {
      passedStudents++
    }

    const startTime = attempt.startedAt?.getTime() || 0
    const endTime = attempt.completedAt?.getTime() || Date.now()
    const timeSeconds = Math.floor((endTime - startTime) / 1000)
    totalTimeSeconds += timeSeconds
    minTimeSeconds = Math.min(minTimeSeconds, timeSeconds)
    maxTimeSeconds = Math.max(maxTimeSeconds, timeSeconds)

    const correct = attempt.correctAnswers || 0
    const total = (attempt.questionOrder as string[])?.length || questions.length

    studentPerformance.push({
      attemptId: attempt.id,
      studentName: [attempt.user.firstName, attempt.user.lastName].filter(Boolean).join(' ') || 'Unknown',
      studentEmail: attempt.user.email || '',
      scorePercentage: score,
      passed: score >= examSettings.passThreshold,
      questionsCorrect: correct,
      questionsIncorrect: total - correct,
      timeTakenMinutes: Math.round(timeSeconds / 60),
      submittedAt: attempt.completedAt || new Date(),
    })
  }

  // Sort by score descending
  studentPerformance.sort((a, b) => b.scorePercentage - a.scorePercentage)

  const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0
  const passRate = totalAttempts > 0 ? (passedStudents / uniqueStudents) * 100 : 0
  const avgTimeMinutes = totalAttempts > 0 ? Math.round(totalTimeSeconds / totalAttempts / 60) : 0

  // Score distribution
  const scoreDistribution: Record<string, number> = {
    '90-100': 0,
    '80-89': 0,
    '70-79': 0,
    '60-69': 0,
    '50-59': 0,
    '0-49': 0,
  }

  for (const attempt of attempts) {
    const score = attempt.score || 0
    if (score >= 90) scoreDistribution['90-100']++
    else if (score >= 80) scoreDistribution['80-89']++
    else if (score >= 70) scoreDistribution['70-79']++
    else if (score >= 60) scoreDistribution['60-69']++
    else if (score >= 50) scoreDistribution['50-59']++
    else scoreDistribution['0-49']++
  }

  // Question analytics
  const questionAnalytics: QuestionAnalytics[] = []
  const questionMap = new Map(questions.map((q) => [q.id, q]))

  // Create a map for question response counts
  const questionResponses: Record<
    string,
    { correct: number; incorrect: number; wrongAnswers: Record<string, number> }
  > = {}

  for (const attempt of attempts) {
    for (const response of attempt.responses) {
      if (!questionResponses[response.questionId]) {
        questionResponses[response.questionId] = {
          correct: 0,
          incorrect: 0,
          wrongAnswers: {},
        }
      }

      const question = questionMap.get(response.questionId)
      if (!question) continue

      const correctAnswersArr = (question.correctAnswers as string[]) || []
      const isCorrect = correctAnswersArr.includes(response.choice || '')

      if (isCorrect) {
        questionResponses[response.questionId].correct++
      } else {
        questionResponses[response.questionId].incorrect++
        const answer = response.choice || 'No Answer'
        questionResponses[response.questionId].wrongAnswers[answer] =
          (questionResponses[response.questionId].wrongAnswers[answer] || 0) + 1
      }
    }
  }

  // Build question analytics
  let questionNumber = 1
  for (const question of questions) {
    const stats = questionResponses[question.id] || {
      correct: 0,
      incorrect: 0,
      wrongAnswers: {},
    }
    const total = stats.correct + stats.incorrect
    const successRate = total > 0 ? (stats.correct / total) * 100 : 0

    let difficulty: 'Easy' | 'Medium' | 'Difficult' = 'Medium'
    if (successRate >= 80) difficulty = 'Easy'
    else if (successRate < 50) difficulty = 'Difficult'

    // Find most common wrong answer
    let mostCommonWrongAnswer: QuestionAnalytics['mostCommonWrongAnswer'] = null
    const wrongEntries = Object.entries(stats.wrongAnswers)
    if (wrongEntries.length > 0) {
      wrongEntries.sort((a, b) => b[1] - a[1])
      const [answer, count] = wrongEntries[0]
      mostCommonWrongAnswer = {
        answer,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }
    }

    const correctAnswers = (question.correctAnswers as string[]) || []
    questionAnalytics.push({
      questionNumber: questionNumber++,
      questionId: question.id,
      questionText: question.content,
      correctAnswer: correctAnswers.join(', ') || '',
      successRate,
      difficulty,
      correctCount: stats.correct,
      incorrectCount: stats.incorrect,
      totalResponses: total,
      mostCommonWrongAnswer,
    })
  }

  // Sort by difficulty (hardest first)
  questionAnalytics.sort((a, b) => a.successRate - b.successRate)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/activities/${activityId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Activity
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <i className="fas fa-chart-bar mr-3 text-red-700"></i>
            Exam Analytics
          </h1>
          <p className="text-gray-600 mt-2">{activity.name}</p>
        </div>

        {/* Overall Statistics Cards */}
        <ExamOverviewStats
          totalAttempts={totalAttempts}
          uniqueStudents={uniqueStudents}
          passRate={passRate}
          passedStudents={passedStudents}
          averageScore={averageScore}
          avgTimeMinutes={avgTimeMinutes}
          minTimeMinutes={minTimeSeconds === Infinity ? 0 : Math.round(minTimeSeconds / 60)}
          maxTimeMinutes={Math.round(maxTimeSeconds / 60)}
        />

        {/* Score Distribution */}
        <ScoreDistributionChart
          distribution={scoreDistribution}
          totalAttempts={totalAttempts}
        />

        {/* Question Difficulty Analysis */}
        <QuestionDifficultyTable analytics={questionAnalytics} />

        {/* Student Performance */}
        <StudentPerformanceTable
          students={studentPerformance}
          activityId={activityId}
        />
      </div>
    </div>
  )
}
