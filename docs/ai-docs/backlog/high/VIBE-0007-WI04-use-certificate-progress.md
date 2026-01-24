---
id: VIBE-0007-WI04
title: useCertificateProgress Hook
status: backlog
effort: s
dependencies: [VIBE-0007-WI01]
---

# WI-004: useCertificateProgress Hook

## Description

Extract progress fetching logic from `my-certificates/[id]/progress/page.tsx`.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/hooks/useCertificateProgress.test.ts`

```typescript
describe('useCertificateProgress', () => {
  describe('Data Fetching', () => {
    it('fetches progress data on mount')
    it('calculates overall percentage correctly')
    it('maps activity statuses correctly')
  })
  
  describe('Actions', () => {
    it('provides refresh function')
    it('provides downloadCertificate function when completed')
    it('provides share function with verification URL')
  })
  
  describe('PDF Download', () => {
    it('triggers PDF generation on download')
    it('handles download failure gracefully')
    it('shows downloading state during generation')
  })
})
```

### 2. Implement Hook

**File:** `src/features/certificates/hooks/useCertificateProgress.ts`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Progress page code reduced by ~100 lines
- [ ] PDF download logic encapsulated
