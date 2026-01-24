---
id: VIBE-0004D
title: Exam Take Experience Refactor (Hooks & Components)
status: done
priority: critical
category: refactoring
component: ui
created: 2026-01-23
updated: 2026-01-23
effort: l
assignee: ai-agent
parent: VIBE-0004
---

# Exam Take Experience Refactor

## Summary

Refactor the massive `exam-take-client.tsx` (730 lines) into focused hooks and components. This is the most complex file in Exam Mode, containing timer logic, question navigation, answer management, and anti-cheat integration.

## Current State

`exam/take/exam-take-client.tsx` (730 lines) contains:
- Timer countdown with warning states (lines 151-220)
- Question navigation state machine (lines 261-314)  
- Answer saving with debounce (lines 268-280)
- Flag/bookmark functionality (lines 298-308)
- Submit confirmation modal (lines 30-149)
- Anti-cheat hook integration (lines 151-260)
- Complex inline JSX (~400 lines)

## Target Architecture

```
src/features/exam-mode/
├── components/
│   ├── take/
│   │   ├── ExamTimer.tsx            (~80 lines)  - Countdown with warnings
│   │   ├── QuestionNav.tsx          (~100 lines) - Question dots/buttons
│   │   ├── QuestionDisplay.tsx      (~120 lines) - Question + choices
│   │   ├── AnswerChoice.tsx         (~60 lines)  - Single choice option
│   │   ├── ExamProgress.tsx         (~50 lines)  - Progress bar
│   │   ├── ExamHeader.tsx           (~80 lines)  - Header with timer, nav
│   │   ├── SubmitConfirmModal.tsx   (~100 lines) - Submit confirmation
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useExamAttempt.ts            (~180 lines) - Take experience state
│   ├── useExamTimer.ts              (~80 lines)  - Timer logic
│   ├── useExamNavigation.ts         (~60 lines)  - Question navigation
│   └── index.ts
└── index.ts
```

## Acceptance Criteria

### Hooks Extraction

- [ ] Create `useExamTimer` hook:
  - Countdown from initialSeconds
  - Warning state when < threshold
  - Auto-submit on time up
  - Pause/resume capability (for dialogs)
  - Format time as MM:SS
- [ ] Create `useExamNavigation` hook:
  - Current question index
  - goToQuestion, nextQuestion, prevQuestion
  - Flagged questions set
  - toggleFlag function
- [ ] Create `useExamAttempt` hook (orchestrator):
  - Combines timer and navigation
  - Answer state management
  - Save answer to server (debounced)
  - Submit exam function
  - Loading/error states
- [ ] Write unit tests for all hooks

### Component Extraction

- [ ] Create `ExamTimer` component:
  - Displays MM:SS countdown
  - Warning styling when time low
  - Pulsing animation at critical time
- [ ] Create `QuestionNav` component:
  - Question number buttons/dots
  - Answered indicator (filled)
  - Flagged indicator (star/flag icon)
  - Current question highlight
- [ ] Create `QuestionDisplay` component:
  - Question text
  - Choice list as AnswerChoice components
  - Selected answer highlighting
- [ ] Create `AnswerChoice` component:
  - Single choice button
  - Selected state styling
  - Click handler
- [ ] Create `SubmitConfirmModal` component:
  - Summary stats (answered, flagged, time)
  - Confirm/cancel buttons
  - Loading state during submit
- [ ] Create `ExamProgress` component:
  - Progress bar: answered/total
  - Percentage text
- [ ] `exam-take-client.tsx` reduced to <120 lines
- [ ] All component files under 150 lines

### Shared Timer Component

- [ ] Create `src/features/shared/components/ActivityTimer.tsx`:
  - Reusable across Exam, Case, Inquiry modes
  - Props: totalSeconds, onTimeUp, warningThreshold
  - Can be used by VIBE-0009 (Inquiry Mode)

## Technical Approach

### 1. useExamTimer Hook

```typescript
// src/features/exam-mode/hooks/useExamTimer.ts
import { useState, useEffect, useCallback } from 'react'

interface UseExamTimerOptions {
  initialSeconds: number
  warningThreshold?: number  // Default 60 seconds
  onTimeUp: () => void
}

interface UseExamTimerReturn {
  remainingSeconds: number
  isWarning: boolean
  isCritical: boolean
  isPaused: boolean
  formattedTime: string
  pause: () => void
  resume: () => void
}

export function useExamTimer({
  initialSeconds,
  warningThreshold = 60,
  onTimeUp,
}: UseExamTimerOptions): UseExamTimerReturn {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [isPaused, setIsPaused] = useState(false)
  
  useEffect(() => {
    if (isPaused || remaining <= 0) return
    
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          onTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isPaused, remaining, onTimeUp])
  
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [])
  
  return {
    remainingSeconds: remaining,
    isWarning: remaining <= warningThreshold && remaining > 30,
    isCritical: remaining <= 30,
    isPaused,
    formattedTime: formatTime(remaining),
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
  }
}
```

### 2. useExamAttempt Hook

```typescript
// src/features/exam-mode/hooks/useExamAttempt.ts
import { useState, useCallback, useRef } from 'react'
import { saveExamAnswer, submitExamAttempt } from '../../../app/(dashboard)/activities/[id]/exam/actions'
import { useExamTimer } from './useExamTimer'
import { useExamNavigation } from './useExamNavigation'
import type { Question, ExamTakeClientProps } from '../types'

export function useExamAttempt(props: ExamTakeClientProps) {
  const {
    attemptId,
    questions,
    existingAnswers,
    remainingSeconds,
    choiceShuffles,
  } = props
  
  // Answer state
  const [answers, setAnswers] = useState<Record<string, string[]>>(existingAnswers)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Navigation hook
  const navigation = useExamNavigation(questions.length)
  
  // Timer hook
  const timer = useExamTimer({
    initialSeconds: remainingSeconds,
    onTimeUp: handleSubmit,
  })
  
  // Current question
  const currentQuestion = questions[navigation.currentIndex]
  const currentAnswer = answers[currentQuestion?.id] || []
  
  // Save answer with debounce
  const setAnswer = useCallback(async (choiceIndex: number) => {
    const questionId = currentQuestion.id
    const newAnswers = { ...answers, [questionId]: [String(choiceIndex)] }
    setAnswers(newAnswers)
    
    // Clear pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        await saveExamAnswer(attemptId, questionId, [String(choiceIndex)])
      } finally {
        setSaving(false)
      }
    }, 500)
  }, [answers, attemptId, currentQuestion])
  
  // Submit exam
  async function handleSubmit() {
    setSubmitting(true)
    timer.pause()
    
    try {
      const result = await submitExamAttempt(attemptId)
      // Router push handled in component
      return result
    } finally {
      setSubmitting(false)
    }
  }
  
  return {
    // State
    currentQuestion,
    currentAnswer,
    answers,
    answeredCount: Object.keys(answers).length,
    
    // Actions
    setAnswer,
    submitExam: handleSubmit,
    
    // Status
    saving,
    submitting,
    
    // Timer
    timer,
    
    // Navigation
    ...navigation,
  }
}
```

### 3. Simplified Take Client

```typescript
// exam/take/exam-take-client.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAntiCheat } from '@/hooks/useAntiCheat'
import { useExamAttempt } from '@/features/exam-mode/hooks'
import {
  ExamHeader,
  QuestionNav,
  QuestionDisplay,
  SubmitConfirmModal,
} from '@/features/exam-mode/components'
import type { ExamTakeClientProps } from '@/features/exam-mode/types'

export function ExamTakeClient(props: ExamTakeClientProps) {
  const router = useRouter()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Anti-cheat integration
  const antiCheat = useAntiCheat(props.attemptId)
  
  // Exam state management
  const exam = useExamAttempt(props)
  
  const handleSubmitConfirm = async () => {
    const result = await exam.submitExam()
    router.push(`/activities/${props.activityId}/exam/${props.attemptId}/results`)
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header with timer and progress */}
      <ExamHeader
        activityName={props.activityName}
        timer={exam.timer}
        answeredCount={exam.answeredCount}
        totalQuestions={props.totalQuestions}
      />
      
      {/* Question navigation dots */}
      <QuestionNav
        totalQuestions={props.totalQuestions}
        currentIndex={exam.currentIndex}
        answeredQuestions={Object.keys(exam.answers)}
        flaggedQuestions={exam.flaggedQuestions}
        onSelect={exam.goToQuestion}
      />
      
      {/* Current question display */}
      <QuestionDisplay
        question={exam.currentQuestion}
        questionNumber={exam.currentIndex + 1}
        selectedAnswer={exam.currentAnswer}
        onSelectAnswer={exam.setAnswer}
        choiceShuffle={props.choiceShuffles?.[exam.currentQuestion.id]}
      />
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={exam.prevQuestion}
          disabled={exam.currentIndex === 0}
          className="btn btn-secondary"
        >
          Previous
        </button>
        
        <button
          onClick={exam.toggleFlag}
          className="btn btn-ghost"
        >
          {exam.isCurrentFlagged ? 'Unflag' : 'Flag for Review'}
        </button>
        
        {exam.currentIndex === props.totalQuestions - 1 ? (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn btn-primary"
          >
            Submit Exam
          </button>
        ) : (
          <button onClick={exam.nextQuestion} className="btn btn-primary">
            Next
          </button>
        )}
      </div>
      
      {/* Submit confirmation modal */}
      <SubmitConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmitConfirm}
        answeredCount={exam.answeredCount}
        totalQuestions={props.totalQuestions}
        flaggedCount={exam.flaggedQuestions.size}
        remainingTime={exam.timer.formattedTime}
        isSubmitting={exam.submitting}
      />
    </div>
  )
}
```

## Verification

```bash
# Run hook unit tests
npm run test:unit -- tests/unit/hooks/exam-mode

# Run component tests
npm run test:unit -- tests/unit/components/exam-mode

# Run E2E tests (critical!)
npm run test:e2e -- tests/e2e/modes/exam.spec.ts

# Type check
npx tsc --noEmit
```

## Related Files

- `src/app/(dashboard)/activities/[id]/exam/take/exam-take-client.tsx` - Target file
- `src/app/(dashboard)/activities/[id]/exam/take/page.tsx` - Server component wrapper
- `src/hooks/useAntiCheat.ts` - Existing anti-cheat hook
- `src/features/case-mode/hooks/useCaseAttempt.ts` - Reference implementation

## Dependencies

**Blocked By:**
- VIBE-0004A (Unit Tests) - server action tests
- VIBE-0004B (Types & Foundation) - types needed
- VIBE-0004C (Results & Analytics) - shares component patterns

**Blocks:**
- VIBE-0009 (Inquiry Mode) - can reuse timer component

## Notes

- This is the most complex refactoring in VIBE-0004
- Anti-cheat hook should remain as separate concern
- Timer component should be shared - put in `features/shared/`
- Debounced save is critical for UX - maintain same behavior
- E2E tests are critical validation - run frequently during refactor

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created - Take experience is largest, most complex file |
