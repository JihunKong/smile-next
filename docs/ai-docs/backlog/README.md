---
id: backlog-index
title: Project Backlog Index
category: guides
lastUpdated: 2026-01-18
maintainedBy: ai-agent
version: 2.1.0
relatedDocs:
  - id: rules
    type: depends-on
  - id: ai-agent-memory
    type: see-also
tags:
  - backlog
  - project-management
  - ai-managed
---

# Project Backlog

> **Purpose**: AI-managed backlog for tracking bugs, features, and technical improvements  
> **Location**: `docs/ai-docs/backlog/`  
> **Maintained By**: AI Agent  
> **Format Version**: 2.1.0

## Overview

This backlog is organized as a folder of individual item files, making it easy for AI agents to:
- Understand each item's scope from the filename
- Update items independently without conflicts
- Discuss and refine items through conversation
- Track relationships between items

## Folder Structure

```
backlog/
├── README.md                    # This file - overview and status
├── _SCHEMA.md                   # Template for new items
├── critical/                    # 🔴 Blocking or high-impact issues
├── high/                        # 🟠 Important improvements
├── medium/                      # 🟡 Nice-to-have improvements
├── low/                         # 🟢 Future considerations
└── completed/                   # ✅ Done items (for reference)
```

## File Naming Convention

```
{ID}-{descriptive-slug}.md

Examples:
  REFACTOR-0001-react-query-data-fetching.md
  BUG-0001-inconsistent-loading-states.md
  FEAT-0001-toast-notification-system.md
  TECH-0001-error-boundaries.md
```

**ID Prefixes:**
- `BUG-NNNN` - Bugs and defects
- `FEAT-NNNN` - New features
- `REFACTOR-NNNN` - Code refactoring
- `TECH-NNNN` - Technical debt

---

## 📊 Backlog Summary

| Priority | Count | Items |
|----------|-------|-------|
| 🔴 Critical | 4 | React Query, UI Components, Unit Tests, Structured Logging |
| 🟠 High | 8 | **Conventions**, Loading States, Error Messages, Error Boundaries, Toast, CI Testing, API Standardization, Middleware |
| 🟡 Medium | 7 | API Client, Form Validation, Race Conditions, TypeScript, Env Validation, DB Migrations, Mobile E2E |
| 🟢 Low | 5 | Keyboard Nav, Component Docs, i18n, Dark Mode, Code Splitting |
| ✅ Completed | 0 | - |

**Total Active Items**: 24

### Overlapping Items Note

Some backlog items overlap significantly (see [BEST-0001](./high/BEST-0001-frontend-conventions-enforcement.md) for analysis):
- **BUG-0001** is solved by **REFACTOR-0002** (UI library provides LoadingSpinner)
- **BUG-0003** is solved by **REFACTOR-0001** (React Query handles race conditions)
- **BUG-0002** overlaps with **REFACTOR-0005** + Toast system

---

## 🔴 Critical Priority

| ID | Title | Status | Effort |
|----|-------|--------|--------|
| [REFACTOR-0001](./critical/REFACTOR-0001-react-query-data-fetching.md) | Implement React Query for data fetching | backlog | XL |
| [REFACTOR-0002](./critical/REFACTOR-0002-ui-component-library.md) | Create reusable UI component library | backlog | L |
| [TECH-0004](./critical/TECH-0004-unit-test-coverage.md) | Add unit test coverage for services | backlog | XL |
| [TECH-0005](./critical/TECH-0005-structured-logging.md) | Implement structured logging | backlog | M |

## 🟠 High Priority

| ID | Title | Status | Effort |
|----|-------|--------|--------|
| [BEST-0001](./high/BEST-0001-frontend-conventions-enforcement.md) | Enforce frontend conventions | backlog | S |
| [BUG-0001](./high/BUG-0001-inconsistent-loading-states.md) | Fix inconsistent loading states | backlog | M |
| [BUG-0002](./high/BUG-0002-unfriendly-error-messages.md) | Make error messages user-friendly | backlog | M |
| [TECH-0001](./high/TECH-0001-react-error-boundaries.md) | Add React Error Boundaries | backlog | S |
| [FEAT-0001](./high/FEAT-0001-toast-notification-system.md) | Implement toast notification system | backlog | M |
| [TECH-0006](./high/TECH-0006-ci-pipeline-testing.md) | Add tests to CI pipeline before deploy | backlog | S |
| [REFACTOR-0005](./high/REFACTOR-0005-api-response-standardization.md) | Standardize API response format | backlog | M |
| [FEAT-0003](./high/FEAT-0003-nextjs-middleware.md) | Add Next.js middleware | backlog | M |

## 🟡 Medium Priority

| ID | Title | Status | Effort |
|----|-------|--------|--------|
| [REFACTOR-0003](./medium/REFACTOR-0003-unified-api-client.md) | Create unified API client | backlog | M |
| [REFACTOR-0004](./medium/REFACTOR-0004-client-side-form-validation.md) | Add client-side Zod validation | backlog | M |
| [BUG-0003](./medium/BUG-0003-data-fetching-race-conditions.md) | Fix race conditions in data fetching | backlog | M |
| [TECH-0002](./medium/TECH-0002-typescript-strict-mode.md) | Enable stricter TypeScript settings | backlog | L |
| [TECH-0007](./medium/TECH-0007-environment-variable-validation.md) | Validate env vars at startup | backlog | S |
| [TECH-0008](./medium/TECH-0008-database-migration-strategy.md) | Document database migration strategy | backlog | S |
| [TECH-0009](./medium/TECH-0009-mobile-viewport-e2e-tests.md) | Add mobile viewport E2E tests | backlog | S |

## 🟢 Low Priority

| ID | Title | Status | Effort |
|----|-------|--------|--------|
| [FEAT-0002](./low/FEAT-0002-keyboard-navigation-accessibility.md) | Improve keyboard navigation | backlog | M |
| [TECH-0003](./low/TECH-0003-component-documentation.md) | Add JSDoc to all components | backlog | M |
| [FEAT-0004](./low/FEAT-0004-i18n-infrastructure.md) | Add i18n infrastructure | backlog | L |
| [FEAT-0005](./low/FEAT-0005-dark-mode-completion.md) | Complete dark mode implementation | backlog | M |
| [TECH-0010](./low/TECH-0010-code-splitting-lazy-loading.md) | Improve code splitting/lazy loading | backlog | M |

---

## 🤖 AI Management Instructions

### Starting Work on an Item

1. Read the item file to understand scope
2. Change `status: backlog` → `status: in_progress`
3. Update `updated` date
4. Begin implementation

### Completing an Item

1. Change `status: in_progress` → `status: done`
2. Update `updated` date
3. Add completion notes
4. Move file to `completed/` folder
5. Update this README summary

### Creating New Items

1. Copy `_SCHEMA.md` template
2. Generate next sequential ID for category
3. Create descriptive filename
4. Place in appropriate priority folder
5. Update this README summary

### Refining Items Through Conversation

When discussing an item with the user:
1. Read the item file for context
2. Propose updates based on conversation
3. Update description, acceptance criteria, or scope
4. Adjust priority/effort if understanding changes

### Moving Items Between Priorities

1. Move file to new priority folder
2. Update this README summary
3. Add note explaining priority change

---

## Related Documentation

- [Backlog Schema](./_SCHEMA.md) - Template for new items
- [AI Agent Memory](../AI_AGENT_MEMORY.md) - Quick reference
- [Rules](../RULES.md) - Backlog management rules

---

*This backlog is AI-managed. Run `ls docs/ai-docs/backlog/*/` to see all items.*
