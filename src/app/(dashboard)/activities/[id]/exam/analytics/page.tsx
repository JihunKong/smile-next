import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { ExamSettings } from '@/types/activities'

interface ExamAnalyticsPageProps {
  params: Promise<{ id: string }>
}

interface QuestionAnalytics {
  questionNumber: number
  questionId: string
  questionText: string
  correctAnswer: string
  successRate: number
  difficulty: 'Easy' | 'Medium' | 'Difficult'
  correctCount: number
  incorrectCount: number
  totalResponses: number
  mostCommonWrongAnswer: {
    answer: string
    count: number
    percentage: number
  } | null
}

interface StudentPerformance {
  attemptId: string
  studentName: string
  studentEmail: string
  scorePercentage: number
  passed: boolean
  questionsCorrect: number
  questionsIncorrect: number
  timeTakenMinutes: number
  submittedAt: Date
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Attempts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
                <p className="text-3xl font-bold text-gray-900">{totalAttempts}</p>
                <p className="text-xs text-gray-500 mt-1">{uniqueStudents} students</p>
              </div>
              <div className="text-blue-500">
                <i className="fas fa-clipboard-list text-4xl"></i>
              </div>
            </div>
          </div>

          {/* Pass Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
                <p
                  className={`text-3xl font-bold ${
                    passRate >= 70
                      ? 'text-green-700'
                      : passRate >= 50
                        ? 'text-yellow-500'
                        : 'text-red-700'
                  }`}
                >
                  {passRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {passedStudents} / {uniqueStudents} passed
                </p>
              </div>
              <div className="text-green-500">
                <i className="fas fa-check-circle text-4xl"></i>
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{averageScore.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Across all attempts</p>
              </div>
              <div className="text-purple-500">
                <i className="fas fa-star text-4xl"></i>
              </div>
            </div>
          </div>

          {/* Average Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Time</p>
                <p className="text-3xl font-bold text-gray-900">{avgTimeMinutes}m</p>
                <p className="text-xs text-gray-500 mt-1">
                  Range: {minTimeSeconds === Infinity ? 0 : Math.round(minTimeSeconds / 60)}m -{' '}
                  {Math.round(maxTimeSeconds / 60)}m
                </p>
              </div>
              <div className="text-orange-500">
                <i className="fas fa-clock text-4xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-chart-bar mr-2 text-red-700"></i>
            Score Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(scoreDistribution).map(([range, count]) => (
              <div key={range} className="flex items-center">
                <div className="w-20 text-sm font-semibold text-gray-700">{range}%</div>
                <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{
                      width: totalAttempts > 0 ? `${(count / totalAttempts) * 100}%` : '0%',
                    }}
                  >
                    {count > 0 && <span className="text-white text-sm font-bold">{count}</span>}
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-gray-600 ml-3">
                  {totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Difficulty Analysis */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-brain mr-2 text-red-700"></i>
            Question Difficulty Analysis
            <span className="ml-3 text-sm font-normal text-gray-600">
              (Sorted by difficulty - hardest first)
            </span>
          </h2>

          {questionAnalytics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Question
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Success Rate
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Difficulty
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Responses
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Most Common Wrong Answer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questionAnalytics.map((qa) => (
                    <tr
                      key={qa.questionId}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-start">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold mr-3 flex-shrink-0 mt-1">
                            {qa.questionNumber}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 line-clamp-2">{qa.questionText}</p>
                            <p className="text-xs text-green-600 mt-1">
                              <i className="fas fa-check-circle mr-1"></i>
                              Correct: {qa.correctAnswer}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-lg font-bold ${
                              qa.successRate >= 80
                                ? 'text-green-700'
                                : qa.successRate >= 50
                                  ? 'text-yellow-500'
                                  : 'text-red-700'
                            }`}
                          >
                            {qa.successRate.toFixed(1)}%
                          </span>
                          <span className="text-xs text-gray-500">
                            {qa.correctCount}/{qa.totalResponses}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {qa.difficulty === 'Easy' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <i className="fas fa-smile mr-1"></i>Easy
                          </span>
                        )}
                        {qa.difficulty === 'Medium' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            <i className="fas fa-meh mr-1"></i>Medium
                          </span>
                        )}
                        {qa.difficulty === 'Difficult' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <i className="fas fa-frown mr-1"></i>Difficult
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-sm text-gray-700">
                          <i className="fas fa-check text-green-600"></i> {qa.correctCount}
                          <span className="mx-2 text-gray-400">|</span>
                          <i className="fas fa-times text-red-600"></i> {qa.incorrectCount}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {qa.mostCommonWrongAnswer ? (
                          <div className="text-sm">
                            <p className="text-gray-900">{qa.mostCommonWrongAnswer.answer}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {qa.mostCommonWrongAnswer.count} students (
                              {qa.mostCommonWrongAnswer.percentage.toFixed(1)}%)
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">All answered correctly</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-inbox text-4xl mb-3"></i>
              <p>No question data available yet</p>
            </div>
          )}
        </div>

        {/* Student Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-users mr-2 text-red-700"></i>
            Student Performance
            <span className="ml-3 text-sm font-normal text-gray-600">
              (Sorted by score - highest first)
            </span>
          </h2>

          {studentPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Student
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Score
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Questions
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Time
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Submitted
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentPerformance.map((student) => (
                    <tr
                      key={student.attemptId}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.studentName}</p>
                          <p className="text-xs text-gray-500">{student.studentEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-lg font-bold ${student.passed ? 'text-green-700' : 'text-red-700'}`}
                        >
                          {student.scorePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {student.passed ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <i className="fas fa-check-circle mr-1"></i>PASSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <i className="fas fa-times-circle mr-1"></i>FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-sm">
                          <span className="text-green-600 font-medium">
                            {student.questionsCorrect}
                          </span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-700">
                            {student.questionsCorrect + student.questionsIncorrect}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-gray-700">{student.timeTakenMinutes}m</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs text-gray-500">
                          {student.submittedAt.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/activities/${activityId}/exam/results?attempt=${student.attemptId}`}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                        >
                          <i className="fas fa-eye mr-1"></i>View Results
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-inbox text-4xl mb-3"></i>
              <p>No student submissions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
