---
id: VIBE-0005-INDEX
title: Activity Pages Work Items Index
parent: VIBE-0005
---

# VIBE-0005: Activity Pages Refactor - Work Items Index

## Overview

This directory contains 21 discrete work items for the Activity Pages Refactor. Each item follows TDD (Test-Driven Development) and can be tracked independently.

**Goal:** Reduce `create/page.tsx` (775 lines) and `[id]/page.tsx` (691 lines) to ~100 lines each.

---

## Phase 1: Foundation Setup

| ID | Work Item | Effort | Status |
|----|-----------|--------|--------|
| [WI-01](WI-01-module-structure.md) | Create Activities Feature Module Structure | XS | ✅ Done |

---

## Phase 2: Custom Hooks (TDD)

| ID | Work Item | Effort | Dependencies | Status |
|----|-----------|--------|--------------|--------|
| [WI-02](WI-02-use-keyword-manager.md) | useKeywordManager Hook | S | WI-01 | ✅ Done |
| [WI-03](WI-03-use-scenario-manager.md) | useScenarioManager Hook | S | WI-01 | ✅ Done |
| [WI-04](WI-04-use-activity-form.md) | useActivityForm Hook | M | WI-02, WI-03 | ✅ Done |
| [WI-05](WI-05-use-create-activity.md) | useCreateActivity Hook | S | WI-01 | ✅ Done |

---

## Phase 3: Form Components (TDD)

| ID | Work Item | Effort | Dependencies | Status |
|----|-----------|--------|--------------|--------|
| [WI-06](WI-06-basic-info-fields.md) | BasicInfoFields Component | M | WI-01 | ✅ Done |
| [WI-07](WI-07-group-selector.md) | GroupSelector Component | M | WI-01 | ✅ Done |
| [WI-08](WI-08-general-settings.md) | GeneralSettings Component | M | WI-01 | ✅ Done |
| [WI-09](WI-09-exam-settings-form.md) | ExamSettingsForm Component | M | WI-01 | ✅ Done |
| [WI-10](WI-10-inquiry-settings-form.md) | InquirySettingsForm Component | M | WI-02 | ✅ Done |
| [WI-11](WI-11-case-settings-form.md) | CaseSettingsForm Component | M | WI-03 | ✅ Done |

---

## Phase 4: Detail Page Components (TDD)

| ID | Work Item | Effort | Dependencies | Status |
|----|-----------|--------|--------------|--------|
| [WI-12](WI-12-activity-header.md) | ActivityHeader Component | S | WI-01 | ✅ Done |
| [WI-13](WI-13-activity-stats.md) | ActivityStats Component | S | WI-01 | ✅ Done |
| [WI-14](WI-14-activity-actions.md) | ActivityActions Component | S | WI-01 | ✅ Done |

---

## Phase 5: Mode Content Components (TDD)

| ID | Work Item | Effort | Dependencies | Status |
|----|-----------|--------|--------------|--------|
| [WI-15](WI-15-open-mode-content.md) | OpenModeContent Component | S | WI-01 | ✅ Done |
| [WI-16](WI-16-exam-mode-content.md) | ExamModeContent Component | M | WI-01 | ✅ Done |
| [WI-17](WI-17-inquiry-mode-content.md) | InquiryModeContent Component | S | WI-01 | ✅ Done |
| [WI-18](WI-18-case-mode-content.md) | CaseModeContent Component | S | WI-01 | ✅ Done |

---

## Phase 6: Page Integration

| ID | Work Item | Effort | Dependencies | Status |
|----|-----------|--------|--------------|--------|
| [WI-19](WI-19-refactor-create-page.md) | Refactor Activity Create Page | M | WI-04-11 | ✅ Done |
| [WI-20](WI-20-refactor-detail-page.md) | Refactor Activity Detail Page | M | WI-12-18 | ✅ Done |

---

## Phase 7: Final Verification

| ID | Work Item | Effort | Dependencies | Status |
|----|-----------|--------|--------------|--------|
| [WI-21](WI-21-integration-testing.md) | Integration Testing & Cleanup | M | WI-19, WI-20 | ✅ Done |

---

## Progress Summary

- **Total Work Items:** 21
- **Completed:** 21
- **In Progress:** 0
- **Ready:** 0

## Execution Order

1. Start with **WI-01** (Module Structure)
2. **WI-02**, **WI-03**, **WI-05** can run in parallel (all depend on WI-01)
3. **WI-04** after WI-02 and WI-03
4. **WI-06 through WI-18** can mostly run in parallel (some depend on WI-02/WI-03)
5. **WI-19** after all form components complete (WI-04-11)
6. **WI-20** after all detail components complete (WI-12-18)
7. **WI-21** final verification after both pages refactored

## Commands Reference

```bash
# Run all unit tests
npm run test

# Run specific work item tests
npm run test -- tests/unit/hooks/activities/useKeywordManager.test.ts

# Run E2E tests
npm run test:e2e -- --grep activity

# Check line counts
wc -l src/app/\(dashboard\)/activities/create/page.tsx
wc -l src/app/\(dashboard\)/activities/\[id\]/page.tsx
```
