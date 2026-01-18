---
id: TECH-0002
title: Enable stricter TypeScript settings
status: backlog
priority: medium
category: tech_debt
component: infrastructure
created: 2026-01-18
updated: 2026-01-18
effort: l
assignee: ai-agent
---

# Enable Stricter TypeScript Settings

## Summary

Some TypeScript strictness options may be relaxed. Enabling stricter settings will catch more bugs at compile time and improve code quality.

## Current Behavior

- Default Next.js TypeScript settings
- May allow some unsafe patterns
- `any` types may exist

## Expected Behavior

- Stricter type checking enabled
- All type errors fixed
- Better compile-time bug detection

## Acceptance Criteria

- [ ] Review and enable stricter tsconfig options
- [ ] Fix all resulting type errors
- [ ] Eliminate `any` types where possible
- [ ] Document any necessary exceptions

## Technical Approach

Consider enabling:
```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

## Dependencies

**Blocked By:**
- None (but do after major refactoring)

**Blocks:**
- None

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation |
