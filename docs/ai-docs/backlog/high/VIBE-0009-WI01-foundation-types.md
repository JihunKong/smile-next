---
id: VIBE-0009-WI01
title: Inquiry Mode Foundation - Create Module Structure & Types
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

# Create Inquiry Mode Feature Module Structure & Types

## Summary

Set up the `src/features/inquiry-mode/` directory structure and define TypeScript types based on existing code analysis. This is the **blocking foundation** for all other work items in the VIBE-0009 refactor.

## Current Behavior

Types are defined inline within individual page components:
- `inquiry-take-client.tsx` (lines 11-30): `SubmittedQuestion`, `InquiryTakeClientProps`
- `leaderboard/page.tsx` (lines 11-39): `LeaderboardEntry`, `Stats`, `UserSummary`
- `results/page.tsx` (lines 10-30): `EvaluationData`, `QuestionWithEvaluation`

## Expected Behavior

```
src/features/inquiry-mode/
├── components/
│   ├── __tests__/
│   └── index.ts
├── hooks/
│   ├── __tests__/
│   └── index.ts
├── types.ts           (~80 lines)
└── index.ts
```

## Acceptance Criteria

- [ ] `src/features/inquiry-mode/` directory exists with proper structure
- [ ] All types extracted and defined in `types.ts`
- [ ] All index.ts files export correctly
- [ ] Types compile without TypeScript errors
- [ ] Types are documented with JSDoc comments

## Technical Approach

### Step 1: Create Directory Structure

```bash
mkdir -p src/features/inquiry-mode/components/__tests__
mkdir -p src/features/inquiry-mode/hooks/__tests__
```

### Step 2: Create types.ts

Extract types from the source files and consolidate:

```typescript
// src/features/inquiry-mode/types.ts

/**
 * Evaluation status for a submitted question
 */
export type EvaluationStatus = 'pending' | 'evaluating' | 'completed' | 'error'

/**
 * A question submitted during an inquiry attempt
 * From inquiry-take-client.tsx (lines 11-18)
 */
export interface SubmittedQuestion {
  id: string
  content: string
  score: number | null
  bloomsLevel: string | null
  feedback: string | null
  evaluationStatus?: EvaluationStatus
}

/**
 * Initial data for an inquiry attempt session
 * From inquiry-take-client.tsx (lines 20-30)
 */
export interface InquiryAttemptData {
  activityId: string
  activityName: string
  attemptId: string
  questionsRequired: number
  timePerQuestion: number
  keywordPool1: string[]
  keywordPool2: string[]
  passThreshold: number
  submittedQuestions: SubmittedQuestion[]
}

/**
 * Leaderboard filter types
 */
export type LeaderboardFilterType = 'best' | 'recent' | 'both'

/**
 * A single entry in the inquiry leaderboard
 * From leaderboard/page.tsx (lines 11-25)
 */
export interface InquiryLeaderboardEntry {
  rank: number
  userId: string
  userName: string
  qualityScore: number
  qualityPercentage: number
  passed: boolean
  questionsGenerated: number
  questionsRequired: number
  avgBloomLevel: number
  timeTaken: string
  attemptNumber: number
  submittedAt: Date | null
  filterType: LeaderboardFilterType
}

/**
 * Aggregate statistics for the leaderboard
 * From leaderboard/page.tsx (lines 27-32)
 */
export interface InquiryLeaderboardStats {
  totalAttempts: number
  uniqueStudents: number
  averageScore: number
  passRate: number
}

/**
 * Summary of a user's inquiry performance
 * From leaderboard/page.tsx (lines 34-39)
 */
export interface InquiryUserSummary {
  bestScore: number
  totalAttempts: number
  passRate: number
  rank: number
}

/**
 * Detailed evaluation data for a question
 * From results/page.tsx (lines 10-23)
 */
export interface InquiryEvaluationData {
  overallScore: number
  creativityScore: number | null
  clarityScore: number | null
  relevanceScore: number | null
  innovationScore: number | null
  complexityScore: number | null
  bloomsLevel: string | null
  evaluationText: string | null
  strengths: string[]
  improvements: string[]
  enhancedQuestions: Array<{ level: string; question: string }> | string[]
  nextLevelGuidance?: string
}

/**
 * A question with its full evaluation for results display
 * From results/page.tsx (lines 25-30)
 */
export interface QuestionWithEvaluation {
  id: string
  content: string
  createdAt: Date
  evaluation: InquiryEvaluationData | null
}

/**
 * Bloom's Taxonomy levels
 */
export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'

/**
 * Mapping of Bloom's levels to Korean translations
 */
export const BLOOMS_KOREAN: Record<BloomsLevel, string> = {
  remember: '기억',
  understand: '이해',
  apply: '적용',
  analyze: '분석',
  evaluate: '평가',
  create: '창조',
}

/**
 * Mapping of Bloom's levels to descriptions
 */
export const BLOOMS_DESCRIPTIONS: Record<BloomsLevel, string> = {
  remember: '사실이나 개념을 회상하는 수준',
  understand: '개념의 의미를 파악하는 수준',
  apply: '배운 내용을 새로운 상황에 적용하는 수준',
  analyze: '정보를 분석하고 관계를 파악하는 수준',
  evaluate: '기준에 따라 판단하고 평가하는 수준',
  create: '새로운 것을 만들어내는 최고 수준',
}
```

### Step 3: Create Index Files

```typescript
// src/features/inquiry-mode/index.ts
export * from './types'
export * from './components'
export * from './hooks'

// src/features/inquiry-mode/components/index.ts
// Components will be added in subsequent work items

// src/features/inquiry-mode/hooks/index.ts
// Hooks will be added in subsequent work items
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx` - Source of SubmittedQuestion types
- `src/app/(dashboard)/activities/[id]/inquiry/leaderboard/page.tsx` - Source of Leaderboard types
- `src/app/(dashboard)/activities/[id]/inquiry/[attemptId]/results/page.tsx` - Source of Evaluation types
- `src/features/case-mode/types.ts` - Reference implementation pattern

## Dependencies

**Blocked By:**
- None (foundation work item)

**Blocks:**
- VIBE-0009-WI02 through VIBE-0009-WI15 (all other work items)

## Test Verification

```bash
# Verify TypeScript compilation
npx tsc --noEmit src/features/inquiry-mode/types.ts

# Verify imports work
npx tsc --noEmit src/features/inquiry-mode/index.ts
```

## Notes

- Use `src/features/case-mode/types.ts` as reference for structure and patterns
- Include JSDoc comments for all exported types
- Preserve Korean language constants in the types file

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
