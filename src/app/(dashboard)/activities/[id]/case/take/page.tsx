import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import { CaseTakeClient } from './case-take-client'
import type { CaseSettings } from '@/types/activities'

interface CaseTakePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attempt?: string }>
}

export default async function CaseTakePage({ params, searchParams }: CaseTakePageProps) {
  const { id: activityId } = await params
  const { attempt: attemptId } = await searchParams
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  if (!attemptId) {
    redirect(`/activities/${activityId}/case`)
  }

  // Get the attempt with group info
  const attempt = await prisma.caseAttempt.findUnique({
    where: { id: attemptId },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          description: true,
          openModeSettings: true,
          owningGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!attempt || attempt.userId !== session.user.id) {
    redirect(`/activities/${activityId}/case`)
  }

  if (attempt.status === 'completed') {
    redirect(`/activities/${activityId}/case`)
  }

  const caseSettings = (attempt.activity.openModeSettings as unknown as CaseSettings) || {
    scenarios: [],
    timePerCase: 10,
    totalTimeLimit: 60,
    passThreshold: 6.0,
    maxAttempts: 1,
    instructions: '',
  }

  // Get saved responses
  const savedResponses = (attempt.responses as Record<string, { issues: string; solution: string }>) || {}

  // Count user's attempts
  const attemptsCount = await prisma.caseAttempt.count({
    where: {
      activityId,
      userId: session.user.id,
    },
  })

  return (
    <CaseTakeClient
      activityId={activityId}
      activityName={attempt.activity.name}
      groupName={attempt.activity.owningGroup.name}
      attemptId={attemptId}
      scenarios={caseSettings.scenarios}
      timePerCase={caseSettings.timePerCase}
      totalTimeLimit={caseSettings.totalTimeLimit}
      passThreshold={caseSettings.passThreshold}
      maxAttempts={caseSettings.maxAttempts || 1}
      attemptsUsed={attemptsCount}
      savedResponses={savedResponses}
      startedAt={attempt.startedAt.toISOString()}
      instructions={caseSettings.instructions || attempt.activity.description || ''}
    />
  )
}
