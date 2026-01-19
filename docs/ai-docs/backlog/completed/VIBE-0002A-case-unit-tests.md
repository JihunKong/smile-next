---
id: VIBE-0002A
title: Unit Tests for Case Mode Server Actions
status: completed
completed: 2026-01-18
priority: critical
category: testing
component: testing
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
parent: VIBE-0002
---

# Unit Tests for Case Mode Server Actions

## Summary

Write comprehensive unit tests for the Case Mode server actions before refactoring begins. This ensures the core business logic is protected during the UI modularization work.

The server actions file (`case/actions.ts`, 416 lines) contains critical logic for:
- Attempt lifecycle management
- Response persistence
- AI evaluation triggering
- Anti-cheating tracking

## Current Behavior

- **No unit tests exist** for Case Mode server actions
- E2E tests in `tests/e2e/modes/case.spec.ts` cover user flows but not edge cases
- Risk of regression when extracting hooks that call these actions

## Expected Behavior

Comprehensive unit test coverage for all 5 server actions with mocked Prisma and auth.

## Acceptance Criteria

- [x] Create `tests/unit/actions/case-actions.test.ts`
- [x] Test `startCaseAttempt()`:
  - Returns existing in-progress attempt
  - Creates new attempt when none exists
  - Rejects when max attempts reached
  - Rejects non-group members
- [x] Test `saveCaseResponse()`:
  - Merges response into existing responses
  - Rejects if attempt completed
  - Validates auth
- [x] Test `submitCaseAttempt()`:
  - Calls AI evaluation service
  - Calculates and stores scores
  - Updates attempt status
  - Handles AI service failures gracefully
- [x] Test `getCaseAttemptStatus()`:
  - Returns correct status (not_started, in_progress, completed)
  - Includes all attempts for history
  - Calculates best score correctly
- [x] Test `updateCaseCheatingStats()`:
  - Merges new flags with existing
  - Rejects completed attempts
- [x] All tests pass in CI

## Technical Approach

### Test File Structure

```typescript
// tests/unit/actions/case-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  startCaseAttempt, 
  saveCaseResponse, 
  submitCaseAttempt,
  getCaseAttemptStatus,
  updateCaseCheatingStats 
} from '@/app/(dashboard)/activities/[id]/case/actions'

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    activity: { findUnique: vi.fn() },
    caseAttempt: { 
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock auth
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}))

// Mock evaluation service
vi.mock('@/lib/services/caseEvaluationService', () => ({
  evaluateCaseAttempt: vi.fn(),
}))

describe('startCaseAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns existing in-progress attempt', async () => {
    // Setup mocks...
  })

  it('creates new attempt when none exists', async () => {
    // Setup mocks...
  })

  it('rejects when max attempts reached', async () => {
    // Setup mocks...
  })
})

// ... more test suites
```

### Key Test Scenarios

**startCaseAttempt:**
1. User has in-progress attempt → return existing
2. User at max attempts → error
3. User not in group → error
4. Activity not case mode → error
5. Happy path → create new attempt

**submitCaseAttempt:**
1. AI service succeeds → scores stored, status updated
2. AI service fails → fallback scoring applied
3. Already completed → error

## Related Files

- `src/app/(dashboard)/activities/[id]/case/actions.ts` - Target file
- `src/lib/services/caseEvaluationService.ts` - Mocked dependency
- `tests/unit/actions/case-actions.test.ts` - Test file (created)
- `vitest.config.ts` - Test configuration

## Dependencies

**Blocked By:**
- None

**Blocks:**
- VIBE-0002B (Types & Foundation) - should complete tests first
- VIBE-0002D (Take/Configure/Review) - hooks will call these actions

## Notes

- Use Vitest for consistency with existing unit tests
- Focus on business logic, not Prisma implementation details
- Consider adding tests for `caseEvaluationService.ts` if time permits

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as pre-requisite for VIBE-0002 refactoring |
| 2026-01-18 | Completed: 33 unit tests covering all 5 server actions with mocked Prisma, auth, and AI evaluation service |
