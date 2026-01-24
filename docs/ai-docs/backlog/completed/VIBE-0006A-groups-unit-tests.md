---
id: VIBE-0006A
title: Unit Tests for Groups Server Actions & Utils (TDD Foundation)
status: backlog
priority: high
category: testing
component: testing
created: 2026-01-23
updated: 2026-01-23
effort: m
assignee: ai-agent
parent: VIBE-0006
---

# Unit Tests for Groups Server Actions & Utils

## Summary

Write comprehensive unit tests for Groups server actions and utility functions **before** refactoring begins. This TDD approach ensures the core business logic and permission logic is protected during the UI modularization work.

### Files to Test
- `src/app/(dashboard)/groups/actions.ts` (12KB, ~300+ lines) - Core group CRUD operations
- `src/lib/groups/utils.ts` (133 lines) - Permission and helper functions

### Functions to Test in `actions.ts`:
- `createGroup()` - Group creation with invite code generation
- `updateGroup()` - Group settings update with authorization
- `deleteGroup()` - Group deletion (owner only)
- `joinGroup()` - Join via invite code or public group
- `leaveGroup()` - Member departure logic
- `removeMember()` - Admin removes member
- `updateMemberRole()` - Role changes with hierarchy rules
- `regenerateInviteCode()` - Invite link refresh

### Functions to Test in `utils.ts`:
- `generateInviteCode()` - Unique 8-char code without confusing chars
- `getRoleLabel()` - Human-readable role names
- `getRoleBadgeColor()` - CSS classes for role badges
- `canManageGroup()` - Permission checker for actions
- `canChangeUserRole()` - Role change validation
- `formatMemberCount()` - Singular/plural formatting
- `getGradientColors()` - Auto-generated group icon colors
- `getGroupInitials()` - Name to initials conversion

## Acceptance Criteria

- [ ] Create `tests/unit/lib/groups-utils.test.ts`
- [ ] Create `tests/unit/actions/groups-actions.test.ts`
- [ ] Test `canManageGroup()`:
  - Returns false for null/undefined roles
  - MEMBER can only `view`
  - ADMIN can `manageMember`, `removeMember`, `view`
  - CO_OWNER can `edit`, `invite`, `changeRole`
  - OWNER can `delete`
- [ ] Test `canChangeUserRole()`:
  - Cannot change owner's role
  - Must have higher role than target
  - Cannot promote to equal or higher role
- [ ] Test `generateInviteCode()`:
  - Produces 8 characters
  - Only uses allowed character set
  - Excludes confusing chars (0, O, 1, I)
- [ ] Test `getGroupInitials()`:
  - Single word → first 2 chars
  - Multiple words → first char of first 2 words
- [ ] Test server action authorization:
  - `createGroup()` requires authenticated user
  - `updateGroup()` requires CO_OWNER or above
  - `deleteGroup()` requires OWNER
  - `updateMemberRole()` enforces hierarchy
- [ ] All tests pass in CI (`npm run test:unit`)

## Technical Approach

### Test File 1: Utils Tests

```typescript
// tests/unit/lib/groups-utils.test.ts
import { describe, it, expect } from 'vitest'
import {
  generateInviteCode,
  getRoleLabel,
  getRoleBadgeColor,
  canManageGroup,
  canChangeUserRole,
  formatMemberCount,
  getGradientColors,
  getGroupInitials,
} from '@/lib/groups/utils'
import { GroupRoles } from '@/types/groups'

describe('generateInviteCode', () => {
  it('generates 8 character codes', () => {
    const code = generateInviteCode()
    expect(code).toHaveLength(8)
  })

  it('uses only allowed characters', () => {
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode()
      for (const char of code) {
        expect(allowedChars).toContain(char)
      }
    }
  })

  it('excludes confusing characters (0, O, 1, I)', () => {
    const forbiddenChars = '0O1I'
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode()
      for (const char of forbiddenChars) {
        expect(code).not.toContain(char)
      }
    }
  })
})

describe('canManageGroup', () => {
  it('returns false for null role', () => {
    expect(canManageGroup(null, 'view')).toBe(false)
    expect(canManageGroup(null, 'edit')).toBe(false)
  })

  it('returns false for undefined role', () => {
    expect(canManageGroup(undefined, 'view')).toBe(false)
  })

  it('allows MEMBER to view only', () => {
    expect(canManageGroup(GroupRoles.MEMBER, 'view')).toBe(true)
    expect(canManageGroup(GroupRoles.MEMBER, 'edit')).toBe(false)
    expect(canManageGroup(GroupRoles.MEMBER, 'delete')).toBe(false)
  })

  it('allows ADMIN to manage and remove members', () => {
    expect(canManageGroup(GroupRoles.ADMIN, 'view')).toBe(true)
    expect(canManageGroup(GroupRoles.ADMIN, 'manageMember')).toBe(true)
    expect(canManageGroup(GroupRoles.ADMIN, 'removeMember')).toBe(true)
    expect(canManageGroup(GroupRoles.ADMIN, 'changeRole')).toBe(false)
  })

  it('allows CO_OWNER to edit and change roles', () => {
    expect(canManageGroup(GroupRoles.CO_OWNER, 'edit')).toBe(true)
    expect(canManageGroup(GroupRoles.CO_OWNER, 'invite')).toBe(true)
    expect(canManageGroup(GroupRoles.CO_OWNER, 'changeRole')).toBe(true)
    expect(canManageGroup(GroupRoles.CO_OWNER, 'delete')).toBe(false)
  })

  it('allows only OWNER to delete', () => {
    expect(canManageGroup(GroupRoles.OWNER, 'delete')).toBe(true)
    expect(canManageGroup(GroupRoles.CO_OWNER, 'delete')).toBe(false)
    expect(canManageGroup(GroupRoles.ADMIN, 'delete')).toBe(false)
  })
})

describe('canChangeUserRole', () => {
  it('prevents changing owner role', () => {
    expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.OWNER, GroupRoles.MEMBER)).toBe(false)
  })

  it('requires higher role than target', () => {
    expect(canChangeUserRole(GroupRoles.ADMIN, GroupRoles.ADMIN, GroupRoles.MEMBER)).toBe(false)
    expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.ADMIN, GroupRoles.MEMBER)).toBe(true)
  })

  it('prevents promoting to equal or higher role', () => {
    expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.MEMBER, GroupRoles.OWNER)).toBe(false)
    expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.MEMBER, GroupRoles.CO_OWNER)).toBe(false)
    expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.MEMBER, GroupRoles.ADMIN)).toBe(true)
  })
})

describe('getGroupInitials', () => {
  it('returns first 2 chars for single word', () => {
    expect(getGroupInitials('Biology')).toBe('BI')
    expect(getGroupInitials('AI')).toBe('AI')
  })

  it('returns first char of first 2 words', () => {
    expect(getGroupInitials('Computer Science')).toBe('CS')
    expect(getGroupInitials('Intro to AI')).toBe('IT')
  })

  it('handles extra whitespace', () => {
    expect(getGroupInitials('  Biology  101  ')).toBe('B1')
  })
})

describe('getRoleLabel', () => {
  it('returns correct labels for each role', () => {
    expect(getRoleLabel(GroupRoles.MEMBER)).toBe('Member')
    expect(getRoleLabel(GroupRoles.ADMIN)).toBe('Admin')
    expect(getRoleLabel(GroupRoles.CO_OWNER)).toBe('Co-Owner')
    expect(getRoleLabel(GroupRoles.OWNER)).toBe('Owner')
  })
})

describe('getGradientColors', () => {
  it('returns gradient object with from and to', () => {
    const gradient = getGradientColors(0)
    expect(gradient).toHaveProperty('from')
    expect(gradient).toHaveProperty('to')
  })

  it('cycles through gradients', () => {
    const first = getGradientColors(0)
    const ninth = getGradientColors(8) // 8 gradients, should wrap
    expect(first).toEqual(ninth)
  })
})

describe('formatMemberCount', () => {
  it('uses singular for 1', () => {
    expect(formatMemberCount(1)).toBe('1 member')
  })

  it('uses plural for other counts', () => {
    expect(formatMemberCount(0)).toBe('0 members')
    expect(formatMemberCount(5)).toBe('5 members')
  })
})
```

### Test File 2: Server Actions Tests

```typescript
// tests/unit/actions/groups-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
// Note: Actual imports will be added when implementing

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    group: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    groupUser: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock auth
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}))

describe('createGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates group with current user as owner', async () => {
    // Setup: Mock authenticated user
    // Assert: Group created with role = OWNER
  })

  it('generates unique invite code', async () => {
    // Assert: inviteCode is 8 chars
  })

  it('rejects unauthenticated users', async () => {
    // Setup: Mock no session
    // Assert: Returns error
  })
})

describe('updateGroup', () => {
  it('allows CO_OWNER to update settings', async () => {
    // Setup: Mock user with CO_OWNER role
    // Assert: Update succeeds
  })

  it('rejects MEMBER updating settings', async () => {
    // Setup: Mock user with MEMBER role
    // Assert: Returns authorization error
  })

  it('rejects non-members', async () => {
    // Setup: Mock user not in group
    // Assert: Returns authorization error
  })
})

describe('deleteGroup', () => {
  it('allows only OWNER to delete', async () => {
    // Assert: OWNER can delete, others cannot
  })

  it('removes all members when deleted', async () => {
    // Assert: Cascading delete of memberships
  })
})

describe('updateMemberRole', () => {
  it('enforces role hierarchy', async () => {
    // CO_OWNER cannot promote to OWNER
    // ADMIN cannot change CO_OWNER roles
  })

  it('rejects changing owner role', async () => {
    // Assert: Cannot demote/change owner
  })
})

describe('joinGroup', () => {
  it('allows joining public groups', async () => {
    // Setup: Public group, authenticated user
    // Assert: Membership created with MEMBER role
  })

  it('requires invite code for private groups', async () => {
    // Setup: Private group, no invite code
    // Assert: Returns error
  })

  it('rejects invalid invite code', async () => {
    // Setup: Wrong invite code
    // Assert: Returns error
  })

  it('prevents duplicate membership', async () => {
    // Setup: Already a member
    // Assert: Returns error or existing membership
  })
})

describe('leaveGroup', () => {
  it('removes member from group', async () => {
    // Assert: GroupUser record deleted
  })

  it('prevents owner from leaving', async () => {
    // Assert: Owner must transfer ownership or delete group
  })
})

describe('removeMember', () => {
  it('allows ADMIN to remove MEMBER', async () => {
    // Assert: Removal succeeds
  })

  it('prevents removing higher-ranked members', async () => {
    // Admin cannot remove Co-Owner
  })

  it('prevents self-removal via this action', async () => {
    // Use leaveGroup instead
  })
})
```

## Verification

```bash
# Run utils tests only
npm run test:unit -- tests/unit/lib/groups-utils.test.ts

# Run actions tests only
npm run test:unit -- tests/unit/actions/groups-actions.test.ts

# Run all groups-related tests
npm run test:unit -- --testNamePattern="groups"

# Run with coverage
npm run test:coverage -- tests/unit/lib/groups-utils.test.ts
```

## Related Files

- `src/app/(dashboard)/groups/actions.ts` - Server actions to test
- `src/lib/groups/utils.ts` - Utility functions to test
- `src/types/groups.ts` - Type definitions
- `tests/setup.ts` - Test configuration
- `vitest.config.ts` - Vitest configuration

## Dependencies

**Blocked By:**
- None (first item in sequence)

**Blocks:**
- VIBE-0006B (Types & Foundation) - Tests must exist before refactoring
- VIBE-0006C (Member Management) - Components will use tested functions
- VIBE-0006D (Groups List & Detail) - Pages will call tested actions

## Notes

- Utils tests can run immediately without mocking (pure functions)
- Server action tests require Prisma and auth mocking
- Focus on permission edge cases - these are critical for security
- Reference `tests/unit/actions/case-actions.test.ts` for mocking patterns if available

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created as TDD foundation for VIBE-0006 refactoring |
