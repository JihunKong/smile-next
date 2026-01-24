---
id: VIBE-0007-WI03
title: useCertificate Hook (Single Certificate)
status: backlog
effort: s
dependencies: [VIBE-0007-WI01]
---

# WI-003: useCertificate Hook (Single Certificate)

## Description

Extract single certificate fetching logic from `[id]/edit/page.tsx` into a reusable hook.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/hooks/useCertificate.test.ts`

```typescript
describe('useCertificate', () => {
  describe('Initial State', () => {
    it('returns loading=true when id is provided')
    it('returns loading=false when id is undefined')
    it('returns null certificate initially')
  })
  
  describe('Data Fetching', () => {
    it('fetches certificate by id on mount')
    it('includes activities in response')
    it('refetches when id changes')
  })
  
  describe('Mutations', () => {
    it('provides updateCertificate function')
    it('optimistically updates local state')
    it('reverts on API error')
    it('provides saving state during mutation')
  })
  
  describe('Error Handling', () => {
    it('sets error on 404 response')
    it('sets error on network failure')
    it('provides retry function')
  })
})
```

### 2. Implement Hook

**File:** `src/features/certificates/hooks/useCertificate.ts`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Hook can be used in edit and designer pages
- [ ] Supports optimistic updates
