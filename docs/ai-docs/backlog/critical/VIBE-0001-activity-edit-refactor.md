---
id: VIBE-0001
title: Refactor Activity Edit page for AI-friendly development (1134 lines → ~150 each)
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-17
updated: 2026-01-17
effort: l
assignee: ai-agent
---

# Refactor Activity Edit Page for Vibe Coding

## Summary

The Activity Edit page (`activities/[id]/edit/page.tsx`) is **1134 lines** - the largest file in the codebase. This makes AI-assisted development ("vibe coding") extremely difficult because:
- File exceeds typical LLM context windows
- AI must make blind edits based on partial understanding
- Changes risk breaking unrelated functionality
- Designers cannot easily locate styling to modify

## Current Behavior

Single monolithic file containing:
- 5 interface definitions (lines 8-62)
- 15+ useState declarations (lines 77-95+)
- Multiple fetch functions with manual loading/error handling
- Form sections for: Basic Info, Open Mode, Exam Mode, Inquiry Mode, Case Mode
- Inline Tailwind styling throughout
- Mode-specific logic interleaved

```
activities/[id]/edit/page.tsx (1134 lines)
├── Interfaces (55 lines)
├── State management (~50 useState calls)
├── Data fetching (useEffect + callbacks)
├── Form handlers
├── Basic Info section
├── Mode-specific settings (4 modes)
├── Delete modal
└── Submit logic
```

## Expected Behavior

Feature folder structure with focused, reusable components:

```
activities/[id]/edit/
├── page.tsx                    (~80 lines)  - Composition only
├── components/
│   ├── BasicInfoForm.tsx       (~150 lines) - Name, description, visibility
│   ├── OpenModeSettings.tsx    (~120 lines) - Open mode config
│   ├── ExamModeSettings.tsx    (~150 lines) - Exam mode config  
│   ├── InquiryModeSettings.tsx (~100 lines) - Inquiry mode config
│   ├── CaseModeSettings.tsx    (~100 lines) - Case mode config (redirect)
│   ├── DeleteActivityModal.tsx (~80 lines)  - Delete confirmation
│   └── index.ts                             - Barrel export
├── hooks/
│   ├── useActivityEdit.ts      (~100 lines) - Data fetching & mutations
│   └── index.ts
└── types.ts                    (~60 lines)  - All interfaces
```

## Acceptance Criteria

- [ ] Main `page.tsx` under 100 lines (composition only)
- [ ] Each component file under 200 lines
- [ ] All interfaces moved to `types.ts`
- [ ] Custom hook `useActivityEdit` encapsulates data fetching
- [ ] Each mode settings component is independent
- [ ] Barrel exports for clean imports
- [ ] No functionality changes - pure refactor
- [ ] All existing tests still pass

## Technical Approach

### 1. Extract Types

```typescript
// activities/[id]/edit/types.ts
export interface OpenModeSettings {
  is_pass_fail_enabled?: boolean
  required_question_count?: number
  // ... rest from original
}

export interface ExamSettings { ... }
export interface InquirySettings { ... }
export interface ActivityData { ... }
```

### 2. Create Data Hook

```typescript
// activities/[id]/edit/hooks/useActivityEdit.ts
import { useState, useEffect, useCallback } from 'react'
import { ActivityData } from '../types'

export function useActivityEdit(activityId: string) {
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async () => {
    // ... fetch logic
  }, [activityId])

  const saveActivity = async (data: Partial<ActivityData>) => {
    // ... save logic
  }

  const deleteActivity = async () => {
    // ... delete logic
  }

  useEffect(() => { fetchActivity() }, [fetchActivity])

  return { activity, loading, saving, error, saveActivity, deleteActivity }
}
```

### 3. Extract Mode Components

```typescript
// activities/[id]/edit/components/ExamModeSettings.tsx
import { ExamSettings } from '../types'

interface Props {
  settings: ExamSettings
  onChange: (settings: ExamSettings) => void
  hasAttempts: boolean
}

export function ExamModeSettings({ settings, onChange, hasAttempts }: Props) {
  return (
    <div className="space-y-6">
      {/* Time limit */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Time Limit (minutes)
        </label>
        <input
          type="number"
          value={settings.time_limit_minutes || 30}
          onChange={(e) => onChange({ 
            ...settings, 
            time_limit_minutes: parseInt(e.target.value) 
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      {/* ... other fields */}
    </div>
  )
}
```

### 4. Compose in Page

```typescript
// activities/[id]/edit/page.tsx
'use client'

import { useActivityEdit } from './hooks'
import { 
  BasicInfoForm, 
  ExamModeSettings, 
  OpenModeSettings,
  InquiryModeSettings,
  DeleteActivityModal 
} from './components'
import { LoadingState, ErrorState } from '@/components/ui'

export default function ActivityEditPage() {
  const { id } = useParams()
  const { activity, loading, saving, error, saveActivity, deleteActivity } = useActivityEdit(id)
  
  if (loading) return <LoadingState message="Loading activity..." />
  if (error) return <ErrorState message={error} />
  if (!activity) return <ErrorState message="Activity not found" />

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <BasicInfoForm activity={activity} onSave={saveActivity} />
      
      {activity.mode === 0 && (
        <OpenModeSettings 
          settings={activity.openModeSettings} 
          onChange={(s) => saveActivity({ openModeSettings: s })} 
        />
      )}
      
      {activity.mode === 1 && (
        <ExamModeSettings 
          settings={activity.examSettings}
          onChange={(s) => saveActivity({ examSettings: s })}
          hasAttempts={activity.hasAttempts}
        />
      )}
      
      {/* ... other modes ... */}
      
      <DeleteActivityModal onDelete={deleteActivity} />
    </div>
  )
}
```

## Related Files

- `src/app/(dashboard)/activities/[id]/edit/page.tsx` - Target file
- `src/components/ui/` - Reuse existing UI components
- `src/app/(dashboard)/activities/create/page.tsx` - Similar patterns to extract

## Dependencies

**Blocked By:**
- None

**Blocks:**
- VIBE-0007 (Activity Create) - can share extracted components

## Notes

- This is the **#1 priority** for vibe coding readiness
- Extract in order: types → hooks → components → compose
- Test after each extraction step
- Consider React Query migration (REFACTOR-0001) as enhancement after this

## Conversation History

| Date | Note |
|------|------|
| 2026-01-17 | Created as top priority for AI-friendly refactoring |
