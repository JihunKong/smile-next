'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExamTimer } from '@/components/modes/ExamTimer'
import { TabSwitchWarning } from '@/components/modes/TabSwitchWarning'
import { useAntiCheat, type AntiCheatStats } from '@/hooks/useAntiCheat'
import { saveCaseResponse, submitCaseAttempt, updateCaseCheatingStats } from '../actions'
import type { CaseScenario } from '@/types/activities'

interface ScenarioResponse {
  issues: string
  solution: string
}

interface CaseTakeClientProps {
  activityId: string
  activityName: string
  attemptId: string
  scenarios: CaseScenario[]
  timePerCase: number
  totalTimeLimit: number
  passThreshold: number
  savedResponses: Record<string, ScenarioResponse>
  startedAt: string
}

export function CaseTakeClient({
  activityId,
  activityName,
  attemptId,
  scenarios,
  timePerCase,
  totalTimeLimit,
  passThreshold,
  savedResponses: initialResponses,
  startedAt,
}: CaseTakeClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, ScenarioResponse>>(initialResponses)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<{
    totalScore: number
    passed: boolean
    scenarioScores: Array<{ scenarioId: string; title: string; score: number; feedback: string }>
  } | null>(null)

  // Anti-cheating hook
  const lastSyncedStats = useRef<AntiCheatStats | null>(null)

  const handleStatsChange = useCallback(
    async (stats: AntiCheatStats) => {
      // Only sync if there are new events
      if (
        lastSyncedStats.current &&
        stats.events.length === lastSyncedStats.current.events.length
      ) {
        return
      }

      // Get new events since last sync
      const lastEventCount = lastSyncedStats.current?.events.length || 0
      const newEvents = stats.events.slice(lastEventCount)

      if (newEvents.length > 0) {
        await updateCaseCheatingStats(attemptId, {
          tabSwitchCount: stats.tabSwitchCount,
          copyAttempts: stats.copyAttempts,
          pasteAttempts: stats.pasteAttempts,
          cheatingFlags: newEvents.map((e) => ({ type: e.type, timestamp: e.timestamp })),
        })
      }

      lastSyncedStats.current = stats
    },
    [attemptId]
  )

  const { stats: antiCheatStats, isWarningVisible, dismissWarning } = useAntiCheat({
    enabled: true,
    onStatsChange: handleStatsChange,
    preventPaste: false, // Allow paste for case study since they're writing solutions
    showWarningOnTabSwitch: true,
  })

  // Calculate remaining time based on when attempt started
  const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  const totalSeconds = totalTimeLimit * 60
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

  const currentScenario = scenarios[currentIndex]
  const currentResponse = responses[currentScenario?.id] || { issues: '', solution: '' }

  const handleTimeUp = useCallback(() => {
    handleSubmit()
  }, [])

  async function handleSaveResponse() {
    if (!currentScenario) return

    const response = responses[currentScenario.id]
    if (response) {
      await saveCaseResponse(attemptId, currentScenario.id, response)
    }
  }

  function updateResponse(field: 'issues' | 'solution', value: string) {
    if (!currentScenario) return

    setResponses((prev) => ({
      ...prev,
      [currentScenario.id]: {
        ...prev[currentScenario.id],
        [field]: value,
      },
    }))
  }

  async function handleNext() {
    await handleSaveResponse()
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  async function handlePrevious() {
    await handleSaveResponse()
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)

    // Save current response first
    await handleSaveResponse()

    const result = await submitCaseAttempt(attemptId)

    if (result.success && result.data) {
      setResults(result.data)
      setShowResults(true)
    } else {
      alert(result.error || 'Failed to submit')
    }

    setIsSubmitting(false)
  }

  function getScoreColor(score: number): string {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getCompletionCount(): number {
    return Object.values(responses).filter(
      (r) => r.issues.trim().length > 0 || r.solution.trim().length > 0
    ).length
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            results.passed ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {results.passed ? (
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          <h1 className={`text-2xl font-bold text-center mb-2 ${results.passed ? 'text-green-600' : 'text-yellow-600'}`}>
            {results.passed ? 'Excellent Work!' : 'Good Effort!'}
          </h1>

          <p className="text-gray-600 text-center mb-6">
            You completed the case study with an average score of {results.totalScore.toFixed(1)}.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: results.passed ? '#16a34a' : '#ca8a04' }}>
              {results.totalScore.toFixed(1)} / 10
            </div>
            <div className="text-gray-600">Overall Score</div>
          </div>

          {/* Scenario Results */}
          <div className="space-y-4 mb-6">
            <h2 className="font-semibold text-gray-900">Scenario Scores</h2>
            {results.scenarioScores.map((scenario, index) => (
              <div key={scenario.scenarioId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">
                    {index + 1}. {scenario.title}
                  </span>
                  <span className={`text-xl font-bold ${getScoreColor(scenario.score)}`}>
                    {scenario.score.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{scenario.feedback}</p>
              </div>
            ))}
          </div>

          <Link
            href={`/activities/${activityId}`}
            className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition"
          >
            Back to Activity
          </Link>
        </div>
      </div>
    )
  }

  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No scenarios available for this case study.</p>
          <Link
            href={`/activities/${activityId}`}
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to Activity
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Anti-Cheat Warning Modal */}
      <TabSwitchWarning
        isVisible={isWarningVisible}
        onDismiss={dismissWarning}
        tabSwitchCount={antiCheatStats.tabSwitchCount}
        maxWarnings={3}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Case Study Mode</p>
            <h1 className="font-semibold text-gray-900">{activityName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Scenario {currentIndex + 1} of {scenarios.length}
            </div>

            <ExamTimer
              totalSeconds={remainingSeconds}
              onTimeUp={handleTimeUp}
              size="md"
            />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {scenarios.map((scenario, index) => {
            const hasResponse = responses[scenario.id]?.issues || responses[scenario.id]?.solution
            return (
              <button
                key={scenario.id}
                onClick={async () => {
                  await handleSaveResponse()
                  setCurrentIndex(index)
                }}
                className={`flex-1 h-2 rounded-full transition ${
                  index === currentIndex
                    ? 'bg-green-600'
                    : hasResponse
                    ? 'bg-green-300'
                    : 'bg-gray-300'
                }`}
                title={`Scenario ${index + 1}: ${scenario.title}`}
              />
            )
          })}
        </div>

        {/* Scenario Card */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-700 rounded-full font-bold">
                {currentIndex + 1}
              </span>
              <h2 className="text-xl font-semibold text-gray-900">{currentScenario.title}</h2>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{currentScenario.content}</p>
            </div>
          </div>

          {/* Response Forms */}
          <div className="p-6 space-y-6">
            {/* Issues */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identify the Key Issues
              </label>
              <textarea
                name="issues"
                value={currentResponse.issues}
                onChange={(e) => updateResponse('issues', e.target.value)}
                placeholder="What are the main problems or challenges in this scenario?"
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {currentResponse.issues.length} / 2000 characters
              </div>
            </div>

            {/* Solution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Propose Your Solution
              </label>
              <textarea
                name="solution"
                value={currentResponse.solution}
                onChange={(e) => updateResponse('solution', e.target.value)}
                placeholder="How would you address these issues? What steps would you take?"
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {currentResponse.solution.length} / 2000 characters
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="text-sm text-gray-500">
            {getCompletionCount()} of {scenarios.length} scenarios started
          </div>

          {currentIndex < scenarios.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Case Study
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
