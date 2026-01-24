---
id: VIBE-0007-WI11
title: RequirementProgress Component
status: backlog
effort: xs
dependencies: [VIBE-0007-WI01]
---

# WI-011: RequirementProgress Component

## Description

Single requirement/activity progress display within ProgressTracker.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/components/RequirementProgress.test.tsx`

```typescript
describe('RequirementProgress', () => {
  describe('Status Display', () => {
    it('shows passed icon and "Passed" text for passed status')
    it('shows failed icon and "Try Again" for failed status')
    it('shows in-progress icon and "Continue" for in_progress')
    it('shows not-started icon and "Start" for not_started')
  })
  
  describe('Activity Info', () => {
    it('displays activity name')
    it('shows Required badge when required')
    it('shows Optional badge when not required')
    it('links to activity page')
  })
  
  describe('Score Display', () => {
    it('shows score when available')
    it('hides score when not available')
  })
})
```

### 2. Implement Component

**File:** `src/features/certificates/components/RequirementProgress.tsx`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Component is used by ProgressTracker
