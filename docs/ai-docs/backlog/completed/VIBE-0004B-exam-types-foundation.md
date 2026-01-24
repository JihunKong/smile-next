---
id: VIBE-0004B
title: Exam Mode Types & Feature Module Foundation
status: in_progress
priority: critical
category: refactoring
component: ui
created: 2026-01-23
updated: 2026-01-23
effort: s
assignee: ai-agent
parent: VIBE-0004
---

# Exam Mode Types & Feature Module Foundation

## Summary

Create the `src/features/exam-mode/` module structure and consolidate all Exam Mode TypeScript types. This establishes the foundation for component and hook extraction in subsequent tickets.

## Current State

Types are scattered across:
- `exam/take/exam-take-client.tsx` - `Question`, `ExamTakeClientProps` interfaces
- `exam/analytics/page.tsx` - `QuestionAnalytics`, `StudentPerformance` interfaces
- `exam/[attemptId]/results/page.tsx` - `QuestionResult`, `ExamSettingsWithFeedback` interfaces
- `exam/actions.ts` - `StartExamResult`, `SaveAnswerResult`, `SubmitExamResult` types

No `features/exam-mode/` directory exists.

## Expected Behavior

Create organized feature module structure:

```
src/features/exam-mode/
├── components/
│   └── index.ts                    # Empty, ready for VIBE-0004C/D
├── hooks/
│   └── index.ts                    # Empty, ready for VIBE-0004D
├── types.ts                        (~120 lines)
└── index.ts
```

## Acceptance Criteria

- [x] Create `src/features/exam-mode/` directory structure
- [x] Create `types.ts` with all consolidated types:
  - **Core Types**: `Question`, `ExamAttempt`, `ExamAnswer`
  - **Props Types**: `ExamTakeClientProps` (after extraction)
  - **Analytics Types**: `QuestionAnalytics`, `StudentPerformance`
  - **Results Types**: `QuestionResult`, `ExamSettingsWithFeedback`
  - **Action Result Types**: `StartExamResult`, `SaveAnswerResult`, `SubmitExamResult`
- [x] Create `index.ts` barrel exports
- [ ] Update `exam/actions.ts` to import types from `@/features/exam-mode/types`
- [x] Update `exam/take/exam-take-client.tsx` to import from feature module  
- [x] Update `exam/analytics/page.tsx` to import from feature module
- [x] Update `exam/[attemptId]/results/page.tsx` to import from feature module
- [x] TypeScript builds without errors
- [ ] Existing E2E tests pass

## Technical Approach

### 1. Consolidated Types File

```typescript
// src/features/exam-mode/types.ts

// ============================================
// Core Exam Types
// ============================================

/** A single exam question with choices */
export interface Question {
  id: string
  content: string
  choices: string[]
  correctAnswerIndex?: number    // Only for grading (server-side)
  explanation?: string | null    // Shown after submission
}

/** An exam attempt record */
export interface ExamAttempt {
  id: string
  userId: string
  activityId: string
  status: 'in_progress' | 'completed' | 'abandoned'
  startedAt: Date
  completedAt?: Date
  score?: number
  passed?: boolean
  questionOrder: string[]        // Order questions were shown
  choiceShuffles: Record<string, number[]>  // Per-question choice mappings
  timeTakenSeconds?: number
}

/** A saved answer for a question */
export interface ExamAnswer {
  attemptId: string
  questionId: string
  selectedChoices: string[]      // Choice indices as strings
  answeredAt: Date
}

// ============================================
// Exam Settings
// ============================================

export interface ExamSettings {
  timeLimit?: number             // Minutes
  questionsToShow?: number       // Subset of questions
  passThreshold?: number         // Percentage to pass
  shuffleQuestions?: boolean
  shuffleChoices?: boolean
  maxAttempts?: number
  showFeedback?: boolean         // Show correct answers after
  showScore?: boolean
  showPassFail?: boolean
  showLeaderboard?: boolean
  enableAiCoaching?: boolean
}

// ============================================
// Take Experience Types
// ============================================

export interface ExamTakeClientProps {
  activityId: string
  activityName: string
  groupName: string
  attemptId: string
  questions: Question[]
  existingAnswers: Record<string, string[]>
  remainingSeconds: number
  totalQuestions: number
  timeLimitMinutes: number
  instructions?: string
  description?: string
  choiceShuffles?: Record<string, number[]>
}

// ============================================
// Results Types  
// ============================================

export interface QuestionResult {
  questionId: string
  questionContent: string
  choices: string[]
  studentAnswerIndex: number | null
  correctAnswerIndex: number
  isCorrect: boolean
  explanation: string | null
  shuffleMap: number[] | null    // For unshuffling display
}

export interface ExamResultSummary {
  score: number
  passed: boolean
  correctCount: number
  totalQuestions: number
  timeTakenMinutes: number
  submittedAt: Date
  feedback?: string
}

// ============================================
// Analytics Types (Teacher View)
// ============================================

export interface QuestionAnalytics {
  questionNumber: number
  questionId: string
  questionText: string
  correctAnswer: string
  successRate: number
  difficulty: 'Easy' | 'Medium' | 'Difficult'
  correctCount: number
  incorrectCount: number
  totalResponses: number
  mostCommonWrongAnswer: {
    answer: string
    count: number
    percentage: number
  } | null
}

export interface StudentPerformance {
  attemptId: string
  studentName: string
  studentEmail: string
  scorePercentage: number
  passed: boolean
  questionsCorrect: number
  questionsIncorrect: number
  timeTakenMinutes: number
  submittedAt: Date
}

export interface ExamAnalyticsSummary {
  totalAttempts: number
  averageScore: number
  passRate: number
  averageTimeTaken: number
  questionsAnalytics: QuestionAnalytics[]
  studentPerformances: StudentPerformance[]
}

// ============================================
// Server Action Result Types
// ============================================

export interface StartExamResult {
  attemptId: string
  questionOrder: string[]
  choiceShuffles: Record<string, number[]>
}

export interface SaveAnswerResult {
  success: boolean
}

export interface SubmitExamResult {
  score: number
  passed: boolean
  correctAnswers: number
  totalQuestions: number
}

export interface ExamAttemptStatus {
  status: 'not_started' | 'in_progress' | 'completed'
  attempt?: ExamAttempt
  remainingSeconds?: number
  attempts: ExamAttempt[]
  canRetake: boolean
}
```

### 2. Barrel Export

```typescript
// src/features/exam-mode/index.ts
export * from './types'
export * from './components'
export * from './hooks'
```

### 3. Update Imports in Existing Files

```typescript
// Before (in exam/take/exam-take-client.tsx)
interface Question {
  id: string
  // ...
}

// After
import type { Question, ExamTakeClientProps } from '@/features/exam-mode'
```

## Verification

```bash
# TypeScript compilation
npx tsc --noEmit

# Run E2E tests to ensure no regression
npm run test:e2e -- tests/e2e/modes/exam.spec.ts
```

## Related Files

- `src/features/exam-mode/` - New directory
- `src/app/(dashboard)/activities/[id]/exam/take/exam-take-client.tsx`
- `src/app/(dashboard)/activities/[id]/exam/analytics/page.tsx`
- `src/app/(dashboard)/activities/[id]/exam/[attemptId]/results/page.tsx`
- `src/app/(dashboard)/activities/[id]/exam/actions.ts`
- `src/features/case-mode/` - Reference implementation

## Dependencies

**Blocked By:**
- VIBE-0004A (Unit Tests) - tests protect against regression during changes

**Blocks:**
- VIBE-0004C (Results & Analytics) - needs types from this module
- VIBE-0004D (Take Experience) - needs types from this module

## Notes

- Keep type changes minimal - consolidation only, no behavior changes
- Run E2E tests after each file update to catch regressions early
- Some types may need adjustment during component extraction

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created as foundation for VIBE-0004 refactoring |
