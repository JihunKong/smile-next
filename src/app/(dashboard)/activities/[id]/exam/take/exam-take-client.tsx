'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAntiCheat, type AntiCheatStats } from '@/hooks/useAntiCheat'
import { saveExamAnswer, submitExamAttempt, updateExamCheatingStats } from '../actions'
import {
  type ExamTakeClientProps,
  useExamAttempt,
  ExamTimer,
  QuestionNav,
  QuestionDisplay,
  ExamNavButtons,
  SubmitConfirmModal,
  ExamStyles,
  EmptyQuestionsMessage,
  TabSwitchWarning,
  SubmitExamButton,
} from '@/features/exam-mode'

/**
 * ExamTakeClient Component
 *
 * Main client component for the exam taking experience.
 * Refactored to use feature module hooks and components.
 *
 * @see VIBE-0010
 */
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
  const [showConfirmModal, setShowConfirmModal] = useState(false)

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

  // Use the exam attempt orchestrator hook
  const exam = useExamAttempt({
    attemptId,
    activityId,
    questions,
    existingAnswers,
    remainingSeconds: initialRemainingSeconds,
    timeLimitMinutes,
    choiceShuffles,
    saveAnswer: async (attemptId, questionId, answer) => {
      await saveExamAnswer(attemptId, questionId, answer)
    },
    submitExam: async (attemptId) => {
      const result = await submitExamAttempt(attemptId)
      if (result.success && result.data) {
        router.push(`/activities/${activityId}/exam/${attemptId}/results`)
      }
      return result
    },
  })

  // Confirm submission with extra confirmation for safety
  function confirmSubmit() {
    if (confirm('Are you absolutely sure you want to submit your exam? This action cannot be undone.')) {
      setShowConfirmModal(false)
      exam.handleSubmit()
    }
  }

  // Handle case when no questions are available
  if (questions.length === 0 || !exam.currentQuestion) {
    return <EmptyQuestionsMessage activityId={activityId} />
  }

  const currentChoiceShuffle = exam.getChoiceShuffle(exam.currentQuestion.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <ExamStyles />

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
        answeredCount={exam.answeredCount}
        totalQuestions={questions.length}
        flaggedCount={exam.navigation.flaggedQuestions.size}
        remainingTime={exam.timer.formattedTime}
        isSubmitting={exam.isSubmitting}
      />

      {/* Tab Switch Warning */}
      {isWarningVisible && (
        <TabSwitchWarning
          tabSwitchCount={antiCheatStats.tabSwitchCount}
          onDismiss={dismissWarning}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Timer Header (fixed at top) */}
        {timeLimitMinutes > 0 && (
          <>
            <ExamTimer
              formattedTime={exam.timer.formattedTime}
              remainingSeconds={exam.timer.remainingSeconds}
              timerPercentage={exam.timer.timerPercentage}
              isWarning={exam.timer.isWarning}
              isCritical={exam.timer.isCritical}
              questionNumber={exam.questionNumber}
              totalQuestions={questions.length}
            />
            {/* Spacer for fixed timer */}
            <div style={{ height: '120px' }} />
          </>
        )}

        {/* Progress Tracking */}
        <QuestionNav
          questions={questions}
          currentIndex={exam.navigation.currentIndex}
          answers={exam.answers}
          flaggedQuestions={exam.navigation.flaggedQuestions}
          onSelectQuestion={exam.navigation.goToQuestion}
        />

        {/* Question Card */}
        <QuestionDisplay
          question={exam.currentQuestion}
          questionNumber={exam.questionNumber}
          totalQuestions={questions.length}
          selectedAnswer={exam.currentAnswer}
          choiceShuffle={currentChoiceShuffle}
          isFlagged={exam.navigation.isFlagged(exam.currentQuestion.id)}
          onSelectAnswer={(originalIndex) =>
            exam.setAnswer(exam.currentQuestion!.id, originalIndex)
          }
          onToggleFlag={() => exam.navigation.toggleFlag(exam.currentQuestion!.id)}
        />

        {/* Navigation */}
        <ExamNavButtons
          isFirstQuestion={exam.navigation.isFirstQuestion}
          isLastQuestion={exam.navigation.isLastQuestion}
          answeredCount={exam.answeredCount}
          totalQuestions={questions.length}
          onPrevious={exam.navigation.prevQuestion}
          onNext={exam.navigation.nextQuestion}
          onSubmit={() => setShowConfirmModal(true)}
        />

        {/* Submit Button - Always visible */}
        <SubmitExamButton onClick={() => setShowConfirmModal(true)} />
      </div>
    </div>
  )
}
