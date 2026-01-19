---
id: VIBE-0002
title: Refactor Case Mode pages for AI-friendly development (3825 total lines)
status: completed
priority: critical
completed: 2026-01-19
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-18
effort: xl
assignee: ai-agent
---

# Refactor Case Mode Pages for Vibe Coding

> **Parent Item**: This has been broken into 4 sub-tasks. See individual items below.

## Sub-Items

| ID | Title | Effort | Status | Description |
|----|-------|--------|--------|-------------|
| [VIBE-0002A](./VIBE-0002A-case-unit-tests.md) | Unit Tests for Case Server Actions | M | ✅ done | Pre-requisite: Write unit tests before refactoring |
| [VIBE-0002B](./VIBE-0002B-case-types-foundation.md) | Case Mode Types & Foundation | S | backlog | Create feature module structure, consolidate types |
| [VIBE-0002C](./VIBE-0002C-case-results-leaderboard.md) | Case Results & Leaderboard Refactor | M | backlog | Extract components, simplify server component pages |
| [VIBE-0002D](./VIBE-0002D-case-take-configure-review.md) | Case Take/Configure/Review Refactor | L | backlog | Extract hooks, simplify complex client pages |

## Execution Order

```
VIBE-0002A (Unit Tests)
    ↓
VIBE-0002B (Foundation)
    ↓
VIBE-0002C (Results/Leaderboard)
    ↓
VIBE-0002D (Take/Configure/Review)
```

## Summary

Case Mode is the most complex feature with **5 mega-files totaling 3,806 lines**. This makes the entire Case Mode experience nearly impossible to modify via AI assistance. A designer wanting to change the Case Mode UI must navigate thousands of lines across multiple files.

| File | Lines | Purpose |
|------|-------|---------|
| `case/configure/page.tsx` | 1096 | Admin: set up case scenarios |
| `case/review/page.tsx` | 935 | Admin: review student attempts |
| `case/take/case-take-client.tsx` | 794 | Student: take case exam |
| `case/[attemptId]/results/page.tsx` | 541 | Student: view results |
| `case/leaderboard/page.tsx` | 440 | Leaderboard display |
| **Total** | **3,806** | |

## Target Architecture

```
src/features/case-mode/
├── components/
│   ├── AIGenerationPanel.tsx      (~100 lines)
│   ├── CaseResultCard.tsx         (~100 lines)
│   ├── CaseTimer.tsx              (~60 lines)
│   ├── EvaluationBreakdown.tsx    (~100 lines)
│   ├── GradingRubric.tsx          (~100 lines)
│   ├── ScenarioCard.tsx           (~80 lines)
│   ├── ScenarioEditor.tsx         (~120 lines)
│   ├── ScenarioList.tsx           (~100 lines)
│   ├── ScoreDisplay.tsx           (~60 lines)
│   └── index.ts
├── hooks/
│   ├── useCaseAttempt.ts          (~200 lines)
│   ├── useCaseReview.ts           (~150 lines)
│   ├── useCaseSettings.ts         (~150 lines)
│   ├── useScenarioDragDrop.ts     (~50 lines)
│   └── index.ts
├── types.ts                       (~100 lines)
└── index.ts
```

## Overall Acceptance Criteria

- [ ] All page files under 150 lines
- [ ] All component files under 200 lines
- [ ] Unit tests for server actions (VIBE-0002A)
- [ ] Unit tests for extracted hooks (VIBE-0002D)
- [ ] E2E tests pass (existing)
- [ ] No changes to user-facing functionality
- [ ] TypeScript builds without errors

## Related Files

- `src/app/(dashboard)/activities/[id]/case/` - All case mode pages
- `src/app/(dashboard)/activities/[id]/case/actions.ts` - Server actions
- `src/lib/services/caseEvaluationService.ts` - AI evaluation
- `src/components/modes/` - Some shared mode components exist
- `tests/e2e/modes/case.spec.ts` - E2E tests

## Dependencies

**Blocked By:**
- None

**Blocks:**
- VIBE-0006 (Exam Mode) - can share timer/progress components
- VIBE-0008 (Inquiry Mode) - similar patterns

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - Case Mode identified as highest complexity area |
| 2026-01-18 | Scoped and broken into 4 sub-items (VIBE-0002A through D) |
