---
id: VIBE-0007-WI08
title: CertificateForm Component
status: backlog
effort: m
dependencies: [VIBE-0007-WI05]
---

# WI-008: CertificateForm Component

## Description

Create shared form component for create and edit pages.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/components/CertificateForm.test.tsx`

```typescript
describe('CertificateForm', () => {
  describe('Fields', () => {
    it('renders name input')
    it('renders organization input')
    it('renders program name input')
    it('renders signatory name input')
    it('renders certificate statement textarea')
    it('renders student instructions textarea')
  })
  
  describe('Edit Mode', () => {
    it('populates fields with certificate data')
    it('shows "Save Changes" button')
    it('disables name field when not creator')
  })
  
  describe('Create Mode', () => {
    it('shows empty fields')
    it('shows "Create Certificate" button')
  })
  
  describe('Activity Selector Section', () => {
    it('renders ActivitySelector component')
    it('passes selected activities to selector')
    it('handles activity selection')
    it('handles activity removal')
    it('handles activity reordering')
  })
  
  describe('Validation Display', () => {
    it('shows error for empty name')
    it('shows error when no activities selected')
    it('clears errors on correction')
  })
  
  describe('Submission', () => {
    it('calls onSubmit with form data')
    it('shows loading state during submission')
    it('disables submit button when invalid')
  })
})
```

### 2. Implement Component

**File:** `src/features/certificates/components/CertificateForm.tsx`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Component works in both create and edit modes
- [ ] Reduces duplication between create/edit pages by ~300 lines combined
