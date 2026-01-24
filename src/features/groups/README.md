# Groups Feature Module

Modular components and hooks for Groups functionality.

## Usage

```typescript
import { 
  // Components
  GroupCard,
  GroupForm,
  GroupHeader,
  GroupImageUpload,
  GroupStats,
  InviteLink,
  MemberCard,
  MemberList,
  MemberActions,
  
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
const { group, membership, loading, error, refetch } = useGroup({ 
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

### useGroupForm
Form state management for create/edit.

```tsx
const {
  formData,
  errors,
  isSubmitting,
  updateField,
  validate,
  submit,
} = useGroupForm({ mode: 'create' })
```

## File Structure

```
src/features/groups/
├── components/     # UI components (10 files)
├── hooks/          # Data & state hooks (5 files)
├── types.ts        # TypeScript types
├── index.ts        # Barrel exports
└── README.md       # This file
```
