---
id: VIBE-0006F
title: Groups Feature Final Cleanup & Documentation
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

# Groups Feature Final Cleanup & Documentation

## Summary

Final cleanup for the Groups feature refactoring: migrate legacy components, update imports across the codebase, remove deprecated code, and document the new architecture.

## Current State After VIBE-0006A through 0006E

**Files to Clean Up:**
- `src/components/groups/GroupCard.tsx` → Move to features/groups or delete
- `src/components/groups/MemberList.tsx` → Already replaced by feature version

**Remaining Work:**
- Update all imports to use feature module
- Clean up deprecated components
- Ensure consistent exports
- Add feature documentation

## Target State

```
src/features/groups/
├── components/
│   ├── GroupCard.tsx
│   ├── GroupForm.tsx
│   ├── GroupHeader.tsx
│   ├── GroupImageUpload.tsx
│   ├── GroupStats.tsx
│   ├── InviteLink.tsx
│   ├── MemberCard.tsx
│   ├── MemberList.tsx
│   ├── MemberActions.tsx
│   └── index.ts
├── hooks/
│   ├── useGroup.ts
│   ├── useGroupForm.ts
│   ├── useGroupMembers.ts
│   ├── useGroups.ts
│   └── index.ts
├── types.ts
└── index.ts

src/components/groups/           # Deprecated, to be removed
src/lib/groups/utils.ts          # Keep as-is (re-exported from feature)
src/types/groups.ts              # Keep as-is (base types)
```

## Acceptance Criteria

### Import Updates
- [ ] Find and update all imports from `@/components/groups/`
- [ ] Update to use `@/features/groups` imports
- [ ] Verify no broken imports

### Cleanup
- [ ] Remove `src/components/groups/` directory
- [ ] Remove any unused code from refactored pages
- [ ] Clean up any TODO comments from extraction

### Documentation
- [ ] Add `src/features/groups/README.md` with usage examples
- [ ] Update feature module index.ts with JSDoc comments
- [ ] Document component props in types.ts

### Final Verification
- [ ] All pages render correctly
- [ ] All unit tests pass
- [ ] No TypeScript errors
- [ ] Line counts meet targets

## Technical Approach

### Step 1: Find All Imports to Update

```bash
# Find all imports from components/groups
grep -r "@/components/groups" src/
grep -r "components/groups" src/

# Expected locations:
# - groups/groups-client.tsx
# - groups/[id]/group-detail-client.tsx
# - Any other pages using GroupCard
```

### Step 2: Update Imports

```typescript
// Before:
import { GroupCard } from '@/components/groups/GroupCard'
import { MemberList } from '@/components/groups/MemberList'

// After:
import { GroupCard, MemberList } from '@/features/groups'
```

### Step 3: Remove Deprecated Directory

```bash
# After verifying all imports updated
rm -rf src/components/groups/
```

### Step 4: Create Feature README

```markdown
<!-- src/features/groups/README.md -->
# Groups Feature Module

Modular components and hooks for Groups functionality.

## Usage

```typescript
import { 
  // Components
  GroupCard,
  GroupForm,
  GroupHeader,
  MemberCard,
  MemberList,
  InviteLink,
  
  // Hooks
  useGroup,
  useGroups,
  useGroupMembers,
  useGroupForm,
  
  // Utils (re-exported)
  canManageGroup,
  getRoleLabel,
  getGradientColors,
} from '@/features/groups'
```

## Components

### GroupCard
Display a group in list/grid views.

```tsx
<GroupCard 
  group={group}
  userRole={userRole}
  isMember={true}
  onJoin={() => handleJoin(group.id)}
/>
```

### GroupForm
Create or edit a group.

```tsx
<GroupForm 
  mode="create"
  onSuccess={(id) => router.push(`/groups/${id}`)}
/>

<GroupForm 
  mode="edit"
  groupId={groupId}
  initialData={groupData}
/>
```

### MemberList
Display and manage group members.

```tsx
<MemberList
  members={members}
  currentUserRole={userRole}
  showActions={canManage}
  onRoleChange={handleRoleChange}
  onRemove={handleRemove}
/>
```

## Hooks

### useGroup
Fetch a single group by ID.

```tsx
const { group, activities, loading, error, refetch } = useGroup({ 
  groupId,
  includeActivities: true,
  includeMembers: true,
})
```

### useGroups
Manage groups list with search/filter/sort.

```tsx
const {
  myGroups,
  publicGroups,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
} = useGroups({ initialMyGroups, initialPublicGroups })
```

### useGroupMembers
Manage group members with mutations.

```tsx
const {
  members,
  loading,
  changeRole,
  removeMember,
  suspendMember,
} = useGroupMembers({ groupId })
```

## File Structure

```
src/features/groups/
├── components/     # UI components
├── hooks/          # Data & state hooks
├── types.ts        # TypeScript types
└── index.ts        # Barrel exports
```
```

### Step 5: Final Line Count Check

```bash
# Check all page files meet targets
wc -l src/app/\(dashboard\)/groups/groups-client.tsx
wc -l src/app/\(dashboard\)/groups/\[id\]/group-detail-client.tsx
wc -l src/app/\(dashboard\)/groups/\[id\]/members/page.tsx
wc -l src/app/\(dashboard\)/groups/\[id\]/edit/page.tsx
wc -l src/app/\(dashboard\)/groups/\[id\]/activities/create/page.tsx

# Targets:
# groups-client.tsx: <150 lines (was 386)
# group-detail-client.tsx: <150 lines (was 493)
# members/page.tsx: <150 lines (was 537)
# edit/page.tsx: <100 lines (was 667)
# activities/create/page.tsx: <80 lines (was 676)
```

## Verification

### Import Check
```bash
# Should return no results after cleanup
grep -r "@/components/groups" src/
```

### Full Test Suite
```bash
# Run all unit tests
npm run test:unit

# Type check
npm run type-check

# Lint
npm run lint
```

### Manual Testing Checklist
1. [ ] `/groups` - List page displays, search works
2. [ ] `/groups/create` - Form creates group
3. [ ] `/groups/{id}` - Detail page displays
4. [ ] `/groups/{id}/members` - Members list works
5. [ ] `/groups/{id}/edit` - Edit form works
6. [ ] `/groups/{id}/activities/create` - Activity form works
7. [ ] `/groups/join?code=XXX` - Join flow works

### Build Check
```bash
npm run build
```

## Related Files

- `src/features/groups/` - Feature module
- `src/components/groups/` - To be removed
- `src/lib/groups/utils.ts` - Keep unchanged
- `src/types/groups.ts` - Keep unchanged

## Dependencies

**Blocked By:**
- VIBE-0006A through VIBE-0006E (all extraction work)

**Blocks:**
- None (final cleanup)

## Notes

- Keep `src/lib/groups/utils.ts` as the authoritative location for utilities
- Keep `src/types/groups.ts` as the authoritative location for database types
- Feature module re-exports these for convenience
- This is a good pattern to follow for other feature modules

## Final Summary

After VIBE-0006 completion:

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| groups-client.tsx | 386 | ~100 | 74% |
| group-detail-client.tsx | 493 | ~120 | 76% |
| members/page.tsx | 537 | ~100 | 81% |
| edit/page.tsx | 667 | ~80 | 88% |
| activities/create/page.tsx | 676 | ~50 | 93% |
| **Total** | **2,259** | **~450** | **80%** |

New feature module adds ~800 lines of reusable, tested, documented code.

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created for final cleanup work |
