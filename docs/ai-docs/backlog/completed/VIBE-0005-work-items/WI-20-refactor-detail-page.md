---
id: VIBE-0005-WI-20
title: Refactor Activity Detail Page
status: ready
priority: P0
effort: M (1 hour)
dependencies: WI-12, WI-13, WI-14, WI-15, WI-16, WI-17, WI-18
phase: 6 - Page Integration
parent: VIBE-0005
---

# WI-20: Refactor Activity Detail Page

## Purpose
Replace 691-line page with composed components.

## Target
`src/app/(dashboard)/activities/[id]/page.tsx` → **~100 lines**

## Implementation

```typescript
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import { 
  ActivityHeader, 
  ActivityStats, 
  ActivityActions
} from '@/features/activities/components/ActivityDetail'
import { 
  OpenModeContent,
  ExamModeContent,
  InquiryModeContent,
  CaseModeContent
} from '@/features/activities/components/ModeContent'
import { QuestionList } from '@/components/activities/QuestionList'
import { ActivityModes } from '@/types/activities'

const MODE_CONTENT_COMPONENTS = {
  [ActivityModes.OPEN]: OpenModeContent,
  [ActivityModes.EXAM]: ExamModeContent,
  [ActivityModes.INQUIRY]: InquiryModeContent,
  [ActivityModes.CASE]: CaseModeContent,
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ActivityDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      owningGroup: {
        select: { id: true, name: true, creatorId: true, members: { select: { userId: true, role: true } } }
      },
      questions: { /* ... */ },
      _count: { select: { questions: true } }
    }
  })

  if (!activity) notFound()

  const isOwner = activity.owningGroup.creatorId === session.user.id ||
    activity.owningGroup.members.some(m => m.userId === session.user.id && m.role >= 2)

  const ModeContent = MODE_CONTENT_COMPONENTS[activity.mode as keyof typeof MODE_CONTENT_COMPONENTS]

  return (
    <div className="min-h-screen bg-gray-50">
      <ActivityHeader activity={activity} />
      
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <ActivityStats activity={activity} />
        
        <ActivityActions 
          activity={activity} 
          isOwner={isOwner} 
          onDelete={/* server action */}
        />
        
        <ModeContent activity={activity} isOwner={isOwner} />
        
        {activity.mode === ActivityModes.OPEN && (
          <QuestionList 
            questions={activity.questions} 
            activityId={activity.id}
            canPost={!isOwner}
          />
        )}
      </div>
    </div>
  )
}
```

## Steps
1. Ensure all dependencies (WI-12 through WI-18) are complete
2. Create backup of original file
3. Replace page content with composed version
4. Verify all functionality works for each mode

## Acceptance Criteria
- [ ] Page file under 100 lines
- [ ] All components render correctly
- [ ] Open mode shows questions
- [ ] Exam mode shows exam info and actions
- [ ] Inquiry mode shows inquiry info
- [ ] Case mode shows case info
- [ ] Owner actions work
- [ ] E2E tests pass

## Verification
```bash
# Run unit tests
npm run test -- tests/unit/components/activities/

# Run E2E tests
npm run test:e2e -- --grep "activity detail"

# Check line count
wc -l src/app/\(dashboard\)/activities/\[id\]/page.tsx
```
