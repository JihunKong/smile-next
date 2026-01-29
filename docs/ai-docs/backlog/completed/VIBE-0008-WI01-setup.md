---
id: VIBE-0008-WI01
title: Setup Feature Module Structure & Types
status: backlog
effort: xs
dependencies: []
---

# WI-01: Setup Feature Module Structure & Types

## Description

Create the foundational `src/features/user/` module structure with shared TypeScript types.

## Tasks

1. Create directory structure:
   - `src/features/user/components/settings/`
   - `src/features/user/components/profile/`
   - `src/features/user/hooks/`
   - `tests/unit/features/user/components/settings/`
   - `tests/unit/features/user/components/profile/`
   - `tests/unit/features/user/hooks/`

2. Create `types.ts` with interfaces extracted from existing files:
   - `UserProfile` (firstName, lastName, username, email, avatarUrl)
   - `UserPreferences` (theme, language, emailDigest, etc.)
   - `UserStats` (totalQuestions, totalActivities, etc.)
   - `LevelInfo`, `LevelTier`
   - `Achievement`, `EarnedBadge`
   - `TimelineEvent`

3. Create barrel exports (`index.ts` files)

## Files to Create

- `src/features/user/types.ts`
- `src/features/user/index.ts`
- `src/features/user/hooks/index.ts`
- `src/features/user/components/index.ts`
- `src/features/user/components/settings/index.ts`
- `src/features/user/components/profile/index.ts`

## Acceptance Criteria

- [ ] All directories exist
- [ ] TypeScript compiles without errors
- [ ] Types can be imported from `@/features/user`
