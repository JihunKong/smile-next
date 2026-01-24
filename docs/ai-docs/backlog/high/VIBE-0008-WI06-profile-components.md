---
id: VIBE-0008-WI06
title: Profile Section Components
status: backlog
effort: m
dependencies: [VIBE-0008-WI03]
---

# WI-06: Profile Section Components

## Description

Create smaller, focused components from existing profile tab components.

## Components to Create

| Component | Target Lines | Source | Responsibility |
|-----------|--------------|--------|----------------|
| `ProfileHeader` | ~80 | profile/page.tsx:201-293 | Avatar, name, stats overview |
| `ProfileTabNav` | ~50 | profile/page.tsx:44-118, 298-316 | Tab definitions and navigation |
| `SmileScoreCard` | ~120 | SmileScoreTab.tsx | Score display + breakdown |
| `ScoreProgressBar` | ~40 | SmileScoreTab.tsx | Tier progress visualization |
| `AchievementGrid` | ~100 | AchievementsTab.tsx | Badge grid with filtering |
| `AchievementCard` | ~50 | AchievementsTab.tsx | Single badge display |
| `ContributionStats` | ~100 | ContributionStatsTab.tsx | Stats overview cards |
| `ActivityTimeline` | ~120 | ActivityTimelineTab.tsx | Timeline events list |

## TDD Approach

### Test Files to Create

**`tests/unit/features/user/components/profile/ProfileHeader.test.tsx`**
```typescript
describe('ProfileHeader', () => {
  it('should display user avatar or initials')
  it('should display user full name')
  it('should display user email')
  it('should show tier badge when available')
  it('should show member since date')
  it('should render stats grid with points, questions, activities, badges')
})
```

**`tests/unit/features/user/components/profile/SmileScoreCard.test.tsx`**
```typescript
describe('SmileScoreCard', () => {
  it('should display total points')
  it('should show current tier name and icon')
  it('should render progress bar to next tier')
  it('should show points breakdown by category')
  it('should handle max tier (no next tier)')
})
```

**`tests/unit/features/user/components/profile/AchievementGrid.test.tsx`**
```typescript
describe('AchievementGrid', () => {
  it('should render grid of achievements')
  it('should show empty state when no achievements')
  it('should filter by category when changed')
  it('should distinguish earned vs locked badges')
  it('should show progress for in-progress badges')
})
```

**`tests/unit/features/user/components/profile/ContributionStats.test.tsx`**
```typescript
describe('ContributionStats', () => {
  it('should display question count')
  it('should display response count')
  it('should display activity count')
  it('should show high quality question percentage')
  it('should show weekly/monthly trends')
})
```

**`tests/unit/features/user/components/profile/ActivityTimeline.test.tsx`**
```typescript
describe('ActivityTimeline', () => {
  it('should render list of activity events')
  it('should show event type icons')
  it('should format event timestamps')
  it('should filter by event type')
  it('should paginate with load more button')
  it('should show empty state when no events')
})
```

## Files to Create

- `tests/unit/features/user/components/profile/*.test.tsx` (8 files)
- `src/features/user/components/profile/*.tsx` (8 files)

## Files to Modify

- `src/features/user/components/profile/index.ts` (add exports)

## Acceptance Criteria

- [ ] All test cases pass
- [ ] Each component under 150 lines
- [ ] Components receive data via props
- [ ] Existing styles preserved
