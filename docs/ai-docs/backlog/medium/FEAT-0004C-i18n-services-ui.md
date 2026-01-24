---
id: FEAT-0004C
title: i18n Migration - Services and Remaining UI
status: backlog
priority: medium
category: feature
component: frontend
created: 2026-01-23
updated: 2026-01-23
effort: m
assignee: ai-agent
parent: FEAT-0004
---

# i18n Migration - Services and Remaining UI

## Summary

Migrate remaining Korean text from service files (badges, levels) and other UI components to use `next-intl` translations.

## Current Behavior

- `streakService.ts` has 13 badge definitions in Korean
- `levelService.ts` has tier names with `nameKo`/`descriptionKo` pattern
- `useCaseAttempt.ts` has Korean evaluation messages
- Various pages have Korean error messages

## Expected Behavior

- All Korean strings extracted to translation files
- Services use translation keys or provide both languages
- UI components use `useTranslations()` hook
- Consistent language display across the app

## Acceptance Criteria

- [ ] Badge names/descriptions migrated to translations
- [ ] Level/tier names migrated to translations
- [ ] Case mode evaluation messages migrated
- [ ] Error messages on questions pages migrated
- [ ] All UI displays consistently in selected language

## Technical Approach

### 1. Badge Translations

```json
// messages/en.json
{
  "badges": {
    "weeklyWarrior": {
      "name": "Weekly Warrior",
      "description": "Active for 7 consecutive days"
    },
    "monthlyMaster": {
      "name": "Monthly Master", 
      "description": "Active for 30 consecutive days"
    },
    // ... etc
  }
}
```

### 2. Update streakService.ts

Option A: Use translation keys in badge definitions
```typescript
const BADGES = {
  WEEKLY_STREAK: {
    id: 'weekly_streak',
    translationKey: 'badges.weeklyWarrior',
    icon: '🔥',
    // ...
  }
}
```

Option B: Keep both languages in service, let UI choose
```typescript
const BADGES = {
  WEEKLY_STREAK: {
    id: 'weekly_streak',
    name: { en: 'Weekly Warrior', ko: '주간 전사' },
    description: { en: '7 consecutive days', ko: '7일 연속 활동' },
    // ...
  }
}
```

### 3. Level Translations

The `levelService.ts` already has `nameKo`/`descriptionKo` - add English equivalents:

```typescript
SMILE_STARTER: {
  name: 'SMILE Starter',
  nameKo: 'SMILE 스타터',
  description: 'Beginning your SMILE journey',
  descriptionKo: 'SMILE 여정을 시작하는 단계',
}
```

Or migrate to translation files for cleaner code.

### 4. Case Mode Messages

```json
{
  "case": {
    "evaluation": {
      "initial": "AI is analyzing your response with 4 criteria...",
      "criticalThinking": "Analyzing critical thinking depth...",
      "realWorld": "Evaluating real-world applicability...",
      "finalizing": "Calculating final evaluation score...",
      "complete": "Evaluation complete! Redirecting to results..."
    },
    "confirm": {
      "incomplete": "{count} cases have incomplete responses. Submit anyway?",
      "submit": "Submit all cases? You cannot modify responses after submission."
    }
  }
}
```

### 5. Error Messages

```json
{
  "errors": {
    "loadData": "Unable to load data",
    "backToDashboard": "Back to Dashboard",
    "joinGroup": "Please join a group",
    "joinGroupDescription": "You must join a group to evaluate questions."
  }
}
```

## Files to Modify

### Service Files
- `src/lib/services/streakService.ts` - 13 badges
- `src/lib/services/levelService.ts` - 6 tiers

### Hooks
- `src/features/case-mode/hooks/useCaseAttempt.ts` - 5 messages

### UI Components
- `src/features/case-mode/components/CaseNavigator.tsx` - 1 string
- `src/features/case-mode/components/SaveToast.tsx` - 1 string
- `src/app/(dashboard)/activities/[id]/case/take/case-take-client.tsx` - 3+ strings

### Pages
- `src/app/(dashboard)/questions/my/page.tsx` - 3 strings
- `src/app/(dashboard)/questions/evaluate/page.tsx` - 6 strings

## Verification

```bash
# Run all E2E tests
npm run test:e2e

# Expected: All tests pass
```

### Manual Verification

1. Check profile/achievements page - badges display in correct language
2. Check case mode - evaluation messages display correctly
3. Check questions pages - error states display correctly

## Dependencies

**Blocked By:** 
- FEAT-0004A (Foundation)
- FEAT-0004B (Optional, but should complete Inquiry first)

**Blocks:** None

## Notes

- Lower priority than FEAT-0004B since these don't block E2E tests
- Can be done incrementally, one file at a time
- Consider which approach (translation keys vs inline) works best for services
