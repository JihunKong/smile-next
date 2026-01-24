---
id: VIBE-0009-WI13
title: Refactor Inquiry Results Page
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: m
assignee: ai-agent
parent: VIBE-0009
---

# Refactor Inquiry Results Page

## Summary

Refactor `inquiry/[attemptId]/results/page.tsx` (389 lines) to use extracted components and hooks. Target: under 100 lines.

## Current Behavior

The results page has inline implementations of:
- Score color helper functions
- Bloom's badge rendering
- Individual result card rendering
- Score breakdown display

## Expected Behavior

A lean page component (~100 lines) that:
- Uses `useInquiryResults` hook for data processing
- Composes `InquiryResultCard` components
- Uses `QualityScoreDisplay` and `BloomsBadge`

## Acceptance Criteria

- [ ] Page is under 100 lines
- [ ] Uses extracted hooks and components:
  - `useInquiryResults`
  - `InquiryResultCard`
  - `QualityScoreDisplay`
  - `BloomsBadge`
- [ ] All existing functionality preserved
- [ ] Expandable question details work

## Technical Approach

### Step 1: Update Imports

```typescript
import { useInquiryResults } from '@/features/inquiry-mode/hooks'
import { 
  InquiryResultCard,
  QualityScoreDisplay,
  BloomsBadge 
} from '@/features/inquiry-mode/components'
```

### Step 2: Replace Inline Logic with Hook

```typescript
const results = useInquiryResults({ 
  questions: questionsWithEvaluations,
  passThreshold: activity.settings.passThreshold
})
```

### Step 3: Replace Inline Components

Replace inline result cards with:
```tsx
{questions.map((q, i) => (
  <InquiryResultCard key={q.id} question={q} index={i} />
))}
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/[attemptId]/results/page.tsx`
- `src/features/inquiry-mode/components/InquiryResultCard.tsx`
- `src/features/inquiry-mode/hooks/useInquiryResults.ts`

## Dependencies

**Blocked By:**
- VIBE-0009-WI08 (InquiryResultCard)
- VIBE-0009-WI10 (useInquiryResults)

**Blocks:**
- VIBE-0009-WI15 (Final Cleanup)

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
