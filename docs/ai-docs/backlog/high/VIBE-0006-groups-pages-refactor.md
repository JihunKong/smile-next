---
id: VIBE-0006
title: Refactor Groups pages for AI-friendly development (2259 total lines)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-17
effort: m
assignee: ai-agent
---

# Refactor Groups Pages for Vibe Coding

## Summary

Groups management has **5 pages totaling 2,259 lines**. Groups are a core organizational feature - every activity belongs to a group. These pages need to be designer-friendly for the redesign.

| File | Lines | Purpose |
|------|-------|---------|
| `groups/[id]/activities/create/page.tsx` | 676 | Create activity in group |
| `groups/[id]/edit/page.tsx` | 667 | Edit group settings |
| `groups/[id]/members/page.tsx` | 537 | Manage members |
| `groups/[id]/group-detail-client.tsx` | 493 | Group detail view |
| `groups/groups-client.tsx` | 386 | Groups list |
| **Total** | **2,259** | |

## Current Behavior

- Group activity create duplicates activity create logic
- Member management has complex role/permission logic inline
- Edit page has form patterns similar to activity edit
- List page has search/filter logic inline

## Expected Behavior

```
features/groups/
├── components/
│   ├── GroupCard.tsx           (~80 lines)  - Group display card
│   ├── GroupHeader.tsx         (~80 lines)  - Title, image, actions
│   ├── GroupForm.tsx           (~150 lines) - Create/edit form
│   ├── MemberList.tsx          (~120 lines) - Members with actions
│   ├── MemberCard.tsx          (~80 lines)  - Single member
│   ├── InviteLink.tsx          (~80 lines)  - Invite URL + QR
│   ├── GroupStats.tsx          (~60 lines)  - Member/activity counts
│   └── index.ts
├── hooks/
│   ├── useGroup.ts             (~80 lines)
│   ├── useGroupMembers.ts      (~100 lines)
│   ├── useGroups.ts            (~60 lines)  - List with search
│   └── index.ts
└── types.ts

app/(dashboard)/groups/
├── page.tsx                    - Uses groups-client
├── groups-client.tsx           (~100 lines)
├── [id]/
│   ├── page.tsx               (~80 lines)
│   ├── edit/page.tsx          (~80 lines)
│   ├── members/page.tsx       (~100 lines)
│   └── activities/create/page.tsx (~80 lines) - Reuse ActivityForm
```

## Acceptance Criteria

- [ ] Create `src/features/groups/` module
- [ ] Extract `MemberList` and `MemberCard` components
- [ ] Extract `GroupForm` shared between create/edit
- [ ] Group detail page under 120 lines
- [ ] Members page under 150 lines
- [ ] Group edit page under 100 lines
- [ ] Groups list client under 150 lines
- [ ] Activity create reuses `@/features/activities` components

## Technical Approach

### 1. Member Management Components

```typescript
// features/groups/components/MemberCard.tsx
interface Props {
  member: GroupMember
  currentUserRole: string
  onRoleChange?: (role: string) => void
  onRemove?: () => void
  onSuspend?: () => void
}

export function MemberCard({ member, currentUserRole, onRoleChange, onRemove, onSuspend }: Props) {
  const canManage = ['owner', 'admin'].includes(currentUserRole) && 
                    member.role !== 'owner'

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-3">
        <Avatar src={member.user.avatar} name={member.user.name} />
        <div>
          <p className="font-medium">{member.user.name}</p>
          <p className="text-sm text-gray-500">{member.user.email}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <RoleBadge role={member.role} />
        
        {canManage && (
          <DropdownMenu>
            <DropdownItem onClick={() => onRoleChange?.('admin')}>
              Make Admin
            </DropdownItem>
            <DropdownItem onClick={() => onRoleChange?.('member')}>
              Make Member
            </DropdownItem>
            <DropdownItem onClick={onSuspend} variant="warning">
              Suspend
            </DropdownItem>
            <DropdownItem onClick={onRemove} variant="danger">
              Remove
            </DropdownItem>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
```

### 2. Members Hook

```typescript
// features/groups/hooks/useGroupMembers.ts
export function useGroupMembers(groupId: string) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => { ... }, [groupId])

  const changeRole = async (userId: string, role: string) => {
    setActionLoading(userId)
    try {
      await fetch(`/api/groups/${groupId}/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      await fetchMembers()
    } finally {
      setActionLoading(null)
    }
  }

  const removeMember = async (userId: string) => { ... }
  const suspendMember = async (userId: string) => { ... }

  return {
    members,
    loading,
    actionLoading,
    changeRole,
    removeMember,
    suspendMember,
    refetch: fetchMembers,
  }
}
```

### 3. Simplified Members Page

```typescript
// groups/[id]/members/page.tsx
'use client'

import { useGroupMembers } from '@/features/groups/hooks'
import { MemberCard, InviteLink } from '@/features/groups/components'

export default function GroupMembersPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const { 
    members, loading, actionLoading,
    changeRole, removeMember, suspendMember 
  } = useGroupMembers(id)

  const currentMember = members.find(m => m.userId === session?.user?.id)
  const currentRole = currentMember?.role || 'member'

  if (loading) return <LoadingState />

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Members ({members.length})</h1>
        <InviteLink groupId={id} />
      </div>

      <div className="space-y-3">
        {members.map(member => (
          <MemberCard
            key={member.userId}
            member={member}
            currentUserRole={currentRole}
            onRoleChange={(role) => changeRole(member.userId, role)}
            onRemove={() => removeMember(member.userId)}
            onSuspend={() => suspendMember(member.userId)}
          />
        ))}
      </div>
    </div>
  )
}
```

### 4. Reuse Activity Form in Groups

```typescript
// groups/[id]/activities/create/page.tsx
'use client'

import { useParams } from 'next/navigation'
import { ActivityForm } from '@/features/activities/components'
import { useGroup } from '@/features/groups/hooks'

export default function GroupActivityCreatePage() {
  const { id: groupId } = useParams()
  const { group, loading } = useGroup(groupId)

  if (loading) return <LoadingState />

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        Create Activity in {group.name}
      </h1>
      
      {/* Reuse the same form from features/activities */}
      <ActivityForm 
        defaultGroupId={groupId}
        redirectTo={`/groups/${groupId}`}
      />
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/groups/` - All group pages
- `src/components/groups/` - Existing GroupCard, MemberList
- `src/features/activities/` - Reuse ActivityForm

## Dependencies

**Blocked By:**
- VIBE-0005 (Activity Pages) - need ActivityForm to reuse

**Blocks:**
- None

## Notes

- Group activity create (676 lines) should become ~30 lines by reusing ActivityForm
- This is a good candidate for parallel work with VIBE-0005
- MemberCard should handle all permission logic internally

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - Groups are core organizational feature |
