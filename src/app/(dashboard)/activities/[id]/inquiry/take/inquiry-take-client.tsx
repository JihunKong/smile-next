'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ExamTimer } from '@/components/modes/ExamTimer'
import { TabSwitchWarning } from '@/components/modes/TabSwitchWarning'
import { useAntiCheat, type AntiCheatStats } from '@/hooks/useAntiCheat'
import { submitInquiryQuestion, completeInquiryAttempt, updateInquiryCheatingStats } from '../actions'

interface SubmittedQuestion {
  id: string
  content: string
  score: number | null
  bloomsLevel: string | null
  feedback: string | null
  evaluationStatus?: 'pending' | 'evaluating' | 'completed' | 'error'
}

interface InquiryTakeClientProps {
  activityId: string
  activityName: string
  attemptId: string
  questionsRequired: number
  timePerQuestion: number
  keywordPool1: string[]
  keywordPool2: string[]
  passThreshold: number
  submittedQuestions: SubmittedQuestion[]
}

export function InquiryTakeClient({
  activityId,
  activityName,
  attemptId,
  questionsRequired,
  timePerQuestion,
  keywordPool1,
  keywordPool2,
  passThreshold,
  submittedQuestions: initialQuestions,
}: InquiryTakeClientProps) {
  const router = useRouter()
  const t = useTranslations('inquiry')
  const [submittedQuestions, setSubmittedQuestions] = useState<SubmittedQuestion[]>(initialQuestions)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [finalResults, setFinalResults] = useState<{
    passed: boolean
    averageScore: number
    questionsGenerated: number
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
        await updateInquiryCheatingStats(attemptId, {
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
    preventPaste: false, // Allow paste for inquiry since they're generating questions
    showWarningOnTabSwitch: true,
  })

  const questionsRemaining = questionsRequired - submittedQuestions.length
  const isComplete = questionsRemaining <= 0

  const handleTimeUp = useCallback(() => {
    if (currentQuestion.trim()) {
      handleSubmitQuestion()
    } else {
      // Skip this question
      setTimerKey((k) => k + 1)
    }
  }, [currentQuestion])

  async function handleSubmitQuestion() {
    if (!currentQuestion.trim() || isSubmitting) return

    setIsSubmitting(true)

    // Add question immediately with "evaluating" status
    const tempQuestion: SubmittedQuestion = {
      id: `temp-${Date.now()}`,
      content: currentQuestion,
      score: null,
      bloomsLevel: null,
      feedback: null,
      evaluationStatus: 'evaluating',
    }
    setSubmittedQuestions((prev) => [...prev, tempQuestion])
    const questionContent = currentQuestion
    setCurrentQuestion('')
    setTimerKey((k) => k + 1) // Reset timer

    const result = await submitInquiryQuestion(attemptId, questionContent)

    if (result.success && result.data) {
      // Update the question with real data
      const updatedQuestion: SubmittedQuestion = {
        id: result.data.questionId,
        content: questionContent,
        score: result.data.evaluation?.score || null,
        bloomsLevel: result.data.evaluation?.bloomsLevel || null,
        feedback: result.data.evaluation?.feedback || null,
        evaluationStatus: result.data.evaluation ? 'completed' : 'pending',
      }
      setSubmittedQuestions((prev) =>
        prev.map((q) => (q.id === tempQuestion.id ? updatedQuestion : q))
      )
    } else {
      // Mark as error and show error feedback
      setSubmittedQuestions((prev) =>
        prev.map((q) =>
          q.id === tempQuestion.id
            ? { ...q, evaluationStatus: 'error', feedback: result.error || 'Submission failed' }
            : q
        )
      )
    }

    setIsSubmitting(false)
  }

  async function handleComplete() {
    setIsSubmitting(true)

    const result = await completeInquiryAttempt(attemptId)

    if (result.success && result.data) {
      setFinalResults(result.data)
      setShowResults(true)
    } else {
      alert(result.error || 'Failed to complete')
    }

    setIsSubmitting(false)
  }

  function getScoreColor(score: number | null): string {
    if (score === null) return 'text-gray-500'
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getBloomsBadgeColor(level: string | null): string {
    const colors: Record<string, string> = {
      remember: 'bg-gray-100 text-gray-700',
      understand: 'bg-blue-100 text-blue-700',
      apply: 'bg-green-100 text-green-700',
      analyze: 'bg-yellow-100 text-yellow-700',
      evaluate: 'bg-orange-100 text-orange-700',
      create: 'bg-purple-100 text-purple-700',
    }
    return colors[level || ''] || 'bg-gray-100 text-gray-700'
  }

  function getBloomsLabel(level: string | null): string {
    if (!level) return t('blooms.evaluating')
    const key = level.toLowerCase() as 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
    return t(`blooms.${key}`)
  }

  function getBloomsDescription(level: string | null): string {
    if (!level) return ''
    const key = level.toLowerCase() as 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
    return t(`blooms.descriptions.${key}`)
  }

  if (showResults && finalResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${finalResults.passed ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
            {finalResults.passed ? (
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          <h1 className={`text-2xl font-bold mb-2 ${finalResults.passed ? 'text-green-600' : 'text-yellow-600'}`}>
            {finalResults.passed ? t('results.greatJob') : t('results.goodEffort')}
          </h1>

          <p className="text-gray-600 mb-6">
            {t('results.summary', { count: finalResults.questionsGenerated, score: finalResults.averageScore.toFixed(1) })}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-4xl font-bold mb-2" style={{ color: finalResults.passed ? '#16a34a' : '#ca8a04' }}>
              {finalResults.averageScore.toFixed(1)} / 10
            </div>
            <div className="text-gray-600">{t('results.averageScore')}</div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/activities/${activityId}/inquiry/${attemptId}/results`}
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t('results.viewResults')}
            </Link>
            <Link
              href={`/activities/${activityId}`}
              className="block w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              {t('results.backToActivity')}
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
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">{t('header.mode')}</p>
              <h1 className="font-semibold text-gray-900">{activityName}</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {t('header.progress', { current: Math.min(submittedQuestions.length + 1, questionsRequired), total: questionsRequired })}
              </div>

              {!isComplete && (
                <ExamTimer
                  key={timerKey}
                  totalSeconds={timePerQuestion}
                  onTimeUp={handleTimeUp}
                  size="md"
                />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(submittedQuestions.length / questionsRequired) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{t('status.completed', { count: submittedQuestions.length })}</span>
            <span>{t('status.remaining', { count: questionsRemaining })}</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Keyword Pools */}
        {(keywordPool1.length > 0 || keywordPool2.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="font-medium text-gray-800">{t('keywords.hint')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keywordPool1.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                    {t('keywords.concepts')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywordPool1.map((kw, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentQuestion((prev) => prev + (prev ? ' ' : '') + kw)}
                        className="px-3 py-1 bg-white text-yellow-800 rounded-full text-sm font-medium border border-yellow-300 hover:bg-yellow-200 hover:border-yellow-400 transition cursor-pointer"
                        title={t('keywords.clickToAdd')}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {keywordPool2.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-2 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    {t('keywords.actions')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {keywordPool2.map((kw, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentQuestion((prev) => prev + (prev ? ' ' : '') + kw)}
                        className="px-3 py-1 bg-white text-orange-800 rounded-full text-sm font-medium border border-orange-300 hover:bg-orange-200 hover:border-orange-400 transition cursor-pointer"
                        title={t('keywords.clickToAdd')}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('keywords.tip')}
            </p>
          </div>
        )}

        {/* Question Input */}
        {!isComplete && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t('input.title')}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {t('input.description')}
            </p>

            <textarea
              name="question"
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder={t('input.placeholder')}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition resize-none"
            />

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {t('input.charCount', { count: currentQuestion.length })}
                </span>
                {currentQuestion.length > 20 && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('input.canSubmit')}
                  </span>
                )}
              </div>
              <button
                onClick={handleSubmitQuestion}
                disabled={!currentQuestion.trim() || isSubmitting}
                className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('submit.submitting')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t('submit.button')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Submitted Questions */}
        {submittedQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('submitted.title', { count: submittedQuestions.length, total: questionsRequired })}
              </h2>
              {submittedQuestions.length > 0 && (
                <div className="text-sm text-gray-500">
                  {t('submitted.averageScore')}{' '}
                  <span className="font-semibold text-gray-900">
                    {(
                      submittedQuestions
                        .filter((q) => q.score !== null)
                        .reduce((sum, q) => sum + (q.score || 0), 0) /
                      (submittedQuestions.filter((q) => q.score !== null).length || 1)
                    ).toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {submittedQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className={`border rounded-lg p-4 transition-all ${q.evaluationStatus === 'evaluating'
                      ? 'border-yellow-300 bg-yellow-50 animate-pulse'
                      : q.evaluationStatus === 'error'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                          Q{index + 1}
                        </span>
                        {q.evaluationStatus === 'evaluating' && (
                          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium flex items-center gap-1">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t('submitted.evaluating')}
                          </span>
                        )}
                        {q.evaluationStatus === 'error' && (
                          <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium">
                            {t('submitted.error')}
                          </span>
                        )}
                        {q.bloomsLevel && q.evaluationStatus !== 'evaluating' && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium capitalize ${getBloomsBadgeColor(q.bloomsLevel)}`}
                            title={getBloomsDescription(q.bloomsLevel)}
                          >
                            {getBloomsLabel(q.bloomsLevel)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800">{q.content}</p>
                      {q.feedback && q.evaluationStatus !== 'evaluating' && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{q.feedback}</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right min-w-[60px]">
                      {q.evaluationStatus === 'evaluating' ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
                          <p className="text-xs text-yellow-600 mt-1">{t('score.evaluating')}</p>
                        </div>
                      ) : q.evaluationStatus === 'error' ? (
                        <div className="flex flex-col items-center">
                          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-red-600 mt-1">{t('submitted.error')}</p>
                        </div>
                      ) : (
                        <>
                          <span className={`text-2xl font-bold ${getScoreColor(q.score)}`}>
                            {q.score !== null ? q.score.toFixed(1) : '-'}
                          </span>
                          <p className="text-xs text-gray-500">{t('score.outOf')}</p>
                          {q.score !== null && (
                            <div className={`mt-1 text-xs font-medium ${getScoreColor(q.score)}`}>
                              {q.score >= 8 ? t('feedback.excellent') : q.score >= 6 ? t('feedback.good') : t('feedback.needsImprovement')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Complete Button */}
            {isComplete && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-800 font-medium mb-2">
                    {t('complete.title')}
                  </p>
                  <p className="text-sm text-green-600 mb-4">
                    {t('complete.description', { count: questionsRequired })}
                  </p>
                  <button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2 mx-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('complete.processing')}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {t('complete.button')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
