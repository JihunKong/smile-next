---
id: VIBE-0007-WI07
title: CertificateCard Component
status: backlog
effort: s
dependencies: [VIBE-0007-WI01]
---

# WI-007: CertificateCard Component

## Description

Extract certificate card display from browse page.

## TDD Approach

### 1. Write Tests First

**File:** `tests/unit/features/certificates/components/CertificateCard.test.tsx`

```typescript
describe('CertificateCard', () => {
  describe('Display', () => {
    it('renders certificate name')
    it('renders organization name when present')
    it('renders activity count')
    it('renders enrollment count when applicable')
    it('renders logo image when present')
    it('renders placeholder when no logo')
  })
  
  describe('Status Badge', () => {
    it('shows Published badge for published certificates')
    it('shows Draft badge for draft certificates')
    it('shows Pending badge for pending approval')
    it('shows Enrolled badge when user is enrolled')
  })
  
  describe('Actions', () => {
    it('shows Enroll button when not enrolled')
    it('shows View Progress when enrolled')
    it('shows Edit button for creators')
    it('calls onEnroll when Enroll clicked')
    it('links to progress page when View Progress clicked')
  })
  
  describe('Styling', () => {
    it('applies hover state styles')
    it('uses different border color based on status')
  })
})
```

### 2. Implement Component

**File:** `src/features/certificates/components/CertificateCard.tsx`

## Acceptance Criteria

- [ ] All tests pass
- [ ] Component is used in browse page
- [ ] Browse page code reduced by ~80 lines
