'use client'

import { useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { TabSwitchWarning } from '@/components/modes/TabSwitchWarning'
import { useAntiCheat, type AntiCheatStats } from '@/hooks/useAntiCheat'
import {
  useInquiryAttempt,
  InquiryTakeHeader,
  KeywordPools,
  QuestionInput,
  SubmittedQuestionsList,
  InquiryCompletionModal,
  type SubmittedQuestion,
  type InquiryCompletionResult,
} from '@/features/inquiry-mode'
import { updateInquiryCheatingStats } from '../actions'

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
  const t = useTranslations('inquiry')
  const [showResults, setShowResults] = useState(false)
  const [finalResults, setFinalResults] = useState<InquiryCompletionResult | null>(null)

  // Use the inquiry attempt hook
  const {
    currentQuestion,
    submittedQuestions,
    isSubmitting,
    timerKey,
    isComplete,
    questionsRemaining,
    setCurrentQuestion,
    submitQuestion,
    completeAttempt,
    addKeyword,
    incrementTimerKey,
  } = useInquiryAttempt({
    attemptId,
    activityId,
    questionsRequired,
    passThreshold,
    initialQuestions,
  })

  // Anti-cheating
  const lastSyncedStats = useRef<AntiCheatStats | null>(null)

  const handleStatsChange = useCallback(
    async (stats: AntiCheatStats) => {
      if (lastSyncedStats.current && stats.events.length === lastSyncedStats.current.events.length) {
        return
      }
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
    preventPaste: false,
    showWarningOnTabSwitch: true,
  })

  const handleTimeUp = useCallback(() => {
    if (currentQuestion.trim()) {
      submitQuestion()
    } else {
      incrementTimerKey()
    }
  }, [currentQuestion, submitQuestion, incrementTimerKey])

  async function handleComplete() {
    const result = await completeAttempt()
    if (result) {
      setFinalResults(result)
      setShowResults(true)
    } else {
      alert(t('complete.error'))
    }
  }

  // Completion modal
  if (showResults && finalResults) {
    return (
      <InquiryCompletionModal
        result={finalResults}
        activityId={activityId}
        attemptId={attemptId}
        labels={{
          greatJob: t('results.greatJob'),
          goodEffort: t('results.goodEffort'),
          summary: t('results.summary', { count: finalResults.questionsGenerated, score: finalResults.averageScore.toFixed(1) }),
          averageScore: t('results.averageScore'),
          viewResults: t('results.viewResults'),
          backToActivity: t('results.backToActivity'),
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TabSwitchWarning
        isVisible={isWarningVisible}
        onDismiss={dismissWarning}
        tabSwitchCount={antiCheatStats.tabSwitchCount}
        maxWarnings={3}
      />

      <InquiryTakeHeader
        activityName={activityName}
        currentQuestion={Math.min(submittedQuestions.length + 1, questionsRequired)}
        totalQuestions={questionsRequired}
        questionsCompleted={submittedQuestions.length}
        timePerQuestion={timePerQuestion}
        timerKey={timerKey}
        isComplete={isComplete}
        onTimeUp={handleTimeUp}
        labels={{
          mode: t('header.mode'),
          progress: t('header.progress', { current: '{current}', total: '{total}' }),
          completed: t('status.completed', { count: '{count}' }),
          remaining: t('status.remaining', { count: '{count}' }),
        }}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <KeywordPools
          keywordPool1={keywordPool1}
          keywordPool2={keywordPool2}
          onKeywordClick={addKeyword}
          labels={{
            hint: t('keywords.hint'),
            concepts: t('keywords.concepts'),
            actions: t('keywords.actions'),
            tip: t('keywords.tip'),
          }}
        />

        {!isComplete && (
          <QuestionInput
            value={currentQuestion}
            onChange={setCurrentQuestion}
            onSubmit={submitQuestion}
            isSubmitting={isSubmitting}
            labels={{
              title: t('input.title'),
              description: t('input.description'),
              placeholder: t('input.placeholder'),
              charCount: t('input.charCount', { count: '{count}' }),
              canSubmit: t('input.canSubmit'),
              submitting: t('submit.submitting'),
              submit: t('submit.button'),
            }}
          />
        )}

        <SubmittedQuestionsList
          questions={submittedQuestions}
          questionsRequired={questionsRequired}
          isComplete={isComplete}
          isSubmitting={isSubmitting}
          onComplete={handleComplete}
          labels={{
            title: t('submitted.title', { count: '{count}', total: '{total}' }),
            averageScore: t('submitted.averageScore'),
            card: {
              evaluating: t('submitted.evaluating'),
              error: t('submitted.error'),
              outOf: t('score.outOf'),
              excellent: t('feedback.excellent'),
              good: t('feedback.good'),
              needsImprovement: t('feedback.needsImprovement'),
            },
            complete: {
              title: t('complete.title'),
              description: t('complete.description', { count: '{count}' }),
              processing: t('complete.processing'),
              button: t('complete.button'),
            },
          }}
        />
      </div>
    </div>
  )
}
