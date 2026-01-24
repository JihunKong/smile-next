---
id: VIBE-0006B
title: Groups Types & Feature Module Foundation
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-23
updated: 2026-01-23
effort: s
assignee: ai-agent
parent: VIBE-0006
---

# Groups Types & Feature Module Foundation

## Summary

Set up the `src/features/groups/` module structure with proper TypeScript types, barrel exports, and shared interfaces. This creates the foundation for extracting components and hooks.

## Current State

- Types exist in `src/types/groups.ts` (80 lines) - good foundation
- Utils exist in `src/lib/groups/utils.ts` (133 lines)
- Components exist in `src/components/groups/` (GroupCard, MemberList)
- **No feature module exists** for groups
- Types are scattered and some are duplicated in page components

## Target State

```
src/features/groups/
├── components/
│   └── index.ts           # Barrel export (initially empty)
├── hooks/
│   └── index.ts           # Barrel export (initially empty)
├── types.ts               # Extended types for feature
├── utils.ts               # Re-export from lib/groups
└── index.ts               # Main barrel export
```

## Acceptance Criteria

- [ ] Create `src/features/groups/` directory structure
- [ ] Create `src/features/groups/types.ts` with extended component prop types
- [ ] Create barrel exports (`index.ts` files)
- [ ] Move/consolidate any duplicate type definitions from page components
- [ ] Ensure types are properly exported for use by components
- [ ] TypeScript compilation passes (`npm run type-check`)

## Technical Approach

### Step 1: Create Directory Structure

```bash
mkdir -p src/features/groups/{components,hooks}
touch src/features/groups/{index.ts,types.ts}
touch src/features/groups/components/index.ts
touch src/features/groups/hooks/index.ts
```

### Step 2: Extended Types

```typescript
// src/features/groups/types.ts
import type { GroupRole, GroupUserWithUser, GroupDetail } from '@/types/groups'

/**
 * Props for MemberCard component
 */
export interface MemberCardProps {
  member: GroupUserWithUser
  currentUserRole: GroupRole | null | undefined
  isLoading?: boolean
  onRoleChange?: (newRole: number) => void
  onRemove?: () => void
  onSuspend?: (suspend: boolean) => void
}

/**
 * Props for MemberList component  
 */
export interface MemberListProps {
  members: GroupUserWithUser[]
  currentUserRole?: GroupRole | null
  showActions?: boolean
  limit?: number
  isLoading?: boolean
  actionLoadingId?: string | null
  onRoleChange?: (userId: string, newRole: number) => void
  onRemove?: (userId: string) => void
  onSuspend?: (userId: string, suspend: boolean) => void
}

/**
 * Props for GroupForm component (create/edit)
 */
export interface GroupFormProps {
  initialData?: Partial<GroupFormData>
  mode: 'create' | 'edit'
  groupId?: string
  onSuccess?: (groupId: string) => void
  onCancel?: () => void
}

/**
 * Form data for group create/edit
 */
export interface GroupFormData {
  name: string
  description: string
  isPrivate: boolean
  requirePasscode: boolean
  passcode: string
  groupImageUrl: string | null
  autoIconGradient: string | null
}

/**
 * Props for GroupHeader component
 */
export interface GroupHeaderProps {
  group: {
    id: string
    name: string
    description: string | null
    isPrivate: boolean
    groupImageUrl: string | null
    autoIconGradient: string | null
    inviteCode: string | null
    _count: {
      members: number
      activities: number
    }
  }
  userRole?: GroupRole | null
  canManage: boolean
  onDuplicate?: () => void
}

/**
 * Props for InviteLink component
 */
export interface InviteLinkProps {
  groupId: string
  inviteCode: string | null
  canRegenerate?: boolean
  onRegenerate?: () => void
}

/**
 * Props for GroupStats component
 */
export interface GroupStatsProps {
  memberCount: number
  activityCount: number
  questionCount?: number
  likesCount?: number
}

/**
 * Hook return type for useGroup
 */
export interface UseGroupReturn {
  group: GroupDetail | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook return type for useGroupMembers
 */
export interface UseGroupMembersReturn {
  members: GroupUserWithUser[]
  loading: boolean
  actionLoading: string | null
  error: string | null
  changeRole: (userId: string, newRole: number) => Promise<void>
  removeMember: (userId: string) => Promise<void>
  suspendMember: (userId: string, suspend: boolean) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook return type for useGroups (list)
 */
export interface UseGroupsReturn {
  myGroups: GroupWithMembership[]
  publicGroups: GroupWithMembership[]
  loading: boolean
  error: string | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  sortBy: 'name' | 'recent' | 'members'
  setSortBy: (sort: 'name' | 'recent' | 'members') => void
  refetch: () => Promise<void>
}

// Re-export base types for convenience
export type { 
  GroupRole, 
  GroupAction,
  GroupUserWithUser, 
  GroupDetail,
  GroupWithMembership,
  CreateGroupData,
  UpdateGroupData,
} from '@/types/groups'
```

### Step 3: Barrel Exports

```typescript
// src/features/groups/index.ts
// Types
export * from './types'

// Components (added as they're created)
export * from './components'

// Hooks (added as they're created)
export * from './hooks'

// Re-export utils for convenience
export {
  generateInviteCode,
  getRoleLabel,
  getRoleBadgeColor,
  canManageGroup,
  canChangeUserRole,
  formatMemberCount,
  getGradientColors,
  getGroupInitials,
} from '@/lib/groups/utils'
```

```typescript
// src/features/groups/components/index.ts
// Components will be added here as they're extracted
// Initial placeholder exports

// Future exports:
// export { MemberCard } from './MemberCard'
// export { MemberList } from './MemberList'
// export { GroupForm } from './GroupForm'
// export { GroupHeader } from './GroupHeader'
// export { InviteLink } from './InviteLink'
// export { GroupStats } from './GroupStats'
```

```typescript
// src/features/groups/hooks/index.ts
// Hooks will be added here as they're created
// Initial placeholder exports

// Future exports:
// export { useGroup } from './useGroup'
// export { useGroupMembers } from './useGroupMembers'
// export { useGroups } from './useGroups'
```

## Verification

```bash
# Type check passes
npm run type-check

# Feature module can be imported
# Add this to a test file or check via IDE

# Verify exports work
npx tsx -e "import * as groups from './src/features/groups'; console.log(Object.keys(groups))"
```

## Related Files

- `src/types/groups.ts` - Base types (keep unchanged)
- `src/lib/groups/utils.ts` - Utility functions (keep unchanged)
- `src/components/groups/` - Existing components (migrate later)
- `src/features/case-mode/` - Reference implementation

## Dependencies

**Blocked By:**
- VIBE-0006A (Unit Tests) - Tests for utils should exist first

**Blocks:**
- VIBE-0006C (Member Management) - Needs types and structure
- VIBE-0006D (Groups List & Detail) - Needs types and structure

## Notes

- Keep `src/types/groups.ts` as the source of truth for database-related types
- Feature types are for component props and hook returns
- Follow the same patterns established in `src/features/case-mode/`
- Don't move components yet - just set up the structure

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created as foundation for groups feature module |
