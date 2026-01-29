---
id: VIBE-0007-WI14
title: CertificateFilters Component
status: backlog
effort: s
dependencies: [VIBE-0007-WI02]
---

# WI-014: CertificateFilters Component

## Description

Extract search/filter/sort controls from browse page.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/components/CertificateFilters.test.tsx`

```typescript
describe('CertificateFilters', () => {
  describe('Search', () => {
    it('renders search input')
    it('calls onSearchChange when typing')
    it('shows clear button when search has value')
    it('clears search when clear clicked')
  })
  
  describe('Status Filter', () => {
    it('renders status dropdown')
    it('shows All, Published, Draft options')
    it('calls onStatusChange when selected')
    it('shows current selection')
  })
  
  describe('Sort', () => {
    it('renders sort dropdown')
    it('shows sort options (name, date, enrollments)')
    it('calls onSortChange when selected')
    it('shows current sort')
  })
  
  describe('Layout', () => {
    it('renders inputs in horizontal layout')
    it('is responsive on mobile')
  })
})
```

### 2. Implement Component

**File:** `src/features/certificates/components/CertificateFilters.tsx`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Browse page filter section replaced
- [ ] Browse page reduced by ~60 lines
