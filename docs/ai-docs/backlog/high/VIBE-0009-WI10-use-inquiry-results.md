---
id: VIBE-0009-WI10
title: Create useInquiryResults Hook (TDD)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: s
assignee: ai-agent
parent: VIBE-0009
---

# Create useInquiryResults Hook (TDD)

## Summary

Create a hook to manage results data and computed values for the inquiry results page.

## Current Behavior

Results logic is embedded in `results/page.tsx` with inline calculations and no data abstraction.

## Expected Behavior

A dedicated `useInquiryResults` hook that provides:
- Total/average score calculation
- Pass/fail status determination
- Bloom's level analysis and grouping
- Questions organized by level

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 6 test cases)
- [ ] Hook is under 60 lines
- [ ] Hook exported from `hooks/index.ts`

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/hooks/__tests__/useInquiryResults.test.ts`:

```typescript
import { renderHook } from '@testing-library/react'
import { useInquiryResults } from '../useInquiryResults'
import type { QuestionWithEvaluation } from '../../types'

describe('useInquiryResults', () => {
  const mockQuestions: QuestionWithEvaluation[] = [
    {
      id: '1', content: 'Q1?', createdAt: new Date(),
      evaluation: { overallScore: 80, bloomsLevel: 'analyze', /* ... */ },
    },
    {
      id: '2', content: 'Q2?', createdAt: new Date(),
      evaluation: { overallScore: 90, bloomsLevel: 'evaluate', /* ... */ },
    },
  ]

  it('calculates total score correctly', () => {
    const { result } = renderHook(() => 
      useInquiryResults({ questions: mockQuestions, passThreshold: 70 })
    )
    expect(result.current.totalScore).toBe(85)
  })

  it('determines pass/fail status', () => {
    const { result } = renderHook(() => 
      useInquiryResults({ questions: mockQuestions, passThreshold: 70 })
    )
    expect(result.current.passed).toBe(true)
  })

  it('returns highest bloom level', () => {
    const { result } = renderHook(() => 
      useInquiryResults({ questions: mockQuestions, passThreshold: 70 })
    )
    expect(result.current.highestBloomLevel).toBe('evaluate')
  })

  it('handles empty questions array', () => {
    const { result } = renderHook(() => 
      useInquiryResults({ questions: [], passThreshold: 70 })
    )
    expect(result.current.totalScore).toBe(0)
    expect(result.current.passed).toBe(false)
  })
})
```

### TDD Step 2: Implement Hook

See full implementation details in: `docs/ai-docs/implementation-plans/VIBE-0009-inquiry-mode-refactor-plan.md` (lines 872-970)

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/[attemptId]/results/page.tsx`
- `src/features/inquiry-mode/types.ts`

## Dependencies

**Blocked By:**
- VIBE-0009-WI01 (Foundation & Types)

**Blocks:**
- VIBE-0009-WI13 (Results Page Refactor)

## Test Commands

```bash
npm test -- src/features/inquiry-mode/hooks/__tests__/useInquiryResults.test.ts
```

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
