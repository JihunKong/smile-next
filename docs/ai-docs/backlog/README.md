---
id: backlog-index
title: Project Backlog Index
category: guides
lastUpdated: 2026-01-18
maintainedBy: ai-agent
version: 2.3.0
relatedDocs:
  - id: rules
    type: depends-on
  - id: ai-agent-memory
    type: see-also
tags:
  - backlog
  - project-management
  - ai-managed
  - vibe-coding
---

# Project Backlog

> **Purpose**: AI-managed backlog for tracking bugs, features, and technical improvements  
> **Location**: `docs/ai-docs/backlog/`  
> **Maintained By**: AI Agent  
> **Format Version**: 2.2.0

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

---

## 🎯 TOP PRIORITY: Vibe Coding Refactoring

> **Goal**: Make the codebase AI-friendly for rapid redesign and iteration  
> **Why**: Large monolithic files (1000+ lines) prevent effective AI-assisted development. Breaking them into focused ~100-200 line files enables "vibe coding" where designers and AI can quickly iterate.

### The Problem

The codebase has **20+ files over 500 lines**, with the largest at **1134 lines**. When files exceed ~500 lines:
- AI agents can't see the full file in context
- Edits are made with partial understanding
- Risk of breaking unrelated functionality
- Designers can't easily find what to modify

### VIBE Priority Order

| Priority | ID | Target | Lines | Description |
|----------|-----|--------|-------|-------------|
| 🔴 **1** | [VIBE-0001](./critical/VIBE-0001-activity-edit-refactor.md) | Activity Edit | 1134 | **Largest file** - break into feature folder |
| 🔴 **2** | [VIBE-0002](./critical/VIBE-0002-case-mode-refactor.md) | Case Mode (all) | 3806 | **Most complex** - broken into 4 sub-items |
| 🔴 **3** | [VIBE-0003](./critical/VIBE-0003-dashboard-refactor.md) | Dashboard | 977 | **Central hub** - high visibility for redesign |
| ✅ **4** | [VIBE-0004](./completed/VIBE-0004-exam-mode-refactor.md) | Exam Mode (all) | 1924 | ✅ Completed 2026-01-29 |
| 🟠 **5** | [VIBE-0005](./high/VIBE-0005-activity-pages-refactor.md) | Activity Create/Detail | 1464 | Core user journey pages |
| 🟠 **6** | [VIBE-0006](./high/VIBE-0006-groups-pages-refactor.md) | Groups (all) | 2259 | Member management, group creation |
| 🟠 **7** | [VIBE-0007](./high/VIBE-0007-certificates-refactor.md) | Certificates (all) | 2333 | Designer + progress tracking |
| ✅ **8** | [VIBE-0008](./completed/VIBE-0008-settings-profile-refactor.md) | Settings & Profile | 2916 | ✅ Completed 2026-01-28 |
| ✅ **9** | [VIBE-0009](./completed/VIBE-0009-inquiry-mode-refactor.md) | Inquiry Mode (all) | 1476 | ✅ Completed 2026-01-29 |

**Total Lines to Refactor**: ~18,289 lines across 9 initiatives

### Target Architecture

Each feature area becomes a focused module:

```
src/features/
├── activities/           # Activity create, edit, detail
├── case-mode/            # Case mode components + hooks
├── exam-mode/            # Exam mode components + hooks
├── inquiry-mode/         # Inquiry mode components + hooks
├── certificates/         # Certificate designer, progress
├── groups/               # Group management
├── user/                 # Settings, profile
└── shared/               # Cross-feature components (Timer, etc.)
```

**File Size Targets**:
- Pages: ~80-150 lines (composition only)
- Components: ~80-200 lines each
- Hooks: ~60-150 lines each
- Types: as needed

---

## 📊 Full Backlog Summary

| Priority | Count | Focus Areas |
|----------|-------|-------------|
| 🔴 Critical | 18 | **VIBE refactoring (4 + 10 sub-items)**, React Query, UI Components, Unit Tests, Logging |
| 🟠 High | 13 | **VIBE refactoring (5)**, Conventions, Error Handling, Toast, CI Testing |
| 🟡 Medium | 7 | API Client, Form Validation, TypeScript, DB Migrations |
| 🟢 Low | 5 | Keyboard Nav, i18n, Dark Mode, Code Splitting |
| ✅ Completed | 5 | VIBE-0002B, VIBE-0002C, VIBE-0004, VIBE-0008, VIBE-0009 |

**Total Active Items**: 43 (including VIBE-0002 and VIBE-0003 sub-items)

---

## 🔴 Critical Priority

### Vibe Coding (Top Priority)

| ID | Title | Status | Effort | Lines |
|----|-------|--------|--------|-------|
| [VIBE-0001](./critical/VIBE-0001-activity-edit-refactor.md) | Refactor Activity Edit page | backlog | L | 1134 |
| [VIBE-0002](./critical/VIBE-0002-case-mode-refactor.md) | Refactor Case Mode pages (parent) | backlog | XL | 3806 |
| ↳ [VIBE-0002A](./critical/VIBE-0002A-case-unit-tests.md) | Unit Tests for Server Actions | backlog | M | - |
| ↳ [VIBE-0002B](./completed/VIBE-0002B-case-types-foundation.md) | Types & Foundation | ✅ done | S | - |
| ↳ [VIBE-0002C](./completed/VIBE-0002C-case-results-leaderboard.md) | Results & Leaderboard Refactor | ✅ done | M | 981 |
| ↳ [VIBE-0002D](./critical/VIBE-0002D-case-take-configure-review.md) | Take/Configure/Review Refactor | backlog | L | 2825 |
| [VIBE-0003](./critical/VIBE-0003-dashboard-refactor.md) | Refactor Dashboard page (parent) | backlog | M | 977 |
| ↳ [VIBE-0003A](./critical/VIBE-0003A-dashboard-types-tier-utils.md) | Types & Tier Utils with Tests | backlog | XS | - |
| ↳ [VIBE-0003B](./critical/VIBE-0003B-dashboard-data-fetching.md) | Data Fetching Layer with Tests | backlog | S | - |
| ↳ [VIBE-0003C](./critical/VIBE-0003C-dashboard-simple-ui.md) | Simple UI Components with Tests | backlog | S | - |
| ↳ [VIBE-0003D](./critical/VIBE-0003D-dashboard-stats-grid.md) | StatsGrid Component with Tests | backlog | M | - |
| ↳ [VIBE-0003E](./critical/VIBE-0003E-dashboard-activity-feeds.md) | Activity Feeds with Tests | backlog | S | - |
| ↳ [VIBE-0003F](./critical/VIBE-0003F-dashboard-achievement-showcase.md) | Achievement Showcase with Tests | backlog | S | - |
| ↳ [VIBE-0003G](./critical/VIBE-0003G-dashboard-certificate-progress.md) | Certificate Progress with Tests | backlog | M | - |
| ↳ [VIBE-0003H](./critical/VIBE-0003H-dashboard-final-composition.md) | Final Composition & Validation | backlog | S | - |
| [VIBE-0004](./completed/VIBE-0004-exam-mode-refactor.md) | Refactor Exam Mode pages | ✅ done | L | 1924 |

### Other Critical Items

| ID | Title | Status | Effort |
|----|-------|--------|--------|
| [REFACTOR-0001](./critical/REFACTOR-0001-react-query-data-fetching.md) | Implement React Query for data fetching | backlog | XL |
| [REFACTOR-0002](./critical/REFACTOR-0002-ui-component-library.md) | Create reusable UI component library | backlog | L |
| [TECH-0004](./critical/TECH-0004-unit-test-coverage.md) | Add unit test coverage for services | backlog | XL |
| [TECH-0005](./critical/TECH-0005-structured-logging.md) | Implement structured logging | backlog | M |

## 🟠 High Priority

### Vibe Coding (Continued)

| ID | Title | Status | Effort | Lines |
|----|-------|--------|--------|-------|
| [VIBE-0005](./completed/VIBE-0005-activity-pages-refactor.md) | Refactor Activity Create/Detail | backlog | M | 1464 |
| [VIBE-0006](./completed/VIBE-0006-groups-pages-refactor.md) | Refactor Groups pages | backlog | L | 2259 |
| [VIBE-0007](./high/VIBE-0007-certificates-refactor.md) | Refactor Certificates pages | backlog | M | 2333 |
| [VIBE-0008](./completed/VIBE-0008-settings-profile-refactor.md) | Refactor Settings & Profile | ✅ done | M | 2916 |
| [VIBE-0009](./completed/VIBE-0009-inquiry-mode-refactor.md) | Refactor Inquiry Mode pages | ✅ done | M | 1476 |

### Other High Items

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

## File Naming Convention

```
{ID}-{descriptive-slug}.md

Examples:
  VIBE-0001-activity-edit-refactor.md      # Vibe coding refactor
  REFACTOR-0001-react-query-data-fetching.md
  BUG-0001-inconsistent-loading-states.md
  FEAT-0001-toast-notification-system.md
  TECH-0001-error-boundaries.md
```

**ID Prefixes:**
- `VIBE-NNNN` - Vibe coding / AI-friendly refactoring
- `BUG-NNNN` - Bugs and defects
- `FEAT-NNNN` - New features
- `REFACTOR-NNNN` - Code refactoring
- `TECH-NNNN` - Technical debt

---

## 🤖 AI Management Instructions

### Working on VIBE Items

VIBE items are **top priority** for the redesign. When working on these:

1. **Read the full item** - understand target architecture
2. **Extract in order**: Types → Hooks → Components → Compose page
3. **Test after each extraction** - don't break functionality
4. **Keep files small** - target 80-200 lines each
5. **Create barrel exports** - `index.ts` for clean imports

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

---

## Related Documentation

- [Backlog Schema](./_SCHEMA.md) - Template for new items
- [AI Agent Memory](../AI_AGENT_MEMORY.md) - Quick reference
- [Rules](../RULES.md) - Backlog management rules
- [Frontend Conventions](../guides/frontend-conventions.md) - Coding standards

---

*This backlog is AI-managed. Run `ls docs/ai-docs/backlog/*/` to see all items.*
