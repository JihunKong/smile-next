---
id: VIBE-0006E
title: Refactor Group Edit & Activity Create Pages
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

# Refactor Group Edit & Activity Create Pages

## Summary

Refactor the Group Edit page (667 lines) and Group Activity Create page (676 lines) into lean pages that leverage shared form components. The Activity Create page should reuse the `ActivityForm` component from `features/activities` (created in VIBE-0005).

## Current State

**Source Files:**
| File | Lines | Issues |
|------|-------|--------|
| `groups/[id]/edit/page.tsx` | 667 | Form logic, image upload, validation all inline |
| `groups/[id]/activities/create/page.tsx` | 676 | Duplicates activity create logic from activities feature |

**Issues:**
- Group edit has massive inline form with complex state
- Image upload/delete logic duplicated from other forms
- Activity create duplicates the same patterns from the activities page
- No form abstraction for reuse

## Target State

```
src/features/groups/
├── components/
│   ├── GroupForm.tsx           (~150 lines) - Create/edit form
│   ├── GroupImageUpload.tsx    (~100 lines) - Image picker
│   └── index.ts
├── hooks/
│   ├── useGroupForm.ts         (~80 lines)  - Form state & validation
│   └── index.ts
└── ...

app/(dashboard)/groups/[id]/
├── edit/page.tsx               (~80 lines)  - Uses GroupForm
├── activities/create/page.tsx  (~50 lines)  - Reuses ActivityForm
```

## Acceptance Criteria

### Prerequisites
- [ ] VIBE-0005 completed (ActivityForm available in features/activities)

### Unit Tests First (TDD)
- [ ] Write tests for `useGroupForm` hook validation logic
- [ ] Write tests for image upload component

### Group Form Components
- [ ] Create `GroupForm` component
  - Name, description inputs
  - Privacy toggle (public/private)
  - Passcode settings (if private)
  - Gradient picker for auto-icon
  - Image upload option
  - Submit with loading state
- [ ] Create `GroupImageUpload` component
  - File input with preview
  - Drag & drop support
  - Delete uploaded image
  - Gradient fallback preview
- [ ] Create `useGroupForm` hook
  - Form state management
  - Validation rules
  - Submit handler with API call
  - Error handling

### Page Simplification
- [ ] Refactor edit page to <100 lines
- [ ] Refactor activity create to <50 lines (reuse ActivityForm)

## Technical Approach

### Step 1: useGroupForm Hook

```typescript
// src/features/groups/hooks/useGroupForm.ts
'use client'

import { useState, useCallback } from 'react'
import type { GroupFormData } from '../types'

interface UseGroupFormOptions {
  mode: 'create' | 'edit'
  groupId?: string
  initialData?: Partial<GroupFormData>
  onSuccess?: (groupId: string) => void
}

const defaultFormData: GroupFormData = {
  name: '',
  description: '',
  isPrivate: false,
  requirePasscode: false,
  passcode: '',
  groupImageUrl: null,
  autoIconGradient: '0',
}

export function useGroupForm({ 
  mode, 
  groupId, 
  initialData,
  onSuccess 
}: UseGroupFormOptions) {
  const [formData, setFormData] = useState<GroupFormData>({
    ...defaultFormData,
    ...initialData,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof GroupFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateField = useCallback(<K extends keyof GroupFormData>(
    field: K, 
    value: GroupFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof GroupFormData, string>> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    if (formData.isPrivate && formData.requirePasscode && !formData.passcode) {
      newErrors.passcode = 'Passcode is required when enabled'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const submit = useCallback(async () => {
    if (!validate()) return false
    
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const url = mode === 'create' 
        ? '/api/groups' 
        : `/api/groups/${groupId}`
      
      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save group')
      }

      const data = await response.json()
      onSuccess?.(data.id || groupId!)
      return true
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, mode, groupId, validate, onSuccess])

  return {
    formData,
    errors,
    isSubmitting,
    submitError,
    updateField,
    setFormData,
    validate,
    submit,
  }
}
```

### Step 2: GroupForm Component

```typescript
// src/features/groups/components/GroupForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useGroupForm } from '../hooks/useGroupForm'
import { GroupImageUpload } from './GroupImageUpload'
import { getGradientColors, getGroupInitials } from '@/lib/groups/utils'
import type { GroupFormData } from '../types'

interface GroupFormProps {
  mode: 'create' | 'edit'
  groupId?: string
  initialData?: Partial<GroupFormData>
  onCancel?: () => void
}

export function GroupForm({ mode, groupId, initialData, onCancel }: GroupFormProps) {
  const router = useRouter()
  
  const {
    formData,
    errors,
    isSubmitting,
    submitError,
    updateField,
  } = useGroupForm({
    mode,
    groupId,
    initialData,
    onSuccess: (id) => router.push(`/groups/${id}`),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit()
  }

  const gradientIndex = parseInt(formData.autoIconGradient || '0')
  const gradient = getGradientColors(gradientIndex)
  const initials = getGroupInitials(formData.name || 'New Group')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Group Icon Preview */}
      <div className="flex items-center gap-6">
        <div 
          className="w-24 h-24 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
          style={{ 
            background: formData.groupImageUrl 
              ? `url(${formData.groupImageUrl}) center/cover`
              : `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
          }}
        >
          {!formData.groupImageUrl && initials}
        </div>
        
        <div className="flex-1 space-y-2">
          <GroupImageUpload
            currentImage={formData.groupImageUrl}
            onImageChange={(url) => updateField('groupImageUrl', url)}
          />
          
          {/* Gradient Picker */}
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const g = getGradientColors(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateField('autoIconGradient', String(i))}
                  className={`w-8 h-8 rounded-full ${gradientIndex === i ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Group Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : ''}`}
          placeholder="Enter group name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border rounded-lg"
          placeholder="Describe your group (optional)"
        />
      </div>

      {/* Privacy Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isPrivate"
          checked={formData.isPrivate}
          onChange={(e) => updateField('isPrivate', e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="isPrivate" className="text-sm text-gray-700">
          Make this group private (invite-only)
        </label>
      </div>

      {/* Passcode (if private) */}
      {formData.isPrivate && (
        <div className="pl-7 space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requirePasscode"
              checked={formData.requirePasscode}
              onChange={(e) => updateField('requirePasscode', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="requirePasscode" className="text-sm text-gray-700">
              Require passcode to join
            </label>
          </div>
          
          {formData.requirePasscode && (
            <input
              type="text"
              value={formData.passcode}
              onChange={(e) => updateField('passcode', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg ${errors.passcode ? 'border-red-500' : ''}`}
              placeholder="Enter passcode"
            />
          )}
          {errors.passcode && <p className="text-sm text-red-500">{errors.passcode}</p>}
        </div>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Group' : 'Save Changes'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
```

### Step 3: Simplified Edit Page

```typescript
// src/app/(dashboard)/groups/[id]/edit/page.tsx
'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useGroup, GroupForm } from '@/features/groups'
import { LoadingState } from '@/components/ui'

export default function GroupEditPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const { group, loading, error } = useGroup({ groupId, includeMembers: false })

  if (loading) return <LoadingState />
  
  if (error || !group) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center text-red-500">
          {error || 'Group not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href={`/groups/${groupId}`}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Edit Group</h1>
      </div>

      {/* Form */}
      <GroupForm
        mode="edit"
        groupId={groupId}
        initialData={{
          name: group.name,
          description: group.description || '',
          isPrivate: group.isPrivate,
          requirePasscode: group.requirePasscode || false,
          passcode: group.passcode || '',
          groupImageUrl: group.groupImageUrl,
          autoIconGradient: group.autoIconGradient || '0',
        }}
        onCancel={() => router.back()}
      />
    </div>
  )
}
```

### Step 4: Simplified Activity Create Page (Reuses ActivityForm)

```typescript
// src/app/(dashboard)/groups/[id]/activities/create/page.tsx
'use client'

import { use } from 'react'
import Link from 'next/link'
import { useGroup } from '@/features/groups'
import { ActivityForm } from '@/features/activities'
import { LoadingState } from '@/components/ui'

export default function GroupActivityCreatePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: groupId } = use(params)
  const { group, loading } = useGroup({ groupId, includeActivities: false })

  if (loading) return <LoadingState />

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center text-red-500">Group not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href={`/groups/${groupId}`}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back to {group.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        Create Activity in {group.name}
      </h1>

      {/* Reuse ActivityForm from features/activities */}
      <ActivityForm 
        defaultGroupId={groupId}
        redirectTo={`/groups/${groupId}`}
      />
    </div>
  )
}
```

## Verification

### Unit Tests
```bash
# Run form hook tests
npm run test:unit -- tests/unit/hooks/useGroupForm.test.ts

# Run image upload tests
npm run test:unit -- tests/unit/components/GroupImageUpload.test.ts
```

### Manual Testing
1. Navigate to `/groups/create` - verify form works
2. Navigate to `/groups/{id}/edit` - verify pre-populated data
3. Test image upload and preview
4. Test gradient picker
5. Test privacy/passcode toggle
6. Test form validation messages
7. Navigate to `/groups/{id}/activities/create`
8. Verify ActivityForm works in group context

### Type Check
```bash
npm run type-check
```

## Related Files

- `src/app/(dashboard)/groups/[id]/edit/page.tsx` (667 lines)
- `src/app/(dashboard)/groups/[id]/activities/create/page.tsx` (676 lines)
- `src/features/activities/components/ActivityForm.tsx` - From VIBE-0005
- `src/features/groups/` - Target location

## Dependencies

**Blocked By:**
- VIBE-0005 (Activity Pages) - Need ActivityForm component
- VIBE-0006A (Unit Tests)
- VIBE-0006B (Types & Foundation)
- VIBE-0006D (Groups List & Detail) - useGroup hook

**Blocks:**
- VIBE-0006F (Final Cleanup)

## Notes

- This is the largest reduction: 676 lines → ~50 lines for activity create
- GroupForm can also be used in groups/create/page.tsx (create new group)
- Image upload might need cloud storage integration (check existing implementation)
- Consider extracting gradient picker to shared component

## Conversation History

| Date | Note |
|------|------|
| 2026-01-23 | Created for form extraction work |
