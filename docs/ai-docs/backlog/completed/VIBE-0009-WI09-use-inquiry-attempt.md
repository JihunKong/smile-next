---
id: VIBE-0009-WI09
title: Create useInquiryAttempt Hook (TDD)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: l
assignee: ai-agent
parent: VIBE-0009
---

# Create useInquiryAttempt Hook (TDD)

## Summary

Extract the main inquiry attempt logic from `inquiry-take-client.tsx` into a reusable hook. This is the **core state management hook** for the inquiry take experience.

## Current Behavior

All inquiry attempt logic is embedded in the client component (588 lines):
- State management (lines 42-70)
- Question submission with optimistic updates (lines 105-151)
- Completion handling (lines 153-166)
- Timer integration
- Anti-cheat stats synchronization (lines 56-84)

## Expected Behavior

A dedicated `useInquiryAttempt` hook that encapsulates:
- All state for the inquiry attempt
- Question submission logic with optimistic updates
- Completion logic
- Computed values (average score, completion status)
- Anti-cheat integration

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 12 test cases)
- [ ] Hook is under 150 lines
- [ ] Hook exported from `hooks/index.ts`
- [ ] Integrates with existing server actions
- [ ] Preserves anti-cheat functionality

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/hooks/__tests__/useInquiryAttempt.test.ts`

See full test implementation in: `docs/ai-docs/implementation-plans/VIBE-0009-inquiry-mode-refactor-plan.md` (lines 717-850)

Key test cases:
- Initialization with provided data
- Question input management
- Question submission validation
- Optimistic updates during submission
- Error handling on submission failure
- Completion tracking
- Average score calculation
- Timer integration

### TDD Step 2: Implement Hook

Create `src/features/inquiry-mode/hooks/useInquiryAttempt.ts`

Extract from `inquiry-take-client.tsx`:
- State management (lines 42-70)
- `handleSubmitQuestion` (lines 105-151)
- `handleComplete` (lines 153-166)
- Timer logic

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx` (lines 42-166)
- `src/app/(dashboard)/activities/[id]/inquiry/actions.ts` - Server actions

## Dependencies

**Blocked By:**
- VIBE-0009-WI01 (Foundation & Types)

**Blocks:**
- VIBE-0009-WI11 (Take Page Refactor)

## Test Commands

```bash
npm test -- src/features/inquiry-mode/hooks/__tests__/useInquiryAttempt.test.ts
```

## Notes

- This is the most complex hook - contains core business logic
- Must integrate with existing server actions without modification
- Anti-cheat integration can be handled separately in the page component
- Optimistic updates are critical for UX

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
