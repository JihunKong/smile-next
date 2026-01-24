---
id: VIBE-0006C
title: Extract Member Management Components & Hook
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-23
updated: 2026-01-23
effort: m
assignee: ai-agent
parent: VIBE-0006
---

# Extract Member Management Components & Hook

## Summary

Extract and enhance member management into reusable components with a dedicated hook. The members page is currently **538 lines** with all logic inline. This work item creates:
- Enhanced `MemberCard` component (~100 lines)
- Enhanced `MemberList` component (~120 lines)
- New `useGroupMembers` hook (~100 lines)
- Refactored members page (~100 lines)

## Current State

**Source Files:**
- `src/app/(dashboard)/groups/[id]/members/page.tsx` (538 lines) - All inline
- `src/components/groups/MemberList.tsx` (116 lines) - Basic implementation
- `src/components/groups/GroupCard.tsx` (166 lines) - Separate, ok as-is

**Issues:**
- Members page has data fetching, mutations, and UI all mixed
- Role change, suspend, remove logic is inline
- Error handling and loading states scattered throughout
- Not reusable in other contexts (e.g., group detail page member preview)

## Target State

```
src/features/groups/
├── components/
│   ├── MemberCard.tsx      (~100 lines) - Enhanced single member display
│   ├── MemberList.tsx      (~120 lines) - List with search/filter
│   ├── MemberActions.tsx   (~80 lines)  - Dropdown menu actions
│   └── index.ts
├── hooks/
│   ├── useGroupMembers.ts  (~100 lines) - Data + mutations
│   └── index.ts
└── ...

app/(dashboard)/groups/[id]/members/page.tsx (~100 lines) - Thin wrapper
```

## Acceptance Criteria

### Unit Tests First (TDD)
- [ ] Write tests for `useGroupMembers` hook before implementation
- [ ] Write tests for permission logic in components
- [ ] All existing functionality preserved (verified by tests)

### Component Extraction
- [ ] Create `src/features/groups/components/MemberCard.tsx`
  - Avatar with fallback initials
  - Name, username, email display
  - Role badge with color coding
  - Action dropdown (promote, demote, suspend, remove)
  - Loading state for actions
- [ ] Create `src/features/groups/components/MemberActions.tsx`
  - Encapsulates permission-based action rendering
  - Handles promote/demote role limits
  - Confirmation dialogs for destructive actions
- [ ] Enhance `src/features/groups/components/MemberList.tsx`
  - Uses MemberCard internally
  - Search/filter by name or email
  - Loading skeleton while fetching
  - Empty state

### Hook Extraction
- [ ] Create `src/features/groups/hooks/useGroupMembers.ts`
  - `members` - Array of group members
  - `loading` - Initial load state
  - `actionLoading` - Individual action loading (userId)
  - `searchTerm` / `setSearchTerm` - Filter members
  - `changeRole(userId, newRole)` - Mutation
  - `removeMember(userId)` - Mutation
  - `suspendMember(userId, suspend)` - Mutation
  - `refetch()` - Manual refresh

### Page Simplification
- [ ] Refactor members page to <100 lines
- [ ] Page only handles routing and layout
- [ ] All data/state managed by hook
- [ ] All UI in components

## Technical Approach

### Step 1: Write Tests for useGroupMembers

```typescript
// tests/unit/hooks/useGroupMembers.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
// Will need to create the hook first as stub

describe('useGroupMembers', () => {
  it('fetches members on mount', async () => {
    // Mock fetch
    // Assert members populated
  })

  it('filters members by search term', async () => {
    // Setup: Members with different names
    // Assert: Only matching members returned
  })

  it('changeRole updates member role', async () => {
    // Mock successful API call
    // Assert: Member role updated in state
  })

  it('removeMember removes from list', async () => {
    // Mock successful API call
    // Assert: Member no longer in list
  })

  it('sets actionLoading during mutation', async () => {
    // Assert: actionLoading = userId during request
  })
})
```

### Step 2: Implement useGroupMembers Hook

```typescript
// src/features/groups/hooks/useGroupMembers.ts
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GroupUserWithUser, GroupRole } from '@/types/groups'

interface UseGroupMembersOptions {
  groupId: string
  initialMembers?: GroupUserWithUser[]
}

export function useGroupMembers({ groupId, initialMembers = [] }: UseGroupMembersOptions) {
  const [members, setMembers] = useState<GroupUserWithUser[]>(initialMembers)
  const [loading, setLoading] = useState(!initialMembers.length)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchMembers = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/groups/${groupId}/members`)
      if (!response.ok) throw new Error('Failed to fetch members')
      const data = await response.json()
      setMembers(data.members)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (!initialMembers.length) {
      fetchMembers()
    }
  }, [fetchMembers, initialMembers.length])

  const changeRole = useCallback(async (userId: string, newRole: number) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!response.ok) throw new Error('Failed to update role')
      
      // Update local state
      setMembers(prev => prev.map(m => 
        m.userId === userId ? { ...m, role: newRole } : m
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role')
    } finally {
      setActionLoading(null)
    }
  }, [groupId])

  const removeMember = useCallback(async (userId: string) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to remove member')
      
      setMembers(prev => prev.filter(m => m.userId !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setActionLoading(null)
    }
  }, [groupId])

  const suspendMember = useCallback(async (userId: string, suspend: boolean) => {
    setActionLoading(userId)
    try {
      const response = await fetch(`/api/groups/${groupId}/members/${userId}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend }),
      })
      if (!response.ok) throw new Error('Failed to update suspension')
      
      setMembers(prev => prev.map(m => 
        m.userId === userId ? { ...m, isSuspended: suspend } : m
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update suspension')
    } finally {
      setActionLoading(null)
    }
  }, [groupId])

  // Filter members by search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members
    const term = searchTerm.toLowerCase()
    return members.filter(m => 
      m.user.firstName?.toLowerCase().includes(term) ||
      m.user.lastName?.toLowerCase().includes(term) ||
      m.user.email?.toLowerCase().includes(term) ||
      m.user.username?.toLowerCase().includes(term)
    )
  }, [members, searchTerm])

  return {
    members: filteredMembers,
    allMembers: members,
    loading,
    actionLoading,
    error,
    searchTerm,
    setSearchTerm,
    changeRole,
    removeMember,
    suspendMember,
    refetch: fetchMembers,
  }
}

export type UseGroupMembersReturn = ReturnType<typeof useGroupMembers>
```

### Step 3: Create MemberCard Component

```typescript
// src/features/groups/components/MemberCard.tsx
'use client'

import { getRoleLabel, getRoleBadgeColor, canChangeUserRole } from '@/lib/groups/utils'
import { GroupRoles, type GroupRole, type GroupUserWithUser } from '@/types/groups'
import { MemberActions } from './MemberActions'

interface MemberCardProps {
  member: GroupUserWithUser & { isSuspended?: boolean }
  currentUserRole: GroupRole | null | undefined
  isActionLoading?: boolean
  onRoleChange?: (newRole: number) => void
  onRemove?: () => void
  onSuspend?: (suspend: boolean) => void
}

export function MemberCard({
  member,
  currentUserRole,
  isActionLoading = false,
  onRoleChange,
  onRemove,
  onSuspend,
}: MemberCardProps) {
  const canManage = currentUserRole !== null && 
                    currentUserRole !== undefined && 
                    member.role < currentUserRole

  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-lg border ${
      member.isSuspended ? 'opacity-60 border-yellow-200' : 'border-gray-100'
    }`}>
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {member.user.avatarUrl ? (
          <img 
            src={member.user.avatarUrl} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <span className="text-gray-600 font-medium">
            {member.user.firstName?.[0] || ''}
            {member.user.lastName?.[0] || ''}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-gray-900 truncate">
            {member.user.firstName} {member.user.lastName}
          </p>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            getRoleBadgeColor(member.role as GroupRole)
          }`}>
            {getRoleLabel(member.role as GroupRole)}
          </span>
          {member.isSuspended && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Suspended
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          @{member.user.username || 'unknown'}
        </p>
        {member.user.email && (
          <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
        )}
      </div>

      {/* Actions */}
      {canManage && (
        <MemberActions
          member={member}
          currentUserRole={currentUserRole}
          isLoading={isActionLoading}
          onRoleChange={onRoleChange}
          onRemove={onRemove}
          onSuspend={onSuspend}
        />
      )}
    </div>
  )
}
```

### Step 4: Refactored Members Page

```typescript
// src/app/(dashboard)/groups/[id]/members/page.tsx
'use client'

import { use } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useGroupMembers, MemberList, InviteLink } from '@/features/groups'
import { LoadingState } from '@/components/ui'

export default function GroupMembersPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: groupId } = use(params)
  const { data: session } = useSession()
  
  const {
    members,
    loading,
    actionLoading,
    searchTerm,
    setSearchTerm,
    changeRole,
    removeMember,
    suspendMember,
  } = useGroupMembers({ groupId })

  // Find current user's role
  const currentMember = members.find(m => m.userId === session?.user?.id)
  const currentRole = currentMember?.role ?? null

  if (loading) return <LoadingState />

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/groups/${groupId}`}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">
            Members ({members.length})
          </h1>
        </div>
        <InviteLink groupId={groupId} />
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Member List */}
      <MemberList
        members={members}
        currentUserRole={currentRole}
        showActions={currentRole !== null && currentRole >= 1}
        actionLoadingId={actionLoading}
        onRoleChange={changeRole}
        onRemove={removeMember}
        onSuspend={suspendMember}
      />
    </div>
  )
}
```

## Verification

### Unit Tests
```bash
# Run hook tests
npm run test:unit -- tests/unit/hooks/useGroupMembers.test.ts

# Run component tests (if added)
npm run test:unit -- tests/unit/components/MemberCard.test.ts
```

### Manual Testing
1. Navigate to `/groups/{id}/members`
2. Verify member list displays correctly
3. Test search filter functionality
4. Test role changes (promote/demote) - verify permissions
5. Test member removal with confirmation
6. Test suspend/unsuspend functionality
7. Verify loading states during actions

### Type Check
```bash
npm run type-check
```

## Related Files

- `src/app/(dashboard)/groups/[id]/members/page.tsx` - Current (538 lines)
- `src/components/groups/MemberList.tsx` - Existing basic component
- `src/lib/groups/utils.ts` - Permission functions
- `src/types/groups.ts` - Type definitions
- `src/features/groups/` - Target location

## Dependencies

**Blocked By:**
- VIBE-0006A (Unit Tests) - Need testing foundation
- VIBE-0006B (Types & Foundation) - Need feature module structure

**Blocks:**
- VIBE-0006D (Groups List & Detail) - Detail page uses member preview
- VIBE-0006E (Page Consolidation) - Final integration

## Notes

- Preserve all existing functionality during extraction
- The existing `MemberList` in `src/components/groups/` can be deprecated or migrated
- Focus on proper error handling and loading states
- Consider accessibility (keyboard navigation in dropdowns)
- Mobile-responsive design for member cards

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created for member management extraction |
