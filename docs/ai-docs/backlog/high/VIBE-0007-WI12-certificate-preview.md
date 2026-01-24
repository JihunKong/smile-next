---
id: VIBE-0007-WI12
title: CertificatePreview Component Refactor
status: backlog
effort: s
dependencies: [VIBE-0007-WI01]
---

# WI-012: CertificatePreview Component Refactor

## Description

Refactor existing CertificatePreview (designer/components) to be more reusable.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/components/CertificatePreview.test.tsx`

```typescript
describe('CertificatePreview', () => {
  describe('Rendering', () => {
    it('renders certificate name')
    it('renders organization name')
    it('renders signatory name')
    it('renders certificate statement')
    it('renders logo at correct position')
    it('renders QR code at correct position')
    it('renders background image if set')
  })
  
  describe('Badges', () => {
    it('renders badge icons at saved positions')
    it('renders earned badges differently from unearned')
  })
  
  describe('Student Info Placeholders', () => {
    it('shows "[Student Name]" placeholder')
    it('shows "[Date]" placeholder')
    it('shows "[Verification Code]" placeholder')
  })
  
  describe('Sizing', () => {
    it('maintains aspect ratio')
    it('scales content appropriately')
  })
})
```

### 2. Refactor Component

**File:** `src/features/certificates/components/CertificatePreview.tsx`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Existing preview functionality preserved
- [ ] Component is reusable in multiple contexts
