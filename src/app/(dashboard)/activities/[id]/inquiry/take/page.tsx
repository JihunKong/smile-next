import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import { InquiryTakeClient } from './inquiry-take-client'
import type { InquirySettings } from '@/types/activities'

interface InquiryTakePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attempt?: string }>
}

export default async function InquiryTakePage({ params, searchParams }: InquiryTakePageProps) {
  const { id: activityId } = await params
  const { attempt: attemptId } = await searchParams
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  if (!attemptId) {
    redirect(`/activities/${activityId}/inquiry`)
  }

  // Get the attempt
  const attempt = await prisma.inquiryAttempt.findUnique({
    where: { id: attemptId },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          inquirySettings: true,
        },
      },
    },
  })

  if (!attempt || attempt.userId !== session.user.id) {
    redirect(`/activities/${activityId}/inquiry`)
  }

  if (attempt.status === 'completed') {
    redirect(`/activities/${activityId}/inquiry`)
  }

  const inquirySettings = (attempt.activity.inquirySettings as unknown as InquirySettings) || {
    questionsRequired: 5,
    timePerQuestion: 240,
    keywordPool1: [],
    keywordPool2: [],
    passThreshold: 6.0,
  }

  // Get previously submitted questions
  const submittedQuestions = await prisma.question.findMany({
    where: {
      activityId: attempt.activityId,
      creatorId: session.user.id,
      questionType: 'inquiry',
      createdAt: { gte: attempt.startedAt },
    },
    include: {
      evaluation: {
        select: {
          overallScore: true,
          bloomsLevel: true,
          evaluationText: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <InquiryTakeClient
      activityId={activityId}
      activityName={attempt.activity.name}
      attemptId={attemptId}
      questionsRequired={inquirySettings.questionsRequired}
      timePerQuestion={inquirySettings.timePerQuestion}
      keywordPool1={inquirySettings.keywordPool1}
      keywordPool2={inquirySettings.keywordPool2}
      passThreshold={inquirySettings.passThreshold}
      submittedQuestions={submittedQuestions.map((q) => ({
        id: q.id,
        content: q.content,
        score: q.evaluation?.overallScore || null,
        bloomsLevel: q.evaluation?.bloomsLevel || null,
        feedback: q.evaluation?.evaluationText || null,
      }))}
    />
  )
}
