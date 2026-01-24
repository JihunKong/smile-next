---
id: VIBE-0007-WI09
title: ActivitySelector Component
status: backlog
effort: m
dependencies: [VIBE-0007-WI01]
---

# WI-009: ActivitySelector Component

## Description

Extract activity selection/ordering UI shared between designer, create, and edit pages.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/components/ActivitySelector.test.tsx`

```typescript
describe('ActivitySelector', () => {
  describe('Activity Search', () => {
    it('shows search input')
    it('filters activities by name')
    it('debounces search input')
    it('shows no results message')
  })
  
  describe('Available Activities List', () => {
    it('renders available activities')
    it('shows activity name and type')
    it('shows group name when applicable')
    it('hides already selected activities')
  })
  
  describe('Selected Activities List', () => {
    it('renders selected activities in order')
    it('shows sequence number')
    it('shows required toggle')
    it('shows remove button')
    it('shows move up/down buttons')
    it('disables move up on first item')
    it('disables move down on last item')
  })
  
  describe('Selection Actions', () => {
    it('calls onAdd when activity clicked')
    it('calls onRemove when remove clicked')
    it('calls onMove with direction when move clicked')
    it('calls onToggleRequired when toggle clicked')
  })
  
  describe('Empty States', () => {
    it('shows empty message when no activities selected')
    it('shows loading state while fetching activities')
  })
})
```

### 2. Implement Component

**File:** `src/features/certificates/components/ActivitySelector.tsx`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Replaces inline activity selection in 3+ pages
- [ ] Reduces total code by ~150 lines
