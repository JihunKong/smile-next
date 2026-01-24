---
id: VIBE-0005
title: Refactor Activity Create & Detail pages (1464 total lines)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-17
effort: m
assignee: ai-agent
---

# Refactor Activity Create & Detail Pages for Vibe Coding

## Summary

The Activity Create and Detail pages are core user journeys with **1,464 combined lines**. These pages share many patterns with Activity Edit (VIBE-0001) and should reuse extracted components.

| File | Lines | Purpose |
|------|-------|---------|
| `activities/create/page.tsx` | 774 | Create new activity |
| `activities/[id]/page.tsx` | 690 | View activity detail |
| **Total** | **1,464** | |

## Current Behavior

- Create page duplicates form logic from Edit page
- Detail page has complex conditional rendering for different modes
- Both have inline styling and repeated patterns
- No component sharing between them

## Expected Behavior

Shared activity components with focused pages:

```
features/activities/
├── components/
│   ├── ActivityForm/
│   │   ├── BasicInfoFields.tsx   (~100 lines) - Name, desc, visibility
│   │   ├── ModeSelector.tsx      (~80 lines)  - Mode selection cards
│   │   ├── GroupSelector.tsx     (~80 lines)  - Select owning group
│   │   └── index.ts
│   ├── ActivityHeader.tsx        (~80 lines)  - Title, mode badge, actions
│   ├── ActivityStats.tsx         (~100 lines) - Questions, responses stats
│   ├── ActivityActions.tsx       (~80 lines)  - Edit, delete, share buttons
│   ├── ModeContent/
│   │   ├── OpenModeContent.tsx   (~100 lines)
│   │   ├── ExamModeContent.tsx   (~100 lines)
│   │   ├── InquiryModeContent.tsx (~100 lines)
│   │   ├── CaseModeContent.tsx   (~100 lines)
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   ├── useActivity.ts            (~80 lines)  - Fetch single activity
│   ├── useCreateActivity.ts      (~60 lines)  - Create mutation
│   └── index.ts
└── types.ts

app/(dashboard)/activities/
├── create/
│   └── page.tsx                  (~100 lines)
├── [id]/
│   └── page.tsx                  (~100 lines)
└── activities-client.tsx         (~150 lines) - Already reasonable
```

## Acceptance Criteria

- [ ] Create `src/features/activities/` module
- [ ] Extract shared form components (reuse in Edit)
- [ ] Create mode-specific content components
- [ ] Share `BasicInfoFields` between Create and Edit
- [ ] Activity detail page under 150 lines
- [ ] Activity create page under 150 lines
- [ ] Extract `useActivity` and `useCreateActivity` hooks
- [ ] All component files under 150 lines

## Technical Approach

### 1. Shared Form Components

```typescript
// features/activities/components/ActivityForm/BasicInfoFields.tsx
interface Props {
  values: {
    name: string
    description: string
    visible: boolean
  }
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
}

export function BasicInfoFields({ values, onChange, errors }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Activity Name</label>
        <input
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          placeholder="Enter activity name..."
        />
        {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={values.visible}
          onChange={(e) => onChange('visible', e.target.checked)}
        />
        <label>Visible to students</label>
      </div>
    </div>
  )
}
```

### 2. Mode Content Components

```typescript
// features/activities/components/ModeContent/ExamModeContent.tsx
interface Props {
  activity: Activity
  isOwner: boolean
}

export function ExamModeContent({ activity, isOwner }: Props) {
  const stats = activity.examStats
  
  return (
    <div className="space-y-6">
      {/* Exam status */}
      <div className="flex items-center gap-2">
        <Badge variant={activity.examSettings?.is_published ? 'success' : 'warning'}>
          {activity.examSettings?.is_published ? 'Published' : 'Draft'}
        </Badge>
        <span className="text-sm text-gray-500">
          {stats.attemptCount} attempts
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Avg Score" value={`${stats.avgScore}%`} />
        <StatCard label="Pass Rate" value={`${stats.passRate}%`} />
        <StatCard label="Questions" value={stats.questionCount} />
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="flex gap-2">
          <Link href={`/activities/${activity.id}/edit`}>
            <Button>Edit Settings</Button>
          </Link>
          <Link href={`/activities/${activity.id}/exam/analytics`}>
            <Button variant="secondary">View Analytics</Button>
          </Link>
        </div>
      )}

      {/* Take exam button for students */}
      {!isOwner && activity.examSettings?.is_published && (
        <Link href={`/activities/${activity.id}/exam/take`}>
          <Button variant="primary" size="lg" className="w-full">
            Take Exam
          </Button>
        </Link>
      )}
    </div>
  )
}
```

### 3. Simplified Detail Page

```typescript
// activities/[id]/page.tsx
import { useActivity } from '@/features/activities/hooks'
import { 
  ActivityHeader, 
  ActivityStats,
  OpenModeContent,
  ExamModeContent,
  InquiryModeContent,
  CaseModeContent,
} from '@/features/activities/components'

const MODE_COMPONENTS = {
  0: OpenModeContent,
  1: ExamModeContent,
  2: InquiryModeContent,
  3: CaseModeContent,
}

export default function ActivityDetailPage() {
  const { id } = useParams()
  const { activity, loading, error } = useActivity(id)
  const { data: session } = useSession()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />

  const isOwner = activity.ownerId === session?.user?.id
  const ModeContent = MODE_COMPONENTS[activity.mode]

  return (
    <div className="max-w-4xl mx-auto py-8">
      <ActivityHeader activity={activity} isOwner={isOwner} />
      <ActivityStats activity={activity} />
      <ModeContent activity={activity} isOwner={isOwner} />
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/activities/create/page.tsx`
- `src/app/(dashboard)/activities/[id]/page.tsx`
- `src/app/(dashboard)/activities/[id]/edit/page.tsx` - Share components with VIBE-0001
- `src/app/(dashboard)/groups/[id]/activities/create/page.tsx` - 676 lines, similar

## Dependencies

**Blocked By:**
- VIBE-0001 (Activity Edit) - share form components

**Blocks:**
- Groups activity create (similar patterns)

## Notes

- The Groups activity create page (676 lines) is nearly identical to Activities create
- After this refactor, groups create should just reuse `<ActivityForm group={group} />`
- Mode content components will be reused on group detail pages too

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created - Core activity pages for user journey |
