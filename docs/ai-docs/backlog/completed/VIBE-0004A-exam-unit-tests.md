---
id: VIBE-0004A
title: Unit Tests for Exam Mode Server Actions (TDD Foundation)
status: in_progress
priority: critical
category: testing
component: testing
created: 2026-01-23
updated: 2026-01-23
effort: m
assignee: ai-agent
parent: VIBE-0004
---

# Unit Tests for Exam Mode Server Actions

## Summary

Write comprehensive unit tests for the Exam Mode server actions **before** refactoring begins. This TDD approach ensures the core business logic is protected during the UI modularization work.

The server actions file (`exam/actions.ts`, 416 lines) contains 6 critical functions:
- `startExamAttempt()` - Attempt creation with question/choice shuffling
- `saveExamAnswer()` - Real-time answer persistence
- `submitExamAttempt()` - Score calculation and completion
- `getExamAttemptStatus()` - Status check (not_started, in_progress, completed)
- `updateExamCheatingStats()` - Anti-cheat tracking
- `shuffleArray()` / `arraysEqual()` - Helper functions

## Current State

- **No unit tests exist** for Exam Mode server actions
- E2E tests in `tests/e2e/modes/exam.spec.ts` cover user flows but not edge cases
- Risk of regression when extracting hooks that call these actions

## Acceptance Criteria

- [x] Create `tests/unit/actions/exam-actions.test.ts`
- [ ] Test `startExamAttempt()`:
  - Returns existing in-progress attempt
  - Creates new attempt when none exists
  - Generates question order based on `shuffleQuestions` setting
  - Generates choice shuffles based on `shuffleChoices` setting
  - Rejects when max attempts reached
  - Rejects non-group members
  - Rejects unpublished exams
- [ ] Test `saveExamAnswer()`:
  - Saves single choice correctly
  - Saves multiple choices (multi-select questions)
  - Rejects if attempt already completed
  - Rejects if user doesn't own attempt
- [ ] Test `submitExamAttempt()`:
  - Calculates score correctly with shuffled choices
  - Determines pass/fail based on threshold
  - Updates attempt status to completed
  - Handles edge case: no answers submitted
  - Records time taken correctly
- [ ] Test `getExamAttemptStatus()`:
  - Returns `not_started` when no attempts
  - Returns `in_progress` with remaining time
  - Returns `completed` with score and pass status
  - Returns all attempts for history
- [ ] Test `updateExamCheatingStats()`:
  - Updates tab switch count
  - Records copy/paste attempts
  - Merges cheating flags array
  - Rejects completed attempts
- [ ] Test helper functions:
  - `shuffleArray()` produces valid permutation
  - `arraysEqual()` compares correctly
- [ ] All tests pass in CI (`npm run test:unit`)

## Technical Approach

### Test File Structure

```typescript
// tests/unit/actions/exam-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  startExamAttempt, 
  saveExamAnswer, 
  submitExamAttempt,
  getExamAttemptStatus,
  updateExamCheatingStats 
} from '@/app/(dashboard)/activities/[id]/exam/actions'

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    activity: { findUnique: vi.fn() },
    examAttempt: { 
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    examAnswer: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    question: {
      findMany: vi.fn(),
    },
  },
}))

// Mock auth
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}))

describe('startExamAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns existing in-progress attempt', async () => {
    // Setup: Mock existing attempt
    // Assert: Returns existing attempt ID, not create new
  })

  it('creates new attempt with shuffled questions when setting enabled', async () => {
    // Setup: Mock activity with shuffleQuestions: true
    // Assert: questionOrder differs from original order
  })

  it('rejects when max attempts reached', async () => {
    // Setup: Mock attempt count >= maxAttempts
    // Assert: Returns error
  })

  it('rejects non-group members', async () => {
    // Setup: Mock user not in activity's group
    // Assert: Returns error
  })
})

describe('saveExamAnswer', () => {
  it('upserts answer for question', async () => {
    // Setup: Valid attempt and question
    // Assert: prisma.examAnswer.upsert called
  })

  it('rejects if attempt completed', async () => {
    // Setup: Attempt with status: 'completed'
    // Assert: Returns error
  })
})

describe('submitExamAttempt', () => {
  it('calculates score correctly with shuffled choices', async () => {
    // Setup: Attempt with choiceShuffles, answers using shuffled indices
    // Assert: Correct answers counted properly
  })

  it('determines pass when score >= threshold', async () => {
    // Setup: 80% score, 70% threshold
    // Assert: passed = true
  })

  it('determines fail when score < threshold', async () => {
    // Setup: 60% score, 70% threshold
    // Assert: passed = false
  })
})
```

### Key Test Scenarios

**startExamAttempt:**
1. User has in-progress attempt → return existing attempt
2. User at max attempts → error with attempt count
3. User not in group → authorization error
4. Activity not exam mode → error
5. Exam not published → error
6. Happy path → create new attempt with shuffled questions/choices

**saveExamAnswer:**
1. First answer for question → creates record
2. Changed answer → updates existing
3. Clear answer (empty array) → handles gracefully
4. Attempt completed → error
5. Wrong user → authorization error

**submitExamAttempt:**
1. All correct → 100% score, passed
2. All wrong → 0% score, failed
3. Shuffled choices → maps back correctly
4. No answers submitted → 0% score
5. Already submitted → error

## Verification

```bash
# Run unit tests
npm run test:unit -- tests/unit/actions/exam-actions.test.ts

# Run with coverage
npm run test:unit -- --coverage tests/unit/actions/exam-actions.test.ts
```

## Related Files

- `src/app/(dashboard)/activities/[id]/exam/actions.ts` - Target file
- `tests/unit/actions/case-actions.test.ts` - Reference implementation
- `tests/e2e/modes/exam.spec.ts` - Existing E2E tests
- `vitest.config.ts` - Test configuration

## Dependencies

**Blocked By:**
- None (first item in sequence)

**Blocks:**
- VIBE-0004B (Types & Foundation) - tests must exist before refactoring
- VIBE-0004C (Results & Analytics) - server actions called from pages
- VIBE-0004D (Take Experience) - hooks will call these actions

## Notes

- Reference `tests/unit/actions/case-actions.test.ts` for mocking patterns
- Focus on business logic and edge cases
- E2E tests cover happy paths; unit tests should cover error cases
- Test shuffle determinism with seeded random (if applicable)

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created as TDD foundation for VIBE-0004 refactoring |
