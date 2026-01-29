---
id: VIBE-0007-WI05
title: useCertificateForm Hook
status: backlog
effort: m
dependencies: [VIBE-0007-WI01]
---

# WI-005: useCertificateForm Hook

## Description

Extract shared form logic between create and edit pages.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/hooks/useCertificateForm.test.ts`

```typescript
describe('useCertificateForm', () => {
  describe('Initial State', () => {
    it('initializes with empty values for create mode')
    it('initializes with certificate values for edit mode')
  })
  
  describe('Field Updates', () => {
    it('updates name field')
    it('updates description field')
    it('updates organization name')
    it('updates signatory name')
    it('updates certificate statement')
    it('updates student instructions')
  })
  
  describe('Activity Management', () => {
    it('adds activity to list')
    it('prevents duplicate activities')
    it('removes activity from list')
    it('moves activity up in order')
    it('moves activity down in order')
    it('reorders activities correctly')
    it('toggles required flag on activity')
  })
  
  describe('Validation', () => {
    it('validates required fields')
    it('validates at least one activity')
    it('returns validation errors')
    it('clears errors on valid input')
  })
  
  describe('Submission', () => {
    it('calls onCreate for new certificates')
    it('calls onUpdate for existing certificates')
    it('sets submitting state during API call')
    it('handles submission error')
    it('resets form on successful create')
  })
})
```

### 2. Implement Hook

**File:** `src/features/certificates/hooks/useCertificateForm.ts`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Create and edit pages can share this hook
- [ ] Combined create + edit page code reduced by ~200 lines
