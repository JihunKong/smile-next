import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type {
  CaseSettings,
  CaseScenario,
  ScenarioEvaluation,
  ScenarioResponse,
} from '@/features/case-mode'
import {
  EvaluationBreakdown,
  CaseResultCard,
  getScoreColor,
} from '@/features/case-mode'

interface CaseResultsPageProps {
  params: Promise<{ id: string; attemptId: string }>
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
          owningGroup: { select: { id: true, name: true } },
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
    where: { userId: session.user.id, activityId, status: 'completed' },
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
  const avgScores = { understanding: 0, ingenuity: 0, criticalThinking: 0, realWorld: 0 }
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
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href={`/activities/${activityId}/case`} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
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
          <p className="text-white/80">{attempt.activity.name} - {attempt.activity.owningGroup.name}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Overall Score Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Overall Score</h2>
              <p className="text-sm text-gray-600 mt-1">Attempt completed on {completedDate}</p>
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
          <EvaluationBreakdown {...avgScores} />
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
            {caseSettings.scenarios.map((scenario: CaseScenario, index: number) => (
              <CaseResultCard
                key={scenario.id}
                scenario={scenario}
                response={responses[scenario.id] || { issues: '', solution: '' }}
                evaluation={scenarioScores[scenario.id] || {
                  score: 0, feedback: 'No evaluation available',
                  understanding: 0, ingenuity: 0, criticalThinking: 0, realWorldApplication: 0,
                  strengths: [], improvements: [],
                }}
                index={index}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href={`/activities/${activityId}/case/attempts`} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View All Attempts
          </Link>

          <div className="flex items-center gap-3">
            <Link href={`/activities/${activityId}/case/leaderboard`} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Leaderboard
            </Link>

            {canRetry && (
              <Link href={`/activities/${activityId}/case/take`} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center gap-2" style={{ backgroundColor: '#4f46e5' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retake ({attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} left)
              </Link>
            )}

            <Link href={`/activities/${activityId}`} className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition">
              Back to Activity
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
