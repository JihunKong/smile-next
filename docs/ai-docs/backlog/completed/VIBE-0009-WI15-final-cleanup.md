---
id: VIBE-0009-WI15
title: Remove Dead Code & Final Cleanup
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: s
assignee: ai-agent
parent: VIBE-0009
---

# Remove Dead Code & Final Cleanup

## Summary

Remove any remaining dead code from the original files and ensure no duplicate logic exists.

## Acceptance Criteria

- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Linter passes
- [ ] Total lines in pages meet targets:
  - Take page: < 120 lines
  - Leaderboard: < 150 lines  
  - Results: < 100 lines

## Checklist

1. **Remove unused imports** from refactored pages
2. **Delete commented-out code** blocks
3. **Verify no duplicate utility functions** exist
4. **Run linter** and fix any issues
5. **Run all tests** to verify nothing is broken

## Verification Commands

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Run all inquiry-mode tests
npm test -- src/features/inquiry-mode

# Count lines in refactored files
wc -l src/app/\(dashboard\)/activities/\[id\]/inquiry/take/inquiry-take-client.tsx
wc -l src/app/\(dashboard\)/activities/\[id\]/inquiry/leaderboard/page.tsx
wc -l src/app/\(dashboard\)/activities/\[id\]/inquiry/\[attemptId\]/results/page.tsx
```

## Success Metrics

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| Total Lines | 1,479 | ~650 | ⬜ |
| Take Page Lines | 588 | <120 | ⬜ |
| Leaderboard Lines | 502 | <150 | ⬜ |
| Results Page Lines | 389 | <100 | ⬜ |
| Test Coverage | 0% | >80% | ⬜ |
| Reusable Components | 0 | 7 | ⬜ |
| Custom Hooks | 0 | 2 | ⬜ |

## Dependencies

**Blocked By:**
- VIBE-0009-WI11 (Take Page Refactor)
- VIBE-0009-WI12 (Leaderboard Refactor)
- VIBE-0009-WI13 (Results Page Refactor)
- VIBE-0009-WI14 (Update Exports)

**Blocks:**
- None (final work item)

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
