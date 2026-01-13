import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface ExamResultsPageProps {
  params: Promise<{ id: string; attemptId: string }>
}

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

interface ExamSettingsWithFeedback {
  timeLimit?: number
  questionsToShow?: number
  passThreshold?: number
  shuffleQuestions?: boolean
  shuffleChoices?: boolean
  maxAttempts?: number
  showFeedback?: boolean
  showScore?: boolean
  showPassFail?: boolean
  showLeaderboard?: boolean
  enableAiCoaching?: boolean
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
  const examSettings = (attempt.activity.examSettings as unknown as ExamSettingsWithFeedback) || {
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

  // Calculate time spent formatted
  const timeSpent = attempt.timeSpentSeconds || 0
  const minutes = Math.floor(timeSpent / 60)
  const seconds = timeSpent % 60

  // Get passed status
  const passed = attempt.passed === true
  const score = attempt.score || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 max-w-4xl py-8">
        {/* Results Header Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          {/* Pass/Fail Status */}
          {showPassFail && (
            <div className="text-center mb-8">
              <div
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                  passed ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {passed ? (
                  <svg className="w-16 h-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-16 h-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h1 className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'Congratulations!' : 'Keep Trying!'}
              </h1>
              <p className="text-xl text-gray-600">{attempt.activity.name}</p>
            </div>
          )}

          {!showPassFail && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                <svg className="w-16 h-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold mb-2 text-blue-600">Exam Submitted!</h1>
              <p className="text-xl text-gray-600">{attempt.activity.name}</p>
            </div>
          )}

          {/* Score Display */}
          {showScore && (
            <div className="text-center mb-8">
              <div
                className="inline-block rounded-lg p-8 shadow-lg"
                style={{
                  backgroundColor: showPassFail ? (passed ? '#047857' : '#dc2626') : '#1e40af',
                  border: `3px solid ${showPassFail ? (passed ? '#065f46' : '#991b1b') : '#1e3a8a'}`,
                }}
              >
                <div className="text-6xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                  {score.toFixed(1)}%
                </div>
                <div className="text-lg text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                  Your Score
                </div>
              </div>
            </div>
          )}

          {/* Results Breakdown */}
          {showScore && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 mb-1">Correct Answers</p>
                    <p className="text-3xl font-bold text-green-600">{attempt.correctAnswers}</p>
                  </div>
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 mb-1">Wrong Answers</p>
                    <p className="text-3xl font-bold text-red-600">
                      {attempt.totalQuestions - attempt.correctAnswers}
                    </p>
                  </div>
                  <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Total Questions</p>
                    <p className="text-3xl font-bold text-blue-600">{attempt.totalQuestions}</p>
                  </div>
                  <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Time Taken</p>
                <p className="text-lg font-semibold text-gray-700">
                  {minutes}m {seconds}s
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Passing Threshold</p>
                <p className="text-lg font-semibold text-gray-700">{examSettings.passThreshold}%</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Submitted At</p>
                <p className="text-lg font-semibold text-gray-700">
                  {attempt.completedAt
                    ? new Date(attempt.completedAt).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">Attempts Remaining</p>
                <p className="text-lg font-semibold text-gray-700">{remainingAttempts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Coaching Feedback Section */}
        {enableAiCoaching && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-2xl p-8 mb-6 border-2 border-purple-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Coaching Feedback
                </h2>
                <p className="text-gray-600">Personalized guidance based on your performance</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-inner">
              <p className="text-gray-600 text-center">
                AI coaching feedback will be generated here based on your exam performance.
              </p>
            </div>
          </div>
        )}

        {/* Question-by-Question Review */}
        {showFeedback && questionResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#8C1515' }}>
              <svg className="w-6 h-6 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Question Review
            </h2>

            <div className="space-y-6">
              {questionResults.map((result, index) => (
                <div
                  key={result.questionId}
                  className={`border-l-4 ${
                    result.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  } rounded-r-lg p-6`}
                >
                  {/* Question Number and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full ${
                          result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                        } flex items-center justify-center`}
                      >
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          result.isCorrect
                            ? 'bg-green-200 text-green-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {result.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="mb-4">
                    <p className="text-lg text-gray-900 font-medium mb-4">{result.questionContent}</p>

                    {/* Answer Choices */}
                    <div className="space-y-2">
                      {result.shuffleMap ? (
                        // If shuffle map exists, show choices in shuffled order
                        result.shuffleMap.map((originalIndex, displayPosition) => {
                          const choice = result.choices[originalIndex]
                          const isCorrectAnswer = originalIndex === result.correctAnswerIndex
                          const isStudentAnswer = originalIndex === result.studentAnswerIndex
                          const letter = String.fromCharCode(65 + displayPosition)

                          return (
                            <div
                              key={displayPosition}
                              className={`flex items-start space-x-3 p-3 rounded-lg ${
                                isCorrectAnswer
                                  ? 'bg-green-100 border border-green-300'
                                  : isStudentAnswer
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-gray-50'
                              }`}
                            >
                              <span className="font-bold text-gray-700">{letter}.</span>
                              <span className="flex-1 text-gray-800">{choice}</span>
                              {isCorrectAnswer && (
                                <span className="text-green-600 font-semibold flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Correct Answer
                                </span>
                              )}
                              {isStudentAnswer && !isCorrectAnswer && (
                                <span className="text-red-600 font-semibold flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Your Answer
                                </span>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        // No shuffle map, show in original order
                        result.choices.map((choice, choiceIndex) => {
                          const isCorrectAnswer = choiceIndex === result.correctAnswerIndex
                          const isStudentAnswer = choiceIndex === result.studentAnswerIndex
                          const letter = String.fromCharCode(65 + choiceIndex)

                          return (
                            <div
                              key={choiceIndex}
                              className={`flex items-start space-x-3 p-3 rounded-lg ${
                                isCorrectAnswer
                                  ? 'bg-green-100 border border-green-300'
                                  : isStudentAnswer
                                    ? 'bg-red-100 border border-red-300'
                                    : 'bg-gray-50'
                              }`}
                            >
                              <span className="font-bold text-gray-700">{letter}.</span>
                              <span className="flex-1 text-gray-800">{choice}</span>
                              {isCorrectAnswer && (
                                <span className="text-green-600 font-semibold flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Correct Answer
                                </span>
                              )}
                              {isStudentAnswer && !isCorrectAnswer && (
                                <span className="text-red-600 font-semibold flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Your Answer
                                </span>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Explanation (if available) */}
                  {result.explanation && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 mt-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Explanation
                      </p>
                      <p className="text-sm text-blue-800">{result.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {/* Return to Activity */}
            <Link
              href={`/activities/${activityId}`}
              className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Activity
            </Link>

            {/* Retry Button (if reattempts allowed) */}
            {remainingAttempts > 0 ? (
              <Link
                href={`/activities/${activityId}/exam/take`}
                className="flex-1 md:flex-initial bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again ({remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} left)
              </Link>
            ) : (
              <button
                disabled
                className="flex-1 md:flex-initial bg-gray-300 text-gray-500 font-medium py-3 px-6 rounded-lg text-center cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                No Attempts Left
              </button>
            )}

            {/* View Leaderboard */}
            {showLeaderboard && (
              <Link
                href={`/activities/${activityId}/exam/leaderboard`}
                className="flex-1 md:flex-initial bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                View Leaderboard
              </Link>
            )}
          </div>

          {/* Share Results (if passed) */}
          {passed && (
            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-600 mb-3">Share your achievement!</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {}}
                  className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Twitter
                </button>
                <button
                  onClick={() => {}}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Facebook
                </button>
                <button
                  onClick={() => {}}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
