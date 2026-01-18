---
id: BEST-0001
title: Enforce frontend development conventions across codebase
status: backlog
priority: high
category: tech_debt
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: s
assignee: ai-agent
---

# Enforce Frontend Development Conventions

## Summary

This meta-item tracks the adoption of frontend conventions documented in `docs/ai-docs/guides/frontend-conventions.md`. The conventions address root causes of common UX bugs (inconsistent loading states, unfriendly errors, race conditions). This item ensures the conventions are followed in new code and gradually applied to existing code.

## Root Cause Analysis

The UX bugs in this codebase stem from **missing foundational conventions**:

| Bug | Root Cause | Prevention |
|-----|------------|------------|
| Inconsistent loading states | No shared UI components | Use `LoadingSpinner` from component library |
| Unfriendly error messages | No error handling strategy | Use `getUserFriendlyError()` + `ErrorState` |
| Race conditions | Manual useState/useEffect patterns | Use React Query hooks |
| Visual inconsistencies | Inline styles, copy-pasted code | Use shared UI components |

**Why did these issues occur?**
1. React Query was installed but never integrated - no convention enforced
2. No component library existed - developers wrote inline SVGs
3. No error message mapping - technical errors shown directly
4. No API response standard - each endpoint different

## Expected Behavior

1. **New code follows conventions** - Code reviews check against the guide
2. **Existing code migrated** - As files are touched, update to new patterns
3. **AI agents reference conventions** - Include guide link in prompts

## Acceptance Criteria

- [x] Frontend conventions guide created
- [ ] Guide linked in AI_AGENT_MEMORY.md
- [ ] At least one component migrated as example (activities page)
- [ ] ESLint rules to enforce patterns (optional, future)

## Technical Approach

### 1. Reference Conventions in AI Memory

Add to `docs/ai-docs/AI_AGENT_MEMORY.md`:

```markdown
## Development Conventions

Before implementing frontend features, review:
- [Frontend Conventions](./guides/frontend-conventions.md)

Key rules:
1. Use React Query for data fetching (not manual useState/useEffect)
2. Use `LoadingState`/`LoadingSpinner` components
3. Use `getUserFriendlyError()` for error messages
4. Use standard API response helpers
```

### 2. Migration Priority

When touching a file, migrate in this order:
1. Replace inline spinners with `LoadingSpinner`
2. Add user-friendly error handling
3. Convert to React Query (if data fetching exists)

### 3. Code Review Checklist

For PRs, verify:
- [ ] No manual useState for loading/error states
- [ ] No inline spinner SVGs
- [ ] Errors show user-friendly messages
- [ ] API routes use response helpers

## Related Items

This item consolidates understanding of root causes across:

| Item | Relationship | Notes |
|------|--------------|-------|
| REFACTOR-0001 | Implements | React Query prevents race conditions |
| REFACTOR-0002 | Implements | UI library provides LoadingSpinner |
| REFACTOR-0005 | Implements | API response standard |
| BUG-0001 | Supersedes | Solved by REFACTOR-0002 |
| BUG-0002 | Overlaps | Solved by error utilities + toast |
| BUG-0003 | Supersedes | Solved by REFACTOR-0001 |

## Backlog Consolidation Notes

Several backlog items overlap significantly:

1. **BUG-0001 + REFACTOR-0002**: Loading states bug is a subset of UI component library. Once REFACTOR-0002 is done, BUG-0001 is solved. Consider marking BUG-0001 as duplicate.

2. **BUG-0003 + REFACTOR-0001**: Race conditions are automatically solved by React Query. BUG-0003 can be closed when REFACTOR-0001 is done.

3. **BUG-0002 + REFACTOR-0005 + REFACTOR-0003**: Error messages depend on both API standardization and an error utilities layer. Consider combining or creating clear dependency chain.

## Dependencies

**Blocked By:**
- REFACTOR-0002 (needs LoadingSpinner)
- REFACTOR-0001 (needs React Query hooks)

**Blocks:**
- None

## Notes

This is a **process item** rather than a code change. The actual implementations are tracked in the related items. This item ensures:
1. Conventions are documented and discoverable
2. Root causes are understood
3. Overlapping items are clarified
4. New code follows patterns from day one

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created based on root cause analysis of UX bugs |
