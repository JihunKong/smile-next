---
id: VIBE-0005-WI-19
title: Refactor Activity Create Page
status: ready
priority: P0
effort: M (1 hour)
dependencies: WI-04, WI-05, WI-06, WI-07, WI-08, WI-09, WI-10, WI-11
phase: 6 - Page Integration
parent: VIBE-0005
---

# WI-19: Refactor Activity Create Page

## Purpose
Replace 775-line page with composed components.

## Target
`src/app/(dashboard)/activities/create/page.tsx` → **~100 lines**

## Implementation

```typescript
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useActivityForm, useCreateActivity, useTeachableGroups } from '@/features/activities/hooks'
import { 
  BasicInfoFields, 
  GroupSelector, 
  GeneralSettings,
  ExamSettingsForm,
  InquirySettingsForm,
  CaseSettingsForm
} from '@/features/activities/components'
import { ModeSelector } from '@/components/modes/ModeSelector'
import { LoadingSpinner, Button } from '@/components/ui'
import { ActivityModes } from '@/types/activities'

const MODE_SETTINGS_FORMS = {
  [ActivityModes.EXAM]: ExamSettingsForm,
  [ActivityModes.INQUIRY]: InquirySettingsForm,
  [ActivityModes.CASE]: CaseSettingsForm,
}

export default function CreateActivityPage() {
  const router = useRouter()
  const { groups, isLoading: loadingGroups } = useTeachableGroups()
  const { values, errors, setField, validate, getSubmitData } = useActivityForm()
  const { createActivity, isLoading, error } = useCreateActivity({
    onSuccess: (activityId) => router.push(`/activities/${activityId}`)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createActivity(getSubmitData())
  }

  const ModeSettingsForm = MODE_SETTINGS_FORMS[values.mode]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/activities" className="...">← Back to Activities</Link>
          <h1 className="text-2xl font-bold">Create New Activity</h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorAlert message={error} />}
          
          <GroupSelector 
            groups={groups} 
            selectedGroupId={values.groupId}
            onGroupChange={(id) => setField('groupId', id)}
            isLoading={loadingGroups}
          />
          
          <BasicInfoFields 
            values={values} 
            onChange={setField} 
            errors={errors} 
          />
          
          <ModeSelector 
            selectedMode={values.mode} 
            onModeChange={(mode) => setField('mode', mode)} 
          />
          
          {ModeSettingsForm && <ModeSettingsForm values={values} onChange={setField} />}
          
          <GeneralSettings values={values} onChange={setField} />
          
          <div className="flex justify-end gap-4">
            <Link href="/activities">Cancel</Link>
            <Button type="submit" disabled={isLoading || groups.length === 0}>
              {isLoading ? <><LoadingSpinner /> Creating...</> : 'Create Activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

## Steps
1. Ensure all dependencies (WI-04 through WI-11) are complete
2. Create backup of original file
3. Replace page content with composed version
4. Verify all functionality works:
   - Form renders correctly
   - Mode selection changes form
   - Mode-specific settings appear
   - Validation works
   - Submit creates activity

## Acceptance Criteria
- [ ] Page file under 100 lines
- [ ] All components render correctly
- [ ] Form validation works
- [ ] Activity creation works
- [ ] Mode selection works
- [ ] Mode-specific settings render
- [ ] E2E tests pass

## Verification
```bash
# Run unit tests
npm run test -- tests/unit/components/activities/

# Run E2E tests
npm run test:e2e -- --grep "create activity"

# Check line count
wc -l src/app/\(dashboard\)/activities/create/page.tsx
```
