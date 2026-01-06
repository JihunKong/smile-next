'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExamTimer } from '@/components/modes/ExamTimer'
import { TabSwitchWarning } from '@/components/modes/TabSwitchWarning'
import { useAntiCheat, type AntiCheatStats } from '@/hooks/useAntiCheat'
import { saveExamAnswer, submitExamAttempt, updateExamCheatingStats } from '../actions'

interface Question {
  id: string
  content: string
  choices: string[]
}

interface ExamTakeClientProps {
  activityId: string
  activityName: string
  attemptId: string
  questions: Question[]
  existingAnswers: Record<string, string[]>
  remainingSeconds: number
}

export function ExamTakeClient({
  activityId,
  activityName,
  attemptId,
  questions,
  existingAnswers,
  remainingSeconds,
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

  const { stats: antiCheatStats, isWarningVisible, dismissWarning, handlePaste } = useAntiCheat({
    enabled: true,
    onStatsChange: handleStatsChange,
    preventPaste: true,
    showWarningOnTabSwitch: true,
  })

  const currentQuestion = questions[currentIndex]

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const result = await submitExamAttempt(attemptId)

    if (result.success && result.data) {
      setResults(result.data)
      setShowResults(true)
    } else {
      alert(result.error || 'Failed to submit exam')
    }

    setIsSubmitting(false)
  }, [attemptId, isSubmitting])

  async function handleAnswerChange(choice: string) {
    const newAnswers = { ...answers }

    if (!newAnswers[currentQuestion.id]) {
      newAnswers[currentQuestion.id] = []
    }

    // Toggle selection (single choice for now)
    if (newAnswers[currentQuestion.id].includes(choice)) {
      newAnswers[currentQuestion.id] = newAnswers[currentQuestion.id].filter((c) => c !== choice)
    } else {
      newAnswers[currentQuestion.id] = [choice] // Single choice
    }

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

  const answeredCount = Object.keys(answers).filter((qId) => answers[qId]?.length > 0).length

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            results.passed ? 'bg-green-100' : 'bg-red-100'
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
              className="block w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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
            <p className="text-sm text-gray-500">Exam</p>
            <h1 className="font-semibold text-gray-900">{activityName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <ExamTimer
              totalSeconds={remainingSeconds}
              onTimeUp={handleSubmit}
              size="md"
            />

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2"
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
                'Submit Exam'
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h2 className="font-medium text-gray-900 mb-3">Questions</h2>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const isAnswered = answers[q.id]?.length > 0
                  const isCurrent = index === currentIndex

                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(index)}
                      className={`
                        w-8 h-8 rounded-lg text-sm font-medium transition
                        ${isCurrent
                          ? 'bg-red-600 text-white'
                          : isAnswered
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                      `}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                <p>{answeredCount} of {questions.length} answered</p>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Question Content */}
              <div className="mb-6 question-content" data-testid="question">
                <p className="text-lg text-gray-900 whitespace-pre-wrap">{currentQuestion.content}</p>
              </div>

              {/* Choices */}
              <div className="space-y-3">
                {currentQuestion.choices.map((choice, choiceIndex) => {
                  const isSelected = answers[currentQuestion.id]?.includes(choice)
                  const letter = String.fromCharCode(65 + choiceIndex) // A, B, C, D...

                  return (
                    <button
                      key={choiceIndex}
                      onClick={() => handleAnswerChange(choice)}
                      data-testid="answer-option"
                      role="radio"
                      aria-checked={isSelected}
                      className={`
                        w-full text-left p-4 rounded-lg border-2 transition
                        ${isSelected
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0
                          ${isSelected ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}
                        `}>
                          {letter}
                        </span>
                        <span className="text-gray-800">{choice}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <button
                  onClick={goNext}
                  disabled={currentIndex === questions.length - 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
