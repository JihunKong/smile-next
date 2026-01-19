---
id: VIBE-0004
title: Refactor Exam Mode pages for AI-friendly development (2498 total lines)
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-17
effort: l
assignee: ai-agent
---

# Refactor Exam Mode Pages for Vibe Coding

## Summary

Exam Mode has **4 mega-files totaling 2,498 lines**. The take experience and analytics pages are particularly complex, containing timer logic, question navigation, and rich data visualizations.

| File | Lines | Purpose |
|------|-------|---------|
| `exam/take/exam-take-client.tsx` | 729 | Student: take exam |
| `exam/analytics/page.tsx` | 621 | Teacher: view analytics |
| `exam/[attemptId]/results/page.tsx` | 574 | Student: view results |
| **Total** | **1,924** | (Exam mode settings in Activity Edit) |

## Current Behavior

- Take experience has complex state machine (question index, answers, timer, submission)
- Analytics has multiple chart types and data processing
- Results page shows question-by-question feedback
- Timer logic duplicated across modes

## Expected Behavior

Shared Exam Mode module:

```
features/exam-mode/
├── components/
│   ├── ExamTimer.tsx           (~80 lines)  - Countdown with warnings
│   ├── QuestionNav.tsx         (~100 lines) - Question navigation dots
│   ├── QuestionDisplay.tsx     (~150 lines) - Show question + choices
│   ├── AnswerChoice.tsx        (~60 lines)  - Single answer option
│   ├── ExamProgress.tsx        (~60 lines)  - Progress bar
│   ├── ExamResultCard.tsx      (~120 lines) - Result summary
│   ├── QuestionResult.tsx      (~100 lines) - Per-question feedback
│   └── index.ts
├── hooks/
│   ├── useExamAttempt.ts       (~150 lines) - Take experience state
│   ├── useExamResults.ts       (~80 lines)  - Results fetching
│   ├── useExamAnalytics.ts     (~100 lines) - Analytics data
│   └── index.ts
├── types.ts                    (~60 lines)
└── index.ts

app/(dashboard)/activities/[id]/exam/
├── take/
│   └── page.tsx               (~100 lines)
├── analytics/
│   └── page.tsx               (~120 lines)
└── [attemptId]/results/
    └── page.tsx               (~80 lines)
```

## Acceptance Criteria

- [ ] Create `src/features/exam-mode/` shared module
- [ ] Extract `ExamTimer` component (reuse in Case Mode)
- [ ] Extract `useExamAttempt` hook for take experience
- [ ] Separate `QuestionDisplay` from navigation logic
- [ ] Analytics charts as separate components
- [ ] All page files under 150 lines
- [ ] Timer component shared with Case Mode
- [ ] Existing functionality preserved

## Technical Approach

### 1. Shared Timer Component

```typescript
// src/features/shared/components/ActivityTimer.tsx
// Reusable across Exam, Case, Inquiry modes

interface Props {
  totalSeconds: number
  onTimeUp: () => void
  warningThreshold?: number // seconds before warning shows
  className?: string
}

export function ActivityTimer({ 
  totalSeconds, 
  onTimeUp, 
  warningThreshold = 60,
  className 
}: Props) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const isWarning = remaining <= warningThreshold
  
  useEffect(() => {
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
  }, [onTimeUp])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className={`
      font-mono text-lg px-4 py-2 rounded-lg
      ${isWarning ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100'}
      ${className}
    `}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}
```

### 2. Exam Attempt Hook

```typescript
// src/features/exam-mode/hooks/useExamAttempt.ts

export function useExamAttempt(activityId: string, attemptId?: string) {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Start new attempt
  const startAttempt = async () => { ... }

  // Navigate questions
  const goToQuestion = (index: number) => setCurrentIndex(index)
  const nextQuestion = () => setCurrentIndex(i => Math.min(i + 1, questions.length - 1))
  const prevQuestion = () => setCurrentIndex(i => Math.max(i - 1, 0))

  // Answer management
  const setAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  // Submit
  const submitExam = async () => { ... }

  return {
    attempt,
    currentQuestion: attempt?.questions[currentIndex],
    currentIndex,
    totalQuestions: attempt?.questions.length || 0,
    answers,
    answeredCount: Object.keys(answers).length,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    setAnswer,
    submitExam,
    submitting,
  }
}
```

### 3. Simplified Take Page

```typescript
// exam/take/page.tsx
'use client'

import { useExamAttempt } from '@/features/exam-mode/hooks'
import { 
  ExamTimer, 
  QuestionNav, 
  QuestionDisplay, 
  ExamProgress 
} from '@/features/exam-mode/components'

export default function ExamTakePage() {
  const { id } = useParams()
  const exam = useExamAttempt(id)

  if (!exam.attempt) return <LoadingState message="Loading exam..." />

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header with timer and progress */}
      <div className="flex justify-between items-center mb-6">
        <ExamProgress current={exam.answeredCount} total={exam.totalQuestions} />
        <ExamTimer 
          totalSeconds={exam.attempt.timeLimit * 60} 
          onTimeUp={exam.submitExam} 
        />
      </div>

      {/* Question navigation */}
      <QuestionNav 
        total={exam.totalQuestions}
        current={exam.currentIndex}
        answered={Object.keys(exam.answers)}
        onSelect={exam.goToQuestion}
      />

      {/* Current question */}
      <QuestionDisplay 
        question={exam.currentQuestion}
        selectedAnswer={exam.answers[exam.currentQuestion.id]}
        onSelectAnswer={(a) => exam.setAnswer(exam.currentQuestion.id, a)}
      />

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button onClick={exam.prevQuestion} disabled={exam.currentIndex === 0}>
          Previous
        </Button>
        {exam.currentIndex === exam.totalQuestions - 1 ? (
          <Button onClick={exam.submitExam} variant="primary">
            Submit Exam
          </Button>
        ) : (
          <Button onClick={exam.nextQuestion}>Next</Button>
        )}
      </div>
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/activities/[id]/exam/` - All exam pages
- `src/components/modes/ExamTimer.tsx` - Existing timer (enhance/replace)
- `src/features/case-mode/` - Share timer component

## Dependencies

**Blocked By:**
- None (can be done in parallel with VIBE-0002)

**Blocks:**
- None

## Notes

- Timer component should be shared across all timed modes
- Consider creating `src/features/shared/` for cross-mode components
- Question randomization logic should stay in API, not client
- Anti-cheat hooks already exist in `src/hooks/useAntiCheat.ts`

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - Exam Mode is second most complex after Case |
