---
id: VIBE-0006D
title: Extract Groups List & Detail Components
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

# Extract Groups List & Detail Components

## Summary

Extract and simplify the Groups list page (386 lines) and Group detail page (493 lines) into modular components with dedicated hooks. This creates reusable group display components.

## Current State

**Source Files:**
| File | Lines | Issues |
|------|-------|--------|
| `groups/groups-client.tsx` | 386 | Search, filter, sort logic inline; complex state |
| `groups/[id]/group-detail-client.tsx` | 493 | Activities list, member preview, QR code, invite all inline |

**Issues:**
- Group cards rendered inline with full styling
- Search/filter/sort logic mixed with UI
- No separation between data fetching and display
- Hard to reuse group display in other contexts

## Target State

```
src/features/groups/
├── components/
│   ├── GroupCard.tsx           (~80 lines)  - Move from components/groups
│   ├── GroupHeader.tsx         (~100 lines) - Group title, image, actions
│   ├── GroupStats.tsx          (~60 lines)  - Member/activity counts
│   ├── InviteLink.tsx          (~80 lines)  - Invite URL + QR code
│   ├── GroupActivityList.tsx   (~100 lines) - Activities in group
│   ├── MemberPreview.tsx       (~60 lines)  - First N members + "see all"
│   └── index.ts
├── hooks/
│   ├── useGroup.ts             (~80 lines)  - Single group data
│   ├── useGroups.ts            (~100 lines) - List with search/sort
│   └── index.ts
└── ...

app/(dashboard)/groups/
├── groups-client.tsx           (~100 lines) - Uses hook + components
├── [id]/
│   └── group-detail-client.tsx (~120 lines) - Uses hook + components
```

## Acceptance Criteria

### Unit Tests First (TDD)
- [ ] Write tests for `useGroup` hook
- [ ] Write tests for `useGroups` hook with search/filter/sort
- [ ] Write tests for GroupCard component rendering

### Hooks
- [ ] Create `useGroup(groupId)` hook
  - Returns group detail with members and activities
  - Handles loading and error states
  - Provides refetch function
- [ ] Create `useGroups()` hook
  - Returns myGroups and publicGroups
  - Search term state
  - Sort option state (name, recent, members)
  - Filter for "my groups" vs "discover"

### Components
- [ ] Move `GroupCard` to features/groups/components/
  - Ensure same display as current
  - Add prop for compact vs full mode
- [ ] Create `GroupHeader` component
  - Group name, image/gradient, privacy badge
  - Edit/Settings button (if canManage)
  - Actions dropdown (duplicate, delete)
- [ ] Create `GroupStats` component
  - Member count, activity count, question count
  - Optional: likes count
- [ ] Create `InviteLink` component
  - Copy invite link button
  - QR code display (collapsible)
  - Regenerate button (if authorized)
- [ ] Create `GroupActivityList` component
  - Reuses ActivityCard from activities feature
  - Empty state
  - "Create activity" CTA for admins
- [ ] Create `MemberPreview` component
  - Show first 5 members with avatars
  - "View all" link to members page
  - Role badges for visible members

### Page Simplification
- [ ] Refactor groups-client.tsx to <150 lines
- [ ] Refactor group-detail-client.tsx to <150 lines

## Technical Approach

### Step 1: useGroup Hook

```typescript
// src/features/groups/hooks/useGroup.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GroupDetail } from '@/types/groups'

interface UseGroupOptions {
  groupId: string
  includeActivities?: boolean
  includeMembers?: boolean
}

export function useGroup({ groupId, includeActivities = true, includeMembers = true }: UseGroupOptions) {
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroup = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    setError(null)
    
    try {
      // Build query params
      const params = new URLSearchParams()
      if (includeActivities) params.set('activities', 'true')
      if (includeMembers) params.set('members', 'true')
      
      const response = await fetch(`/api/groups/${groupId}?${params}`)
      if (!response.ok) {
        if (response.status === 404) throw new Error('Group not found')
        if (response.status === 403) throw new Error('Access denied')
        throw new Error('Failed to load group')
      }
      
      const data = await response.json()
      setGroup(data.group)
      setActivities(data.activities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [groupId, includeActivities, includeMembers])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  return {
    group,
    activities,
    loading,
    error,
    refetch: fetchGroup,
  }
}
```

### Step 2: useGroups Hook

```typescript
// src/features/groups/hooks/useGroups.ts
'use client'

import { useState, useMemo, useCallback } from 'react'
import type { GroupWithMembership } from '@/types/groups'

type SortOption = 'name' | 'recent' | 'members'
type ViewMode = 'grid' | 'list'

interface UseGroupsOptions {
  initialMyGroups?: GroupWithMembership[]
  initialPublicGroups?: GroupWithMembership[]
}

export function useGroups({ 
  initialMyGroups = [], 
  initialPublicGroups = [] 
}: UseGroupsOptions) {
  const [myGroups, setMyGroups] = useState(initialMyGroups)
  const [publicGroups, setPublicGroups] = useState(initialPublicGroups)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my')

  // Sort and filter logic
  const sortGroups = useCallback((groups: GroupWithMembership[]) => {
    return [...groups].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'members':
          return (b._count?.members || 0) - (a._count?.members || 0)
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
  }, [sortBy])

  const filterGroups = useCallback((groups: GroupWithMembership[]) => {
    if (!searchTerm.trim()) return groups
    const term = searchTerm.toLowerCase()
    return groups.filter(g => 
      g.name.toLowerCase().includes(term) ||
      g.description?.toLowerCase().includes(term)
    )
  }, [searchTerm])

  // Computed filtered/sorted groups
  const filteredMyGroups = useMemo(() => 
    sortGroups(filterGroups(myGroups)), 
    [myGroups, sortGroups, filterGroups]
  )
  
  const filteredPublicGroups = useMemo(() => 
    sortGroups(filterGroups(publicGroups)), 
    [publicGroups, sortGroups, filterGroups]
  )

  // Refresh from API
  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/groups')
      const data = await response.json()
      setMyGroups(data.myGroups || [])
      setPublicGroups(data.publicGroups || [])
    } finally {
      setLoading(false)
    }
  }, [])

  // Add group to my groups (after join)
  const addToMyGroups = useCallback((group: GroupWithMembership) => {
    setMyGroups(prev => [group, ...prev])
    setPublicGroups(prev => prev.filter(g => g.id !== group.id))
  }, [])

  return {
    myGroups: filteredMyGroups,
    publicGroups: filteredPublicGroups,
    allMyGroups: myGroups,
    allPublicGroups: publicGroups,
    loading,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    refetch,
    addToMyGroups,
  }
}
```

### Step 3: GroupHeader Component

```typescript
// src/features/groups/components/GroupHeader.tsx
'use client'

import Link from 'next/link'
import { getGradientColors, getGroupInitials, canManageGroup } from '@/lib/groups/utils'
import type { GroupRole } from '@/types/groups'

interface GroupHeaderProps {
  group: {
    id: string
    name: string
    description: string | null
    isPrivate: boolean
    groupImageUrl: string | null
    autoIconGradient: string | null
  }
  userRole?: GroupRole | null
  onDuplicate?: () => void
}

export function GroupHeader({ group, userRole, onDuplicate }: GroupHeaderProps) {
  const gradient = getGradientColors(parseInt(group.autoIconGradient || '0'))
  const initials = getGroupInitials(group.name)
  const canEdit = canManageGroup(userRole, 'edit')

  return (
    <div className="relative">
      {/* Cover/Banner */}
      <div className="h-48 rounded-t-xl overflow-hidden">
        {group.groupImageUrl ? (
          <img 
            src={group.groupImageUrl} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)` 
            }}
          >
            <span className="text-white text-6xl font-bold opacity-50">
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* Title and Actions */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                group.isPrivate 
                  ? 'bg-gray-100 text-gray-600' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {group.isPrivate ? 'Private' : 'Public'}
              </span>
            </div>
            {group.description && (
              <p className="mt-2 text-gray-600">{group.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                href={`/groups/${group.id}/edit`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Settings
              </Link>
            )}
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Duplicate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 4: InviteLink Component

```typescript
// src/features/groups/components/InviteLink.tsx
'use client'

import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

interface InviteLinkProps {
  groupId: string
  inviteCode: string | null
  canRegenerate?: boolean
  onRegenerate?: () => Promise<void>
}

export function InviteLink({ 
  groupId, 
  inviteCode, 
  canRegenerate = false,
  onRegenerate 
}: InviteLinkProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const inviteUrl = inviteCode 
    ? `${window.location.origin}/groups/join?code=${inviteCode}`
    : null

  const copyLink = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = async () => {
    if (!onRegenerate) return
    setRegenerating(true)
    try {
      await onRegenerate()
    } finally {
      setRegenerating(false)
    }
  }

  if (!inviteCode) {
    return (
      <div className="text-sm text-gray-500">
        No invite link available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Copy Link Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={copyLink}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
            />
          </svg>
          {copied ? 'Copied!' : 'Copy Invite Link'}
        </button>

        <button
          onClick={() => setShowQR(!showQR)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          title="Show QR Code"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" 
            />
          </svg>
        </button>

        {canRegenerate && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Regenerate invite link"
          >
            <svg className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* QR Code */}
      {showQR && inviteUrl && (
        <div className="p-4 bg-white rounded-lg border inline-block">
          <QRCodeCanvas value={inviteUrl} size={150} />
        </div>
      )}
    </div>
  )
}
```

### Step 5: Simplified groups-client.tsx

```typescript
// src/app/(dashboard)/groups/groups-client.tsx
'use client'

import Link from 'next/link'
import { useGroups, GroupCard } from '@/features/groups'
import { LoadingState } from '@/components/ui'
import type { GroupWithMembership } from '@/types/groups'

interface GroupsClientProps {
  initialMyGroups: GroupWithMembership[]
  initialPublicGroups: GroupWithMembership[]
  isAdmin: boolean
}

export function GroupsClient({ 
  initialMyGroups, 
  initialPublicGroups, 
  isAdmin 
}: GroupsClientProps) {
  const {
    myGroups,
    publicGroups,
    loading,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    addToMyGroups,
  } = useGroups({ initialMyGroups, initialPublicGroups })

  const displayedGroups = activeTab === 'my' ? myGroups : publicGroups

  const handleJoinGroup = async (groupId: string) => {
    // Join logic - move to hook
    const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' })
    if (res.ok) {
      const group = publicGroups.find(g => g.id === groupId)
      if (group) addToMyGroups(group)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Link
          href="/groups/create"
          className="px-4 py-2 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:opacity-90"
        >
          Create Group
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'my' 
              ? 'bg-[var(--stanford-cardinal)] text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          My Groups ({myGroups.length})
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'discover' 
              ? 'bg-[var(--stanford-cardinal)] text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Discover
        </button>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'recent' | 'members')}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="recent">Most Recent</option>
          <option value="name">Name</option>
          <option value="members">Members</option>
        </select>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <LoadingState />
      ) : displayedGroups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {activeTab === 'my' 
            ? "You haven't joined any groups yet" 
            : "No public groups to discover"}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {displayedGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              userRole={group.userRole}
              isMember={group.isMember}
              onJoin={() => handleJoinGroup(group.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

## Verification

### Unit Tests
```bash
# Run hook tests
npm run test:unit -- tests/unit/hooks/useGroup.test.ts
npm run test:unit -- tests/unit/hooks/useGroups.test.ts

# Run component tests
npm run test:unit -- tests/unit/components/GroupCard.test.ts
```

### Manual Testing
1. Navigate to `/groups` - verify list displays
2. Test search functionality
3. Test sort options (name, recent, members)
4. Test tab switching (My Groups / Discover)
5. Navigate to `/groups/{id}` - verify detail page
6. Test invite link copy and QR code
7. Test group actions (edit, duplicate)

### Type Check
```bash
npm run type-check
```

## Related Files

- `src/app/(dashboard)/groups/groups-client.tsx` (386 lines)
- `src/app/(dashboard)/groups/[id]/group-detail-client.tsx` (493 lines)
- `src/components/groups/GroupCard.tsx` (166 lines) - to migrate
- `src/features/groups/` - target location

## Dependencies

**Blocked By:**
- VIBE-0006A (Unit Tests)
- VIBE-0006B (Types & Foundation)
- VIBE-0006C (Member Management) - MemberPreview uses member components

**Blocks:**
- VIBE-0006E (Edit & Activity Create Pages)
- VIBE-0006F (Final Cleanup)

## Notes

- GroupCard can be migrated from `src/components/groups/` or recreated
- Consider lazy loading for activities list if group has many
- QRCodeCanvas is already a dependency (qrcode.react)
- Mobile-first responsive design for grid/list toggle

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created for groups list and detail extraction |
