---
id: VIBE-0009-WI11
title: Refactor Inquiry Take Page
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: l
assignee: ai-agent
parent: VIBE-0009
---

# Refactor Inquiry Take Page

## Summary

Refactor `inquiry/take/inquiry-take-client.tsx` (588 lines) to use the extracted hooks and components. Target: under 120 lines.

## Current Behavior

The take page is a monolithic 588-line component containing:
- All state management
- All UI components inline
- Helper functions for styling
- Complete JSX for all views

## Expected Behavior

A lean page component (~120 lines) that:
- Imports and uses `useInquiryAttempt` hook
- Composes extracted components
- Handles only page-level layout and routing
- Preserves anti-cheat integration

## Acceptance Criteria

- [ ] Page is under 120 lines
- [ ] All existing functionality preserved
- [ ] Uses extracted hooks and components:
  - `useInquiryAttempt`
  - `KeywordInput`
  - `QuestionSubmissionCard`
  - `InquiryProgress`
- [ ] Anti-cheat functionality works
- [ ] Timer integration works
- [ ] E2E tests pass

## Technical Approach

### Step 1: Update Imports

```typescript
import { useInquiryAttempt } from '@/features/inquiry-mode/hooks'
import { 
  KeywordInput,
  QuestionSubmissionCard,
  InquiryProgress,
} from '@/features/inquiry-mode/components'
import { ExamTimer } from '@/components/modes/ExamTimer'
import { TabSwitchWarning } from '@/components/modes/TabSwitchWarning'
import { useAntiCheat } from '@/hooks/useAntiCheat'
```

### Step 2: Replace State with Hook

```typescript
export function InquiryTakeClient(props: InquiryTakeClientProps) {
  const inquiry = useInquiryAttempt(props)
  
  // Anti-cheat integration (kept in page)
  const { stats, isWarningVisible, dismissWarning } = useAntiCheat({
    enabled: true,
    onStatsChange: (stats) => updateInquiryCheatingStats(inquiry.attemptId, stats),
  })
  
  // ...rest uses inquiry.* values
}
```

### Step 3: Replace Inline JSX with Components

Replace lines 313-373 (keyword pools) with:
```tsx
<KeywordInput
  keywords={selectedKeywords}
  onAdd={handleAddKeyword}
  onRemove={handleRemoveKeyword}
  keywordPool1={inquiry.keywordPool1}
  keywordPool2={inquiry.keywordPool2}
/>
```

Replace lines 457-539 (submitted questions) with:
```tsx
{inquiry.submittedQuestions.map((q, i) => (
  <QuestionSubmissionCard key={q.id} question={q} index={i} />
))}
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx`
- All WI-02 through WI-09 components and hooks

## Dependencies

**Blocked By:**
- VIBE-0009-WI05 (KeywordInput)
- VIBE-0009-WI06 (QuestionSubmissionCard)
- VIBE-0009-WI07 (InquiryProgress)
- VIBE-0009-WI09 (useInquiryAttempt)

**Blocks:**
- VIBE-0009-WI15 (Final Cleanup)

## Verification

```bash
# Type check
npx tsc --noEmit

# Run E2E tests for inquiry
npm run test:e2e -- --grep "inquiry"

# Manual verification
# 1. Start inquiry attempt
# 2. Submit questions
# 3. Verify timer works
# 4. Verify completion flow
```

## Notes

- Keep anti-cheat hook usage in the page component
- Preserve all Korean text strings
- Timer must reset after each question submission

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
