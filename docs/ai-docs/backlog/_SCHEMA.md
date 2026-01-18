# Backlog Item Schema

> **Purpose**: Template for creating new backlog items  
> **Copy this file** when creating new items

---

## File Naming

```
{ID}-{descriptive-slug}.md

ID Format:
  BUG-NNNN     - Bugs and defects
  FEAT-NNNN    - New features  
  REFACTOR-NNNN - Code refactoring
  TECH-NNNN    - Technical debt

Examples:
  BUG-0042-modal-not-closing-on-escape.md
  FEAT-0015-dark-mode-support.md
  REFACTOR-0008-extract-form-components.md
  TECH-0003-upgrade-to-react-19.md
```

---

## Template

Copy everything below this line into a new file:

---

```markdown
---
id: {ID}
title: {Short title - max 80 chars}
status: backlog
priority: critical|high|medium|low
category: bug|feature|refactoring|tech_debt
component: api|ui|services|database|auth|testing|docs|infrastructure
created: YYYY-MM-DD
updated: YYYY-MM-DD
effort: xs|s|m|l|xl
assignee: ai-agent|human|unassigned
---

# {Title}

## Summary

{One paragraph describing the issue or feature. What is the problem? Why does it matter?}

## Current Behavior

{What happens now? Include specific examples if relevant.}

## Expected Behavior

{What should happen instead? Be specific.}

## Acceptance Criteria

- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## Technical Approach

{How should this be implemented? Include code snippets, file paths, or architectural notes.}

## Related Files

- `path/to/file1.ts`
- `path/to/file2.tsx`

## Dependencies

**Blocked By:**
- {ID of blocking item, if any}

**Blocks:**
- {ID of item this blocks, if any}

## Notes

{Any additional context, discussion points, or things to consider.}

## Conversation History

<!-- AI agents: Add dated notes here when discussing with user -->

| Date | Note |
|------|------|
| YYYY-MM-DD | Initial creation |
```

---

## Field Definitions

### Status Values

| Status | Meaning |
|--------|---------|
| `backlog` | Not started, waiting to be picked up |
| `in_progress` | Currently being worked on |
| `review` | Implementation done, under review |
| `blocked` | Cannot proceed due to dependency |
| `done` | Completed and verified |
| `cancelled` | Will not be done |

### Priority Levels

| Priority | Folder | Meaning |
|----------|--------|---------|
| `critical` | `critical/` | Blocking development or causing data loss |
| `high` | `high/` | Significantly impacts UX or dev velocity |
| `medium` | `medium/` | Noticeable issues or improvements |
| `low` | `low/` | Nice-to-have, future consideration |

### Effort Estimates

| Size | Time | Examples |
|------|------|----------|
| `xs` | < 1 hour | Config change, typo fix |
| `s` | 1-4 hours | Simple component, bug fix |
| `m` | 4h - 2 days | Feature, multiple files |
| `l` | 2-5 days | Large feature, refactoring |
| `xl` | > 5 days | Architecture change |

### Component Values

| Component | Scope |
|-----------|-------|
| `ui` | React components, styling, UX |
| `api` | API routes, request handling |
| `services` | Business logic, external services |
| `database` | Prisma, queries, migrations |
| `auth` | Authentication, authorization |
| `testing` | Tests, test infrastructure |
| `docs` | Documentation |
| `infrastructure` | Build, deploy, config |

---

## Best Practices

1. **Descriptive Filenames**: Use clear, searchable slugs
2. **Specific Criteria**: Write testable acceptance criteria
3. **Link Dependencies**: Always note blocking relationships
4. **Track Conversations**: Log important discussions
5. **Update Regularly**: Keep status and dates current
