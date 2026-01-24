---
id: VIBE-0007-WI06
title: useCertificateDesigner Hook
status: backlog
effort: l
dependencies: [VIBE-0007-WI03]
---

# WI-006: useCertificateDesigner Hook

## Description

Extract designer-specific logic (image uploads, badge positioning, preview generation).

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/hooks/useCertificateDesigner.test.ts`

```typescript
describe('useCertificateDesigner', () => {
  describe('Image Upload', () => {
    it('uploads logo image')
    it('uploads background image')
    it('validates image file type')
    it('validates image file size')
    it('shows upload progress')
    it('handles upload failure')
    it('removes uploaded image')
  })
  
  describe('Badge Placement', () => {
    it('tracks badge positions')
    it('updates badge position on drag')
    it('validates badge bounds within canvas')
    it('saves badge positions to certificate')
  })
  
  describe('Logo Position', () => {
    it('sets logo position (top-left, top-center, top-right)')
    it('persists logo position')
  })
  
  describe('QR Code Position', () => {
    it('sets QR position (bottom-left, bottom-center, bottom-right)')
    it('persists QR position')
  })
  
  describe('Draft & Submit', () => {
    it('saves certificate as draft')
    it('submits certificate for approval')
    it('validates before submission')
  })
})
```

### 2. Implement Hook

**File:** `src/features/certificates/hooks/useCertificateDesigner.ts`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Designer page complexity reduced significantly
- [ ] Image upload logic encapsulated
