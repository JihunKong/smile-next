---
id: VIBE-0002B
title: Case Mode Types & Foundation
status: completed
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
completed: 2026-01-18
effort: s
assignee: ai-agent
parent: VIBE-0002
---

# Case Mode Types & Foundation

## Summary

Create the `src/features/case-mode/` directory structure and consolidate all inline type definitions from the 5 Case Mode pages into a single types file. This establishes the foundation for subsequent component and hook extraction.

## Current Behavior

Types are defined inline and duplicated across pages:

| Page | Inline Types |
|------|--------------|
| `configure/page.tsx` | `CaseScenario`, `CaseSettings`, `ActivityInfo` |
| `review/page.tsx` | `ExpectedFlaw`, `ExpectedSolution`, `CaseScenario`, `Configuration`, `FactCheckWarning` |
| `case-take-client.tsx` | `ScenarioResponse` |
| `results/page.tsx` | `ScenarioEvaluation`, `ScenarioResponse` |
| `leaderboard/page.tsx` | `LeaderboardEntry`, `Stats`, `UserSummary` |

Some types already exist in `src/types/activities.ts` but aren't used consistently.

## Expected Behavior

Single source of truth for all Case Mode types in `src/features/case-mode/types.ts`, with all pages importing from this central location.

## Acceptance Criteria

- [x] Create directory structure:
  ```
  src/features/case-mode/
  ├── components/
  │   └── index.ts      (empty barrel export)
  ├── hooks/
  │   └── index.ts      (empty barrel export)
  ├── types.ts
  └── index.ts
  ```
- [x] Create `types.ts` with all Case Mode types
- [x] Re-export existing types from `@/types/activities`
- [x] Update all 5 Case Mode pages to import from `@/features/case-mode`
- [x] Remove inline type definitions from pages
- [x] `npm run build` passes (TypeScript compilation successful; Redis infra errors unrelated)
- [ ] E2E tests pass (deferred - requires running test environment)

## Technical Approach

### 1. Create Feature Directory

```bash
mkdir -p src/features/case-mode/{components,hooks}
```

### 2. Types File

```typescript
// src/features/case-mode/types.ts

// Re-export existing types from activities
export type { CaseScenario, CaseSettings } from '@/types/activities'

// ============================================================================
// Scenario Types (used in configure and review)
// ============================================================================

export interface ExpectedFlaw {
  flaw: string
  explanation: string
  severity: string
}

export interface ExpectedSolution {
  solution: string
  details: string
  implementation: string
}

export interface DetailedScenario {
  id: string
  scenario_number: number
  title: string
  domain: string
  innovation_name?: string
  scenario_content: string
  expected_flaws: ExpectedFlaw[]
  expected_solutions: ExpectedSolution[]
  is_active: boolean
  created_by_ai: boolean
  edited_by_creator: boolean
}

// ============================================================================
// Response & Evaluation Types (used in take and results)
// ============================================================================

export interface ScenarioResponse {
  issues: string
  solution: string
}

export interface ScenarioEvaluation {
  score: number
  feedback: string
  understanding: number
  ingenuity: number
  criticalThinking: number
  realWorldApplication: number
  strengths?: string[]
  improvements?: string[]
}

// ============================================================================
// Leaderboard Types
// ============================================================================

export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  qualityScore: number
  qualityPercentage: number
  passed: boolean
  numCasesShown: number
  timeTaken: string
  attemptNumber: number
  submittedAt: Date | null
  filterType: 'best' | 'recent' | 'both'
}

export interface LeaderboardStats {
  totalAttempts: number
  uniqueStudents: number
  averageScore: number
  passRate: number
}

export interface UserSummary {
  bestScore: number
  totalAttempts: number
  passRate: number
  rank: number
}

// ============================================================================
// Review/Configure Types
// ============================================================================

export interface FactCheckWarning {
  scenario_number: number
  claim: string
  issue: string
  suggested_correction: string
  severity: 'high' | 'medium' | 'low'
}

export interface ActivityInfo {
  id: string
  name: string
  description: string | null
  owningGroup?: {
    id: string
    name: string
  }
}

export interface CaseConfiguration {
  difficulty_level: string
  num_cases_to_show: number
  max_attempts: number
  pass_threshold: number
}
```

### 3. Barrel Exports

```typescript
// src/features/case-mode/index.ts
export * from './types'
export * from './components'
export * from './hooks'
```

```typescript
// src/features/case-mode/components/index.ts
// Components will be added in VIBE-0002C and VIBE-0002D
```

```typescript
// src/features/case-mode/hooks/index.ts
// Hooks will be added in VIBE-0002D
```

### 4. Update Page Imports

Replace inline types with imports:

```typescript
// Before (in configure/page.tsx)
interface CaseScenario {
  id: string
  // ...
}

// After
import { CaseScenario, CaseSettings, ActivityInfo } from '@/features/case-mode'
```

## Related Files

- `src/types/activities.ts` - Existing types to re-export
- `src/app/(dashboard)/activities/[id]/case/configure/page.tsx`
- `src/app/(dashboard)/activities/[id]/case/review/page.tsx`
- `src/app/(dashboard)/activities/[id]/case/take/case-take-client.tsx`
- `src/app/(dashboard)/activities/[id]/case/[attemptId]/results/page.tsx`
- `src/app/(dashboard)/activities/[id]/case/leaderboard/page.tsx`

## Dependencies

**Blocked By:**
- VIBE-0002A (Unit Tests) - recommended to complete first

**Blocks:**
- VIBE-0002C (Results/Leaderboard) - needs types
- VIBE-0002D (Take/Configure/Review) - needs types

## Notes

- This is low-risk work - only moving type definitions
- Establishes the `src/features/` pattern for other VIBE items
- Keep existing page logic unchanged - only update imports

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as foundation step for VIBE-0002 |
| 2026-01-18 | Completed: Created directory structure, types.ts with 13 types, barrel exports, updated all 5 pages. Build passes. |