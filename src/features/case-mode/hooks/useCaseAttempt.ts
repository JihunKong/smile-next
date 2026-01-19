'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { saveCaseResponse, submitCaseAttempt } from '@/app/(dashboard)/activities/[id]/case/actions'
import type { CaseScenario, ScenarioResponse } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface UseCaseAttemptOptions {
  activityId: string
  attemptId: string
  scenarios: CaseScenario[]
  timePerCase: number
  totalTimeLimit: number
  initialResponses: Record<string, ScenarioResponse>
  startedAt: string
}

export interface UseCaseAttemptReturn {
  // Navigation
  currentIndex: number
  currentScenario: CaseScenario | undefined
  goToNext: () => Promise<void>
  goToPrevious: () => Promise<void>
  goToIndex: (index: number) => Promise<void>

  // Responses
  responses: Record<string, ScenarioResponse>
  currentResponse: ScenarioResponse
  updateResponse: (field: 'issues' | 'solution', value: string) => void

  // Timers
  caseTimeRemaining: number
  totalTimeRemaining: number
  formatTime: (seconds: number) => string

  // Submission
  isSubmitting: boolean
  showEvaluating: boolean
  evaluationProgress: number
  evaluationMessage: string
  submit: () => Promise<void>
  confirmSubmit: () => void

  // UI State
  showAutoSubmitModal: boolean
  handleAutoSubmitContinue: () => void
  showSaveToast: boolean
}

// ============================================================================
// Evaluation Messages
// ============================================================================

const EVALUATION_MESSAGES = {
  initial: 'AI가 4가지 기준으로 응답을 분석하고 있습니다...',
  criticalThinking: '비판적 사고 깊이를 분석하고 있습니다...',
  realWorld: '실제 적용 가능성을 평가하고 있습니다...',
  finalizing: '최종 평가 점수를 계산하고 있습니다...',
  complete: '평가 완료! 결과 페이지로 이동합니다...',
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCaseAttempt(options: UseCaseAttemptOptions): UseCaseAttemptReturn {
  const {
    activityId,
    attemptId,
    scenarios,
    timePerCase,
    totalTimeLimit,
    initialResponses,
    startedAt,
  } = options

  const router = useRouter()

  // Navigation state
  const [currentIndex, setCurrentIndex] = useState(0)

  // Response state
  const [responses, setResponses] = useState<Record<string, ScenarioResponse>>(initialResponses)

  // Timer state
  const [caseTimeRemaining, setCaseTimeRemaining] = useState(timePerCase * 60)
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0)
  const caseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEvaluating, setShowEvaluating] = useState(false)
  const [evaluationProgress, setEvaluationProgress] = useState(0)
  const [evaluationMessage, setEvaluationMessage] = useState(EVALUATION_MESSAGES.initial)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // UI state
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)

  // Current scenario and response
  const currentScenario = scenarios[currentIndex]
  const currentResponse = responses[currentScenario?.id] || { issues: '', solution: '' }

  // ============================================================================
  // Timer Effects
  // ============================================================================

  // Calculate initial total time remaining
  useEffect(() => {
    const elapsedSeconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    const totalSeconds = totalTimeLimit * 60
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    setTotalTimeRemaining(remaining)
  }, [startedAt, totalTimeLimit])

  // Total timer countdown
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Case timer countdown (resets when moving between scenarios)
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

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // ============================================================================
  // Response Management
  // ============================================================================

  const saveCurrentResponse = useCallback(async () => {
    if (!currentScenario) return

    const response = responses[currentScenario.id]
    if (response && (response.issues || response.solution)) {
      await saveCaseResponse(attemptId, currentScenario.id, response)
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 2000)
    }
  }, [attemptId, currentScenario, responses])

  const updateResponse = useCallback(
    (field: 'issues' | 'solution', value: string) => {
      if (!currentScenario) return

      setResponses((prev) => ({
        ...prev,
        [currentScenario.id]: {
          ...prev[currentScenario.id],
          [field]: value,
        },
      }))
    },
    [currentScenario]
  )

  // ============================================================================
  // Navigation
  // ============================================================================

  const goToNext = useCallback(async () => {
    await saveCurrentResponse()
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }, [currentIndex, scenarios.length, saveCurrentResponse])

  const goToPrevious = useCallback(async () => {
    await saveCurrentResponse()
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex, saveCurrentResponse])

  const goToIndex = useCallback(
    async (index: number) => {
      await saveCurrentResponse()
      setCurrentIndex(index)
    },
    [saveCurrentResponse]
  )

  // ============================================================================
  // Submission
  // ============================================================================

  const startEvaluationProgress = useCallback(() => {
    let progress = 0
    progressIntervalRef.current = setInterval(() => {
      if (progress < 90) {
        const increment = Math.max(0.5, (90 - progress) / 20)
        progress = Math.min(90, progress + increment)
        setEvaluationProgress(progress)

        // Update message based on progress
        if (progress >= 30 && progress < 60) {
          setEvaluationMessage(EVALUATION_MESSAGES.criticalThinking)
        } else if (progress >= 60 && progress < 85) {
          setEvaluationMessage(EVALUATION_MESSAGES.realWorld)
        } else if (progress >= 85) {
          setEvaluationMessage(EVALUATION_MESSAGES.finalizing)
        }
      }
    }, 500)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    // Save current response first
    await saveCurrentResponse()

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
    setEvaluationMessage(EVALUATION_MESSAGES.complete)

    if (result.success) {
      setTimeout(() => {
        router.push(`/activities/${activityId}/case/results?attempt=${attemptId}`)
      }, 800)
    } else {
      alert(result.error || 'Failed to submit')
      setShowEvaluating(false)
      setIsSubmitting(false)
    }
  }, [activityId, attemptId, isSubmitting, router, saveCurrentResponse, startEvaluationProgress])

  const confirmSubmit = useCallback(() => {
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
  }, [handleSubmit, responses, scenarios])

  // ============================================================================
  // Auto-Submit Modal Handler
  // ============================================================================

  const handleAutoSubmitContinue = useCallback(() => {
    setShowAutoSubmitModal(false)
    if (currentIndex < scenarios.length - 1) {
      saveCurrentResponse()
      setCurrentIndex(currentIndex + 1)
    } else {
      handleSubmit()
    }
  }, [currentIndex, scenarios.length, saveCurrentResponse, handleSubmit])

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Navigation
    currentIndex,
    currentScenario,
    goToNext,
    goToPrevious,
    goToIndex,

    // Responses
    responses,
    currentResponse,
    updateResponse,

    // Timers
    caseTimeRemaining,
    totalTimeRemaining,
    formatTime,

    // Submission
    isSubmitting,
    showEvaluating,
    evaluationProgress,
    evaluationMessage,
    submit: handleSubmit,
    confirmSubmit,

    // UI State
    showAutoSubmitModal,
    handleAutoSubmitContinue,
    showSaveToast,
  }
}
