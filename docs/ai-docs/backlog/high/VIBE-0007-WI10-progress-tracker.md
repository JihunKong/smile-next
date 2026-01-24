---
id: VIBE-0007-WI10
title: ProgressTracker Component
status: backlog
effort: s
dependencies: [VIBE-0007-WI04]
---

# WI-010: ProgressTracker Component

## Description

Extract progress display component from my-certificates progress page.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/components/ProgressTracker.test.tsx`

```typescript
describe('ProgressTracker', () => {
  describe('Overall Progress', () => {
    it('displays overall percentage')
    it('renders progress bar')
    it('shows encouraging message for incomplete')
    it('shows congratulations for 100%')
  })
  
  describe('Activity Progress List', () => {
    it('renders RequirementProgress for each activity')
    it('shows activity count header')
    it('handles empty activities list')
  })
  
  describe('Completion Actions', () => {
    it('shows claim/download button when 100%')
    it('hides claim button when incomplete')
    it('shows share button when completed')
  })
  
  describe('Certificate Info', () => {
    it('displays certificate name')
    it('displays organization name')
    it('displays enrollment date')
    it('displays completion date when completed')
  })
})
```

### 2. Implement Component

**File:** `src/features/certificates/components/ProgressTracker.tsx`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Progress page simplified significantly
- [ ] Component matches existing dashboard CertificateProgress patterns
