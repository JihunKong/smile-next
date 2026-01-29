---
id: VIBE-0009-WI12
title: Refactor Inquiry Leaderboard Page
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: m
assignee: ai-agent
parent: VIBE-0009
---

# Refactor Inquiry Leaderboard Page

## Summary

Refactor `inquiry/leaderboard/page.tsx` (502 lines) to reuse shared leaderboard components. Target: under 150 lines.

## Current Behavior

The leaderboard page has inline implementations of:
- Stats cards display
- Leaderboard row rendering
- User performance summary
- Filtering logic

Similar patterns exist in `src/features/case-mode/components/`:
- `StatCard.tsx` 
- `LeaderboardRow.tsx`
- `UserPerformanceCard.tsx`

## Expected Behavior

Refactored page that:
- Reuses shared leaderboard components
- Creates inquiry-specific variants where needed
- Keeps filtering logic but moves to hook or utility

## Acceptance Criteria

- [ ] Page is under 150 lines
- [ ] Reuses shared leaderboard components
- [ ] Filtering logic preserved
- [ ] All existing functionality works

## Technical Approach

### Step 1: Analyze Shared Patterns

Compare with case-mode components:
- `StatCard` - likely reusable directly
- `LeaderboardRow` - needs inquiry-specific data
- `UserPerformanceCard` - likely reusable

### Step 2: Create Shared Components if Needed

Consider moving to `src/features/shared/components/`:
- Generic `StatCard`
- Base `LeaderboardRow` with mode variants

### Step 3: Extract Display Components

```typescript
// Create inquiry-specific leaderboard row if needed
function InquiryLeaderboardRow({ entry }: { entry: InquiryLeaderboardEntry }) {
  // ...
}
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/leaderboard/page.tsx`
- `src/features/case-mode/components/StatCard.tsx`
- `src/features/case-mode/components/LeaderboardRow.tsx`

## Dependencies

**Blocked By:**
- VIBE-0009-WI03 (QualityScoreDisplay)

**Blocks:**
- VIBE-0009-WI15 (Final Cleanup)

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
