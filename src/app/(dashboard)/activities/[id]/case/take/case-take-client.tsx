'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  groupName: string
  attemptId: string
  scenarios: CaseScenario[]
  timePerCase: number
  totalTimeLimit: number
  passThreshold: number
  maxAttempts: number
  attemptsUsed: number
  savedResponses: Record<string, ScenarioResponse>
  startedAt: string
  instructions?: string
}

// Grading Rubric Component (Flask-style 4 criteria)
function GradingRubric({ passThreshold }: { passThreshold: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-white border border-indigo-200 rounded-lg shadow-sm mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors rounded-lg"
      >
        <div className="flex items-center">
          <svg className="w-5 h-5 text-indigo-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="font-semibold text-gray-900">Grading Rubric - How You&apos;ll Be Evaluated</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-indigo-200 p-4">
          <p className="text-sm text-gray-600 mb-4">
            Your responses will be scored on these 4 criteria (0-10 points each). Your final score is the average across all criteria.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Understanding */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">1. Understanding the Case Issue</h4>
                  <p className="text-sm text-gray-700">
                    Did you correctly identify the core problems and flaws in the scenario? Do you understand the implications and underlying issues?
                  </p>
                </div>
              </div>
            </div>

            {/* Ingenuity */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-purple-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">2. Ingenuity in Solution Suggestion</h4>
                  <p className="text-sm text-gray-700">
                    How creative and practical are your proposed solutions? Do they address root causes with innovative, well-thought-out approaches?
                  </p>
                </div>
              </div>
            </div>

            {/* Critical Thinking */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">3. Critical Thinking Depth</h4>
                  <p className="text-sm text-gray-700">
                    How deeply did you analyze the situation? Did you consider multiple perspectives and show logical, evidence-based reasoning?
                  </p>
                </div>
              </div>
            </div>

            {/* Real-World Application */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">4. Real-World Application</h4>
                  <p className="text-sm text-gray-700">
                    How practical and applicable are your suggestions? Did you consider implementation challenges and real-world contexts?
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-sm text-indigo-900">
              <svg className="w-4 h-4 text-indigo-600 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <strong>Pass Threshold:</strong> You need an average score of <span className="font-semibold">{passThreshold.toFixed(1)}</span> or higher across all 4 criteria to pass this activity.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Auto-Submit Warning Modal
function AutoSubmitModal({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md text-center">
        <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Time Expired!</h3>
        <p className="text-gray-600 mb-4">
          The time limit for this case has been reached. Your current responses will be auto-saved.
        </p>
        <button
          onClick={onContinue}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg"
          style={{ backgroundColor: '#4f46e5' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// Evaluating Screen Component
function EvaluatingScreen({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluating Your Responses</h2>
      <p className="text-gray-600 mb-4">{message}</p>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-indigo-600">{Math.floor(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          AI evaluation in progress
        </p>
      </div>
    </div>
  )
}

// Save Toast Component
function SaveToast({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      자동 저장됨
    </div>
  )
}

export function CaseTakeClient({
  activityId,
  activityName,
  groupName,
  attemptId,
  scenarios,
  timePerCase,
  totalTimeLimit,
  passThreshold,
  maxAttempts,
  attemptsUsed,
  savedResponses: initialResponses,
  startedAt,
  instructions,
}: CaseTakeClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, ScenarioResponse>>(initialResponses)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false)
  const [showEvaluating, setShowEvaluating] = useState(false)
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [evaluationMessage, setEvaluationMessage] = useState('AI가 4가지 기준으로 응답을 분석하고 있습니다...')
  const [showSaveToast, setShowSaveToast] = useState(false)

  // Timer state
  const [caseTimeRemaining, setCaseTimeRemaining] = useState(timePerCase * 60)
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0)
  const caseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Anti-cheating hook
  const lastSyncedStats = useRef<AntiCheatStats | null>(null)

  const handleStatsChange = useCallback(
    async (stats: AntiCheatStats) => {
      if (
        lastSyncedStats.current &&
        stats.events.length === lastSyncedStats.current.events.length
      ) {
        return
      }

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

  const { stats: antiCheatStats } = useAntiCheat({
    enabled: true,
    onStatsChange: handleStatsChange,
    preventPaste: false,
    showWarningOnTabSwitch: true,
  })

  // Calculate initial time remaining
  useEffect(() => {
    const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    const totalSeconds = totalTimeLimit * 60
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    setTotalTimeRemaining(remaining)
  }, [startedAt, totalTimeLimit])

  // Total timer effect
  useEffect(() => {
    if (totalTimeRemaining <= 0) return

    totalTimerRef.current = setInterval(() => {
      setTotalTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(totalTimerRef.current!)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current)
    }
  }, [])

  // Case timer effect
  useEffect(() => {
    setCaseTimeRemaining(timePerCase * 60)

    caseTimerRef.current = setInterval(() => {
      setCaseTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(caseTimerRef.current!)
          setShowAutoSubmitModal(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (caseTimerRef.current) clearInterval(caseTimerRef.current)
    }
  }, [currentIndex, timePerCase])

  const currentScenario = scenarios[currentIndex]
  const currentResponse = responses[currentScenario?.id] || { issues: '', solution: '' }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  async function handleSaveResponse() {
    if (!currentScenario) return

    const response = responses[currentScenario.id]
    if (response && (response.issues || response.solution)) {
      await saveCaseResponse(attemptId, currentScenario.id, response)
      // Show save toast
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 2000)
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

  function handleAutoSubmitContinue() {
    setShowAutoSubmitModal(false)
    if (currentIndex < scenarios.length - 1) {
      handleSaveResponse()
      setCurrentIndex(currentIndex + 1)
    } else {
      handleSubmit()
    }
  }

  function startEvaluationProgress() {
    let progress = 0
    progressIntervalRef.current = setInterval(() => {
      if (progress < 90) {
        const increment = Math.max(0.5, (90 - progress) / 20)
        progress = Math.min(90, progress + increment)
        setEvaluationProgress(progress)

        if (progress >= 30 && progress < 60) {
          setEvaluationMessage('비판적 사고 깊이를 분석하고 있습니다...')
        } else if (progress >= 60 && progress < 85) {
          setEvaluationMessage('실제 적용 가능성을 평가하고 있습니다...')
        } else if (progress >= 85) {
          setEvaluationMessage('최종 평가 점수를 계산하고 있습니다...')
        }
      }
    }, 500)
  }

  async function handleSubmit() {
    if (isSubmitting) return
    setIsSubmitting(true)

    // Save current response first
    await handleSaveResponse()

    // Show evaluating screen
    setShowEvaluating(true)
    startEvaluationProgress()

    // Clear timers
    if (caseTimerRef.current) clearInterval(caseTimerRef.current)
    if (totalTimerRef.current) clearInterval(totalTimerRef.current)

    const result = await submitCaseAttempt(attemptId)

    // Complete progress
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    setEvaluationProgress(100)
    setEvaluationMessage('평가 완료! 결과 페이지로 이동합니다...')

    if (result.success) {
      setTimeout(() => {
        router.push(`/activities/${activityId}/case/results?attempt=${attemptId}`)
      }, 800)
    } else {
      alert(result.error || 'Failed to submit')
      setShowEvaluating(false)
      setIsSubmitting(false)
    }
  }

  function confirmSubmit() {
    const incomplete = scenarios.filter((scenario) => {
      const resp = responses[scenario.id]
      return !resp?.issues?.trim() || !resp?.solution?.trim()
    })

    if (incomplete.length > 0) {
      if (!confirm(`${incomplete.length}개의 케이스에 미완성 응답이 있습니다. 그래도 제출하시겠습니까?`)) {
        return
      }
    }

    if (confirm('모든 케이스를 제출하시겠습니까? 제출 후에는 응답을 수정할 수 없습니다.')) {
      handleSubmit()
    }
  }

  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4">이 케이스 학습에 사용 가능한 시나리오가 없습니다.</p>
          <Link
            href={`/activities/${activityId}`}
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            활동으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Anti-cheating CSS */}
      <style jsx global>{`
        .case-scenario-content,
        .scenario-text,
        .case-content,
        #caseTitle,
        #caseDomain,
        #caseContent {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }

        textarea,
        input[type="text"] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `}</style>

      {/* Auto-Submit Warning Modal */}
      {showAutoSubmitModal && <AutoSubmitModal onContinue={handleAutoSubmitContinue} />}

      {/* Save Toast */}
      <SaveToast show={showSaveToast} />

      {/* Sticky Header with Timer */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/activities/${activityId}`}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <p className="text-xs text-indigo-600 font-medium">케이스 학습 모드</p>
                <h1 className="font-semibold text-gray-900 truncate max-w-xs">{activityName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Case Progress */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium text-indigo-600">{currentIndex + 1}</span>
                <span>/</span>
                <span>{scenarios.length}</span>
                <span className="text-gray-400">케이스</span>
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                caseTimeRemaining <= 60 ? 'bg-red-100' : 'bg-indigo-100'
              }`}>
                <svg className={`w-4 h-4 ${caseTimeRemaining <= 60 ? 'text-red-600' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`font-bold ${caseTimeRemaining <= 60 ? 'text-red-600' : 'text-indigo-700'}`}>
                  {formatTime(caseTimeRemaining)}
                </span>
              </div>

              {/* Total Time */}
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                <span>전체:</span>
                <span className="font-medium">{formatTime(totalTimeRemaining)}</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={confirmSubmit}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-4 rounded-lg text-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">제출하기</span>
              </button>
            </div>
          </div>

          {/* Progress Bar in Header */}
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div
              className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Instructions Card - Collapsible */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 rounded-lg p-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">케이스 학습 안내</h3>
              {instructions && (
                <div className="bg-white border border-indigo-100 rounded p-3 mb-3 text-sm text-gray-700">
                  <p className="whitespace-pre-wrap">{instructions}</p>
                </div>
              )}
              <div className="text-sm text-indigo-800 space-y-1">
                <p>
                  <span className="font-semibold">{scenarios.length}개</span>의 비즈니스 케이스 시나리오를 분석합니다.
                </p>
                <ul className="list-disc ml-5 text-indigo-700">
                  <li>시나리오의 핵심 문제점을 파악하세요</li>
                  <li>구체적이고 실행 가능한 해결책을 제시하세요</li>
                  <li>케이스별 제한 시간: <span className="font-semibold">{timePerCase}분</span></li>
                  <li>4가지 기준으로 평가됩니다 (이해도, 창의성, 비판적 사고, 실제 적용)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Grading Rubric */}
        <GradingRubric passThreshold={passThreshold} />

        {/* Evaluating Screen */}
        {showEvaluating ? (
          <EvaluatingScreen progress={evaluationProgress} message={evaluationMessage} />
        ) : (
          <>
            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Case <span className="text-indigo-600">{currentIndex + 1}</span> of <span>{scenarios.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time:{' '}
                    <span className={`font-bold ${caseTimeRemaining <= 60 ? 'text-red-600' : 'text-indigo-600'}`}>
                      {formatTime(caseTimeRemaining)}
                    </span>
                  </div>
                  <button
                    onClick={confirmSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                    style={{ backgroundColor: '#059669' }}
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit All Cases
                  </button>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Case Content */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 case-scenario-content">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="caseTitle" className="text-2xl font-bold text-gray-900 scenario-text">
                    {currentScenario.title}
                  </h2>
                  {currentScenario.domain && (
                    <span id="caseDomain" className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {currentScenario.domain}
                    </span>
                  )}
                </div>
                <div
                  id="caseContent"
                  className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap case-content"
                >
                  {currentScenario.content}
                </div>
              </div>

              {/* Response Form */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  분석 작성
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. 이 시나리오의 핵심 문제점은 무엇인가요?
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={currentResponse.issues}
                    onChange={(e) => updateResponse('issues', e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    rows={6}
                    placeholder="비즈니스 케이스에서 발견된 구체적인 문제점, 윤리적 이슈, 논리적 결함 등을 설명하세요..."
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">문제가 왜 문제인지 구체적으로 설명하세요.</p>
                    <span className={`text-xs ${currentResponse.issues.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
                      {currentResponse.issues.length} / 2000자
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2. 어떤 해결책을 제안하시나요?
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={currentResponse.solution}
                    onChange={(e) => updateResponse('solution', e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    rows={6}
                    placeholder="파악한 문제를 해결하기 위한 구체적이고 실행 가능한 해결책을 제시하세요..."
                    maxLength={2000}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">실제로 구현 가능한 실용적인 해결책에 집중하세요.</p>
                    <span className={`text-xs ${currentResponse.solution.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
                      {currentResponse.solution.length} / 2000자
                    </span>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    이전 케이스
                  </button>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    자동 저장 중
                  </div>
                  <button
                    onClick={currentIndex === scenarios.length - 1 ? confirmSubmit : handleNext}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: '#4f46e5' }}
                  >
                    {currentIndex === scenarios.length - 1 ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        전체 검토
                      </>
                    ) : (
                      <>
                        다음 케이스
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Case Navigator */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">케이스 빠른 이동</h3>
              <div className="flex gap-2 flex-wrap">
                {scenarios.map((scenario, index) => {
                  const hasResponse = responses[scenario.id]?.issues || responses[scenario.id]?.solution
                  return (
                    <button
                      key={scenario.id}
                      onClick={async () => {
                        await handleSaveResponse()
                        setCurrentIndex(index)
                      }}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                        index === currentIndex
                          ? 'bg-indigo-600 text-white'
                          : hasResponse
                          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
