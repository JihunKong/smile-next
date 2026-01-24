---
id: VIBE-0004C
title: Exam Results & Analytics Components Refactor
status: done
priority: critical
category: refactoring
component: ui
created: 2026-01-23
updated: 2026-01-23
effort: m
assignee: ai-agent
parent: VIBE-0004
---

# Exam Results & Analytics Components Refactor

## Summary

Extract reusable components from the Results page (575 lines) and Analytics page (622 lines). Both are server components with complex data display that can be significantly simplified through component extraction.

## Current State

| File | Lines | Issues |
|------|-------|--------|
| `exam/[attemptId]/results/page.tsx` | 575 | Inline JSX for score display, question results, feedback |
| `exam/analytics/page.tsx` | 622 | Inline JSX for charts, student table, question breakdown |

## Target Architecture

```
src/features/exam-mode/components/
├── results/
│   ├── ExamScoreCard.tsx           (~80 lines)  - Score circle, pass/fail badge
│   ├── QuestionResultCard.tsx      (~100 lines) - Single question feedback
│   ├── QuestionResultList.tsx      (~60 lines)  - Mapped list of results
│   ├── ExamFeedback.tsx            (~60 lines)  - AI coaching feedback section
│   └── index.ts
├── analytics/
│   ├── ExamOverviewStats.tsx       (~80 lines)  - Total attempts, avg score, pass rate
│   ├── QuestionDifficultyTable.tsx (~120 lines) - Per-question success rates
│   ├── StudentPerformanceTable.tsx (~100 lines) - Student scores table
│   ├── ScoreDistributionChart.tsx  (~80 lines)  - Score histogram
│   └── index.ts
└── index.ts
```

## Acceptance Criteria

### Results Page Components

- [ ] Create `ExamScoreCard` component:
  - Score percentage in circular progress
  - Pass/fail badge with color coding
  - Correct/incorrect count
  - Time taken display
- [ ] Create `QuestionResultCard` component:
  - Question text with number
  - Student's answer (highlighted)
  - Correct answer (if different)
  - Explanation (if available)
  - Correct/incorrect indicator
- [ ] Create `QuestionResultList` component:
  - Maps QuestionResult[] to QuestionResultCard
  - Handles empty state
- [ ] Create `ExamFeedback` component:
  - AI coaching section (when enabled)
  - Share buttons integration
- [ ] Results page reduced to <120 lines
- [ ] Write unit tests for score display logic

### Analytics Page Components

- [ ] Create `ExamOverviewStats` component:
  - Total attempts stat card
  - Average score stat card
  - Pass rate stat card
  - Average time stat card
- [ ] Create `QuestionDifficultyTable` component:
  - Table with question, success rate, difficulty badge
  - Most common wrong answer
  - Sortable columns
- [ ] Create `StudentPerformanceTable` component:
  - Table with student, score, pass/fail, time
  - Link to individual attempt
  - Sortable columns
- [ ] Create `ScoreDistributionChart` component:
  - Histogram of score ranges
  - Pass threshold line
- [ ] Analytics page reduced to <150 lines
- [ ] Write unit tests for analytics calculations

### General

- [ ] All component files under 150 lines
- [ ] TypeScript builds without errors
- [ ] E2E tests pass

## Technical Approach

### 1. ExamScoreCard Component

```typescript
// src/features/exam-mode/components/results/ExamScoreCard.tsx
import type { ExamResultSummary } from '@/features/exam-mode/types'

interface ExamScoreCardProps {
  result: ExamResultSummary
  showPassFail?: boolean
  showScore?: boolean
}

export function ExamScoreCard({ result, showPassFail = true, showScore = true }: ExamScoreCardProps) {
  const { score, passed, correctCount, totalQuestions, timeTakenMinutes } = result
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Circular score display */}
      <div className="flex items-center justify-center">
        <div className={`
          relative w-32 h-32 rounded-full 
          ${passed ? 'bg-green-100' : 'bg-red-100'}
        `}>
          {showScore && (
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
              {score}%
            </span>
          )}
        </div>
      </div>
      
      {/* Pass/fail badge */}
      {showPassFail && (
        <div className="mt-4 text-center">
          <span className={`
            px-4 py-2 rounded-full text-sm font-semibold
            ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
          `}>
            {passed ? 'PASSED' : 'FAILED'}
          </span>
        </div>
      )}
      
      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{correctCount}/{totalQuestions}</p>
          <p className="text-sm text-gray-500">Correct Answers</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{timeTakenMinutes}m</p>
          <p className="text-sm text-gray-500">Time Taken</p>
        </div>
      </div>
    </div>
  )
}
```

### 2. QuestionResultCard Component

```typescript
// src/features/exam-mode/components/results/QuestionResultCard.tsx
import type { QuestionResult } from '@/features/exam-mode/types'
import { CheckCircle, XCircle } from 'lucide-react'

interface QuestionResultCardProps {
  result: QuestionResult
  questionNumber: number
  showFeedback?: boolean
}

export function QuestionResultCard({ 
  result, 
  questionNumber,
  showFeedback = true 
}: QuestionResultCardProps) {
  const { 
    questionContent, 
    choices, 
    studentAnswerIndex, 
    correctAnswerIndex, 
    isCorrect,
    explanation 
  } = result
  
  return (
    <div className={`
      rounded-lg border p-4
      ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}
    `}>
      {/* Header with question number and status */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium">Question {questionNumber}</h3>
        {isCorrect ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
      
      {/* Question text */}
      <p className="text-gray-800 mb-3">{questionContent}</p>
      
      {/* Choices with highlighting */}
      <div className="space-y-2">
        {choices.map((choice, i) => {
          const isStudentAnswer = i === studentAnswerIndex
          const isCorrectAnswer = i === correctAnswerIndex
          
          return (
            <div 
              key={i}
              className={`
                p-2 rounded
                ${isCorrectAnswer ? 'bg-green-100 border border-green-300' : ''}
                ${isStudentAnswer && !isCorrect ? 'bg-red-100 border border-red-300' : ''}
              `}
            >
              {choice}
              {isStudentAnswer && <span className="ml-2 text-sm">(Your answer)</span>}
              {isCorrectAnswer && !isStudentAnswer && <span className="ml-2 text-sm text-green-600">(Correct)</span>}
            </div>
          )
        })}
      </div>
      
      {/* Explanation */}
      {showFeedback && explanation && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{explanation}</p>
        </div>
      )}
    </div>
  )
}
```

### 3. Simplified Results Page

```typescript
// exam/[attemptId]/results/page.tsx
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { 
  ExamScoreCard, 
  QuestionResultList,
  ExamFeedback 
} from '@/features/exam-mode/components'
import { ExamShareButtons } from '@/components/activities/ExamShareButtons'
import type { ExamResultSummary, QuestionResult } from '@/features/exam-mode/types'

export default async function ExamResultsPage({ params }: Props) {
  const { id, attemptId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Fetch attempt and build results...
  const attempt = await prisma.examAttempt.findUnique({...})
  if (!attempt) notFound()

  const resultSummary: ExamResultSummary = {
    score: attempt.score,
    passed: attempt.passed,
    correctCount: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    timeTakenMinutes: Math.ceil(attempt.timeTaken / 60),
    submittedAt: attempt.completedAt,
  }

  const questionResults: QuestionResult[] = buildQuestionResults(attempt)

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Exam Results</h1>
      
      <ExamScoreCard 
        result={resultSummary}
        showPassFail={examSettings.showPassFail}
        showScore={examSettings.showScore}
      />
      
      {examSettings.showFeedback && (
        <QuestionResultList 
          results={questionResults}
          showFeedback={examSettings.showFeedback}
        />
      )}
      
      {examSettings.enableAiCoaching && (
        <ExamFeedback attemptId={attemptId} />
      )}
      
      <ExamShareButtons attemptId={attemptId} />
    </div>
  )
}
```

## Verification

```bash
# Run unit tests for new components
npm run test:unit -- tests/unit/components/exam-mode

# Run E2E tests
npm run test:e2e -- tests/e2e/modes/exam.spec.ts

# Type check
npx tsc --noEmit
```

## Related Files

- `src/app/(dashboard)/activities/[id]/exam/[attemptId]/results/page.tsx`
- `src/app/(dashboard)/activities/[id]/exam/analytics/page.tsx`
- `src/features/exam-mode/components/` - New components
- `src/components/activities/ExamShareButtons.tsx` - Existing component

## Dependencies

**Blocked By:**
- VIBE-0004A (Unit Tests) - server action tests
- VIBE-0004B (Types & Foundation) - types needed for components

**Blocks:**
- VIBE-0004D (Take Experience) - can reuse patterns

## Notes

- Results page is a Server Component - keep data fetching in page
- Analytics page is also Server Component - same pattern
- Components should be pure presentation, no data fetching
- Consider extracting chart components to shared library later

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created - Results and Analytics component extraction |
