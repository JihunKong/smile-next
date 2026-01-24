---
id: FEAT-0004B
title: i18n Migration - Inquiry Mode Page
status: backlog
priority: high
category: feature
component: frontend
created: 2026-01-23
updated: 2026-01-23
effort: m
assignee: ai-agent
parent: FEAT-0004
---

# i18n Migration - Inquiry Mode Page

## Summary

Migrate all Korean text in the Inquiry Mode take page to use `next-intl` translations. This is the largest single file with Korean text (~80+ strings) and will fix the failing E2E tests.

## Current Behavior

- `inquiry-take-client.tsx` has entire UI in Korean
- E2E tests fail looking for English text patterns
- No translation keys used

## Expected Behavior

- All Korean text extracted to `messages/ko.json`
- English equivalents in `messages/en.json`
- Component uses `useTranslations()` hook
- E2E tests pass with default English locale

## Acceptance Criteria

- [ ] All Korean strings in `inquiry-take-client.tsx` replaced with translation keys
- [ ] Translation keys added to `messages/en.json`
- [ ] Translation keys added to `messages/ko.json` (preserving original Korean)
- [ ] Component renders correctly in English (default)
- [ ] Component renders correctly in Korean (when locale set)
- [ ] E2E test `inquiry.spec.ts` passes

## Technical Approach

### 1. Create Inquiry Translations

```json
// messages/en.json - add inquiry section
{
  "inquiry": {
    "header": {
      "mode": "Inquiry Learning Mode",
      "progress": "Question {current} / {total}"
    },
    "keywords": {
      "hint": "Question Hint: Use the keywords below",
      "concepts": "Concept Keywords", 
      "actions": "Action Keywords",
      "tip": "Tip: Click a keyword to add it to your question"
    },
    "input": {
      "title": "Write Your Question",
      "description": "Create a creative question using the keywords above. Higher level questions earn more points.",
      "placeholder": "Example: Connect 'photosynthesis' and 'compare' - What are the differences between photosynthesis and respiration?",
      "charCount": "{count} / 500 characters",
      "canSubmit": "Ready to submit"
    },
    "submit": {
      "button": "Submit Question",
      "submitting": "Submitting..."
    },
    "submitted": {
      "title": "Submitted Questions ({count}/{total})",
      "averageScore": "Average Score:",
      "evaluating": "AI Evaluating...",
      "error": "Error occurred"
    },
    "complete": {
      "title": "All questions submitted!",
      "description": "You have successfully submitted {count} questions. Check your results.",
      "button": "View Results",
      "processing": "Processing..."
    },
    "feedback": {
      "excellent": "Excellent!",
      "good": "Good",
      "needsImprovement": "Needs improvement"
    },
    "blooms": {
      "remember": "Remember",
      "understand": "Understand",
      "apply": "Apply",
      "analyze": "Analyze",
      "evaluate": "Evaluate",
      "create": "Create"
    },
    "status": {
      "completed": "{count} completed",
      "remaining": "{count} remaining"
    }
  }
}
```

### 2. Update Component

```typescript
// inquiry-take-client.tsx
import { useTranslations } from 'next-intl'

export function InquiryTakeClient(props) {
  const t = useTranslations('inquiry')
  
  return (
    <header>
      <p>{t('header.mode')}</p>
      <div>{t('header.progress', { current: currentQuestion, total: questionsRequired })}</div>
    </header>
    // ... etc
  )
}
```

### 3. Handle Bloom's Level Translations

```typescript
function getBloomsLabel(level: string) {
  const t = useTranslations('inquiry.blooms')
  return t(level.toLowerCase())
}
```

## Verification

```bash
# Run the failing E2E tests
npm run test:e2e -- tests/e2e/modes/inquiry.spec.ts

# Expected: All tests pass
```

### Manual Verification

1. Navigate to `/activities/{id}/inquiry/take`
2. Verify UI displays in English by default
3. Set cookie `NEXT_LOCALE=ko`
4. Reload and verify UI displays in Korean

## Dependencies

**Blocked By:** 
- FEAT-0004A (Foundation must be in place)

**Blocks:** None

## Files to Modify

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx`
- `messages/en.json`
- `messages/ko.json`

## Notes

- This is the highest priority migration as it fixes the E2E tests
- Approximately 40+ string replacements needed
- Use ICU message format for interpolation (e.g., `{count}`)
