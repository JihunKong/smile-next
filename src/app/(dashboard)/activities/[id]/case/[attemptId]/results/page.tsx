import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { CaseSettings, CaseScenario } from '@/types/activities'

interface CaseResultsPageProps {
  params: Promise<{ id: string; attemptId: string }>
}

interface ScenarioEvaluation {
  score: number
  feedback: string
  understanding: number
  ingenuity: number
  criticalThinking: number
  realWorldApplication: number
  strengths?: string[]
  improvements?: string[]
}

interface ScenarioResponse {
  issues: string
  solution: string
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreBgColor(score: number): string {
  if (score >= 8) return 'bg-green-100'
  if (score >= 6) return 'bg-yellow-100'
  return 'bg-red-100'
}

function getBarColor(score: number): string {
  if (score >= 8) return 'bg-green-500'
  if (score >= 6) return 'bg-yellow-500'
  return 'bg-red-500'
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export default async function CaseResultsPage({ params }: CaseResultsPageProps) {
  const { id: activityId, attemptId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Fetch attempt with related data
  const attempt = await prisma.caseAttempt.findUnique({
    where: { id: attemptId },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          openModeSettings: true,
          owningGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!attempt || attempt.userId !== session.user.id) {
    notFound()
  }

  if (attempt.status !== 'completed') {
    redirect(`/activities/${activityId}/case/take?attempt=${attemptId}`)
  }

  // Parse settings
  const caseSettings = (attempt.activity.openModeSettings as unknown as CaseSettings) || {
    scenarios: [],
    timePerCase: 10,
    totalTimeLimit: 60,
    maxAttempts: 1,
    passThreshold: 6.0,
  }

  // Get all completed attempts for attempt count
  const allAttempts = await prisma.caseAttempt.findMany({
    where: {
      userId: session.user.id,
      activityId,
      status: 'completed',
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  const attemptNumber = allAttempts.findIndex((a) => a.id === attemptId) + 1
  const attemptsRemaining = caseSettings.maxAttempts - allAttempts.length
  const canRetry = attemptsRemaining > 0 && !attempt.passed

  // Parse responses and scenario scores
  const responses = (attempt.responses as unknown as Record<string, ScenarioResponse>) || {}
  const scenarioScores = (attempt.scenarioScores as unknown as Record<string, ScenarioEvaluation>) || {}

  // Calculate average scores for 4 criteria
  const avgScores = {
    understanding: 0,
    ingenuity: 0,
    criticalThinking: 0,
    realWorld: 0,
  }

  let scoreCount = 0
  caseSettings.scenarios.forEach((scenario: CaseScenario) => {
    const evaluation = scenarioScores[scenario.id]
    if (evaluation) {
      avgScores.understanding += evaluation.understanding || 0
      avgScores.ingenuity += evaluation.ingenuity || 0
      avgScores.criticalThinking += evaluation.criticalThinking || 0
      avgScores.realWorld += evaluation.realWorldApplication || 0
      scoreCount++
    }
  })

  if (scoreCount > 0) {
    avgScores.understanding /= scoreCount
    avgScores.ingenuity /= scoreCount
    avgScores.criticalThinking /= scoreCount
    avgScores.realWorld /= scoreCount
  }

  // Calculate time spent
  const timeSpentSeconds = attempt.timeSpentSeconds ||
    (attempt.completedAt
      ? Math.floor((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : 0)

  const completedDate = attempt.completedAt?.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/activities/${activityId}/case`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Activity
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold">Case Activity Results</h1>
          </div>
          <p className="text-white/80">
            {attempt.activity.name} - {attempt.activity.owningGroup.name}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Overall Score Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Overall Score</h2>
              <p className="text-sm text-gray-600 mt-1">
                Attempt completed on {completedDate}
              </p>
            </div>
            <div className="text-center">
              {attempt.passed ? (
                <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg">
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold text-xl">PASSED</p>
                </div>
              ) : (
                <div className="bg-red-100 text-red-800 px-6 py-3 rounded-lg">
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold text-xl">NOT PASSED</p>
                </div>
              )}
            </div>
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-indigo-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Score</p>
              <p className={`text-5xl font-bold ${getScoreColor(attempt.totalScore || 0)}`}>
                {(attempt.totalScore || 0).toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-2">out of 10.0</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-2">Pass Threshold</p>
              <p className="text-3xl font-bold text-gray-700">{caseSettings.passThreshold.toFixed(1)}</p>
              <p className="text-sm text-gray-500 mt-2">required to pass</p>
            </div>
          </div>

          {/* Time Info */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time: <span className="font-semibold">{formatDuration(timeSpentSeconds)}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Cases: <span className="font-semibold">{caseSettings.scenarios.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Attempt: <span className="font-semibold">{attemptNumber} of {caseSettings.maxAttempts}</span>
            </div>
          </div>
        </div>

        {/* 4-Criteria Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Evaluation Criteria Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Understanding */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                  Understanding
                </h3>
                <div className={`text-2xl font-bold ${getScoreColor(avgScores.understanding)}`}>
                  {avgScores.understanding.toFixed(1)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Understanding the Case Issue</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(avgScores.understanding)}`}
                  style={{ width: `${avgScores.understanding * 10}%` }}
                />
              </div>
            </div>

            {/* Ingenuity */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Ingenuity
                </h3>
                <div className={`text-2xl font-bold ${getScoreColor(avgScores.ingenuity)}`}>
                  {avgScores.ingenuity.toFixed(1)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Ingenuity in Solution Suggestion</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(avgScores.ingenuity)}`}
                  style={{ width: `${avgScores.ingenuity * 10}%` }}
                />
              </div>
            </div>

            {/* Critical Thinking */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Critical Thinking
                </h3>
                <div className={`text-2xl font-bold ${getScoreColor(avgScores.criticalThinking)}`}>
                  {avgScores.criticalThinking.toFixed(1)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Critical Thinking Depth</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(avgScores.criticalThinking)}`}
                  style={{ width: `${avgScores.criticalThinking * 10}%` }}
                />
              </div>
            </div>

            {/* Real-World Application */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Real-World Application
                </h3>
                <div className={`text-2xl font-bold ${getScoreColor(avgScores.realWorld)}`}>
                  {avgScores.realWorld.toFixed(1)}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Real-World Application</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(avgScores.realWorld)}`}
                  style={{ width: `${avgScores.realWorld * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Individual Case Responses */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Your Responses & Feedback
          </h2>

          <div className="space-y-6">
            {caseSettings.scenarios.map((scenario: CaseScenario, index: number) => {
              const studentResponse = responses[scenario.id] || { issues: '', solution: '' }
              const evaluation = scenarioScores[scenario.id] || {
                score: 0,
                feedback: 'No evaluation available',
                understanding: 0,
                ingenuity: 0,
                criticalThinking: 0,
                realWorldApplication: 0,
                strengths: [],
                improvements: [],
              }

              return (
                <div key={scenario.id} className="border rounded-lg p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Case {index + 1}: {scenario.title}
                    </h3>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {scenario.domain || 'General'}
                    </span>
                  </div>

                  {/* Scenario Content */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Scenario:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{scenario.content}</p>
                  </div>

                  {/* Your Responses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Your Identified Flaws:</p>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {studentResponse.issues || <em className="text-gray-500">No response</em>}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Your Proposed Solutions:</p>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {studentResponse.solution || <em className="text-gray-500">No response</em>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Evaluation Feedback */}
                  <div className="space-y-3 mb-4">
                    {/* Strengths */}
                    {evaluation.strengths && evaluation.strengths.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          What Was Done Well:
                        </p>
                        <ul className="text-sm text-green-800 space-y-1">
                          {evaluation.strengths.map((strength: string, i: number) => (
                            <li key={i}>- {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {evaluation.improvements && evaluation.improvements.length > 0 && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          What Could Improve:
                        </p>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {evaluation.improvements.map((improvement: string, i: number) => (
                            <li key={i}>- {improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* General Feedback */}
                    {evaluation.feedback && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Suggestions for Real-World Application:
                        </p>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{evaluation.feedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Individual Scores */}
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    <div className={`text-center p-3 rounded ${getScoreBgColor(evaluation.understanding)}`}>
                      <p className="text-xs text-gray-600 mb-1">Understanding</p>
                      <p className={`text-lg font-bold ${getScoreColor(evaluation.understanding)}`}>
                        {evaluation.understanding?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div className={`text-center p-3 rounded ${getScoreBgColor(evaluation.ingenuity)}`}>
                      <p className="text-xs text-gray-600 mb-1">Ingenuity</p>
                      <p className={`text-lg font-bold ${getScoreColor(evaluation.ingenuity)}`}>
                        {evaluation.ingenuity?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div className={`text-center p-3 rounded ${getScoreBgColor(evaluation.criticalThinking)}`}>
                      <p className="text-xs text-gray-600 mb-1">Critical Thinking</p>
                      <p className={`text-lg font-bold ${getScoreColor(evaluation.criticalThinking)}`}>
                        {evaluation.criticalThinking?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <div className={`text-center p-3 rounded ${getScoreBgColor(evaluation.realWorldApplication)}`}>
                      <p className="text-xs text-gray-600 mb-1">Real-World</p>
                      <p className={`text-lg font-bold ${getScoreColor(evaluation.realWorldApplication)}`}>
                        {evaluation.realWorldApplication?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/activities/${activityId}/case/attempts`}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View All Attempts
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/activities/${activityId}/case/leaderboard`}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Leaderboard
            </Link>

            {canRetry && (
              <Link
                href={`/activities/${activityId}/case/take`}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center gap-2"
                style={{ backgroundColor: '#4f46e5' }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retake ({attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} left)
              </Link>
            )}

            <Link
              href={`/activities/${activityId}`}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition"
            >
              Back to Activity
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
