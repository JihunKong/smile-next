'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAntiCheat, type AntiCheatStats } from '@/hooks/useAntiCheat'
import { saveExamAnswer, submitExamAttempt, updateExamCheatingStats } from '../actions'
import type { Question, ExamTakeClientProps } from '@/features/exam-mode'

// Submit Confirmation Modal Component
function SubmitConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  totalQuestions,
  flaggedCount,
  remainingTime,
  isSubmitting,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  answeredCount: number
  totalQuestions: number
  flaggedCount: number
  remainingTime: string
  isSubmitting: boolean
}) {
  const unansweredCount = totalQuestions - answeredCount

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[99999]"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 animate-modal-appear">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Exam?</h2>
          <p className="text-gray-600">Are you sure you want to submit? This action cannot be undone.</p>
        </div>

        {/* Unanswered Questions Warning Banner */}
        {unansweredCount > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-yellow-800">Warning: Unanswered Questions</p>
                <p className="text-sm text-yellow-700">
                  You have <span className="font-bold">{unansweredCount}</span> unanswered question(s).
                  <strong> They will be marked as incorrect.</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submission Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Questions:</span>
            <span className="font-semibold">{totalQuestions}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Answered:</span>
            <span className="font-semibold text-green-600">{answeredCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Unanswered:</span>
            <span className="font-semibold text-red-600">{unansweredCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Flagged for Review:</span>
            <span className="font-semibold text-yellow-600">{flaggedCount}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mb-6">
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Time Remaining: <span className="font-semibold">{remainingTime}</span>
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all pulse-grow disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {unansweredCount > 0 ? `Submit with ${unansweredCount} Unanswered` : 'Submit'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ExamTakeClient({
  activityId,
  activityName,
  groupName,
  attemptId,
  questions,
  existingAnswers,
  remainingSeconds: initialRemainingSeconds,
  totalQuestions,
  timeLimitMinutes,
  instructions,
  description,
  choiceShuffles = {},
}: ExamTakeClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>(existingAnswers)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<{
    score: number
    passed: boolean
    correctAnswers: number
    totalQuestions: number
  } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
        await updateExamCheatingStats(attemptId, {
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
    preventPaste: true,
    showWarningOnTabSwitch: true,
  })

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Ensure currentIndex is within valid range
  const safeCurrentIndex = Math.min(currentIndex, questions.length - 1)
  const currentQuestion = questions.length > 0 ? questions[safeCurrentIndex] : null

  // Auto-correct currentIndex if out of bounds
  useEffect(() => {
    if (questions.length > 0 && currentIndex >= questions.length) {
      setCurrentIndex(questions.length - 1)
    }
  }, [currentIndex, questions.length])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const result = await submitExamAttempt(attemptId)

    if (result.success && result.data) {
      // Redirect to the detailed results page
      router.push(`/activities/${activityId}/exam/${attemptId}/results`)
    } else {
      alert(result.error || 'Failed to submit exam')
      setIsSubmitting(false)
    }
  }, [attemptId, activityId, isSubmitting, router])

  function confirmSubmit() {
    if (confirm('Are you absolutely sure you want to submit your exam? This action cannot be undone.')) {
      setShowConfirmModal(false)
      handleSubmit()
    }
  }

  async function handleAnswerChange(choiceIndex: number) {
    if (!currentQuestion) return

    const newAnswers = { ...answers }

    // Single choice selection - store the index as string
    newAnswers[currentQuestion.id] = [choiceIndex.toString()]

    setAnswers(newAnswers)

    // Auto-save
    await saveExamAnswer(attemptId, currentQuestion.id, newAnswers[currentQuestion.id])
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index)
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  function toggleFlag() {
    if (!currentQuestion) return

    const newFlagged = new Set(flaggedQuestions)
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id)
    } else {
      newFlagged.add(currentQuestion.id)
    }
    setFlaggedQuestions(newFlagged)
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const answeredCount = Object.keys(answers).filter((qId) => answers[qId]?.length > 0).length
  const timerPercentage = timeLimitMinutes > 0 ? (remainingSeconds / (timeLimitMinutes * 60)) * 100 : 100

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${results.passed ? 'bg-green-100' : 'bg-red-100'
            }`}>
            {results.passed ? (
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <h1 className={`text-2xl font-bold mb-2 ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
            {results.passed ? 'Congratulations!' : 'Keep Trying!'}
          </h1>

          <p className="text-gray-600 mb-6">
            {results.passed
              ? 'You have successfully passed the exam.'
              : 'You did not pass this time, but you can try again.'}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-5xl font-bold mb-2" style={{ color: results.passed ? '#16a34a' : '#dc2626' }}>
              {results.score.toFixed(1)}%
            </div>
            <div className="text-gray-600">
              {results.correctAnswers} / {results.totalQuestions} correct
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/activities/${activityId}/exam`}
              className="block w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
              style={{ backgroundColor: '#8C1515' }}
            >
              Back to Exam Overview
            </Link>
            <Link
              href={`/activities/${activityId}`}
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Activity
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Handle case when no questions are available
  if (questions.length === 0 || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-red-100">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-red-600 mb-2">No Questions Available</h1>

          <p className="text-gray-600 mb-6">
            This exam has no questions available. Please contact your instructor.
          </p>

          <div className="space-y-3">
            <Link
              href={`/activities/${activityId}/exam`}
              className="block w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
              style={{ backgroundColor: '#8C1515' }}
            >
              Back to Exam Overview
            </Link>
            <Link
              href={`/activities/${activityId}`}
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Activity
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Anti-cheating CSS */}
      <style jsx global>{`
        /* STRONGEST POSSIBLE: Disable text selection on questions and answers */
        .exam-content,
        .question-text,
        .answer-choice,
        #question-content,
        .choice-text,
        #choices-container,
        #choices-container * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          pointer-events: auto !important;
        }

        /* Prevent drag-and-drop of text */
        .exam-content *,
        .question-text *,
        .answer-choice * {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }

        /* Visual indicator that content is protected */
        .exam-content {
          cursor: default;
        }

        /* Modal animation */
        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out;
        }

        /* Pulse animation for submit button */
        @keyframes pulse-grow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .pulse-grow:not(:disabled) {
          animation: pulse-grow 1s ease-in-out infinite;
        }
      `}</style>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
        answeredCount={answeredCount}
        totalQuestions={questions.length}
        flaggedCount={flaggedQuestions.size}
        remainingTime={formatTime(remainingSeconds)}
        isSubmitting={isSubmitting}
      />

      {/* Tab Switch Warning */}
      {isWarningVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-2">Warning: Tab Switch Detected</h3>
            <p className="text-gray-600 mb-4">
              You have switched tabs {antiCheatStats.tabSwitchCount} time(s).
              This activity is being monitored.
            </p>
            <button
              onClick={dismissWarning}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Timer Header (fixed at top) */}
        {timeLimitMinutes > 0 && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b-4 border-red-500 px-4 py-3">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-xs text-gray-500">Time Remaining</div>
                    <div className={`text-2xl font-bold ${remainingSeconds <= 60 ? 'text-red-600' : 'text-red-600'}`}>
                      {formatTime(remainingSeconds)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Question <span className="font-semibold">{currentIndex + 1}</span> of <span>{questions.length}</span>
                </div>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${timerPercentage < 10 ? 'bg-red-600' : timerPercentage < 25 ? 'bg-yellow-500' : 'bg-red-600'}`}
                  style={{ width: `${timerPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Spacer for fixed timer */}
        {timeLimitMinutes > 0 && <div style={{ height: '120px' }} />}

        {/* Progress Tracking */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">Progress</span>
              <span><span className="font-semibold">{answeredCount}</span> of {questions.length} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Navigator */}
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => {
              const isAnswered = answers[q.id]?.length > 0
              const isFlagged = flaggedQuestions.has(q.id)
              const isCurrent = index === currentIndex

              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-full border-2 transition-colors flex items-center justify-center text-sm font-medium ${isCurrent
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isAnswered
                        ? 'bg-green-500 text-white border-green-600'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-400'
                    }`}
                  title={`Question ${index + 1}${isFlagged ? ' (Flagged)' : ''}`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6 exam-content relative">
          {/* Content Protection Notice */}
          <div className="absolute top-3 right-3 text-xs text-gray-400 opacity-50 pointer-events-none">
            🔒 Content Protected
          </div>

          {/* Question Number Badge */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">{currentIndex + 1}</span>
              </div>
              <span className="text-sm text-gray-500">of {questions.length}</span>
            </div>
            <button
              onClick={toggleFlag}
              className="text-gray-400 hover:text-yellow-500 transition-colors"
            >
              {flaggedQuestions.has(currentQuestion.id) ? (
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              )}
            </button>
          </div>

          {/* Question Content */}
          <div className="mb-8 question-text">
            <p className="text-xl text-gray-900 leading-relaxed" id="question-content">
              {currentQuestion.content}
            </p>
          </div>

          {/* Answer Choices */}
          <div className="space-y-3" id="choices-container">
            {(() => {
              // Get shuffle map for this question, or create default order
              const shuffleMap = choiceShuffles[currentQuestion.id] ||
                Array.from({ length: currentQuestion.choices.length }, (_, i) => i)

              return shuffleMap.map((originalIndex, displayIndex) => {
                const choice = currentQuestion.choices[originalIndex]
                // Check if this original index is in the answers
                const isSelected = answers[currentQuestion.id]?.includes(originalIndex.toString())
                const letter = String.fromCharCode(65 + displayIndex)

                return (
                  <button
                    key={displayIndex}
                    onClick={() => handleAnswerChange(originalIndex)}
                    className={`answer-choice w-full text-left border-2 rounded-lg p-4 cursor-pointer transition-all ${isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                        {isSelected ? (
                          <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : null}
                      </div>
                      <div className="flex-1 choice-text">
                        <span className="font-medium text-gray-900">{letter}.</span>
                        <span className="text-gray-800 ml-2">{choice}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            })()}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex-1 mx-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Progress</p>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{answeredCount} of {questions.length} answered</p>
            </div>

            <button
              onClick={goNext}
              disabled={currentIndex === questions.length - 1}
              className={`font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2 ${currentIndex === questions.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Submit Button - Always visible */}
        <div className="text-center">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg transform transition-all hover:scale-105"
            style={{ backgroundColor: '#8C1515' }}
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit Exam
          </button>
        </div>
      </div>
    </div>
  )
}
