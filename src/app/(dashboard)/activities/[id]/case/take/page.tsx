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

  // Get the attempt
  const attempt = await prisma.caseAttempt.findUnique({
    where: { id: attemptId },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          openModeSettings: true,
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
  }

  // Get saved responses
  const savedResponses = (attempt.responses as Record<string, { issues: string; solution: string }>) || {}

  return (
    <CaseTakeClient
      activityId={activityId}
      activityName={attempt.activity.name}
      attemptId={attemptId}
      scenarios={caseSettings.scenarios}
      timePerCase={caseSettings.timePerCase}
      totalTimeLimit={caseSettings.totalTimeLimit}
      passThreshold={caseSettings.passThreshold}
      savedResponses={savedResponses}
      startedAt={attempt.startedAt.toISOString()}
    />
  )
}
