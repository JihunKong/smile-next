import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import { ExamTakeClient } from './exam-take-client'
import type { ExamSettings } from '@/types/activities'

interface ExamTakePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ attempt?: string }>
}

export default async function ExamTakePage({ params, searchParams }: ExamTakePageProps) {
  const { id: activityId } = await params
  const { attempt: attemptId } = await searchParams
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  if (!attemptId) {
    redirect(`/activities/${activityId}/exam`)
  }

  // Get the attempt
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      activity: {
        select: {
          id: true,
          name: true,
          description: true,
          examSettings: true,
          owningGroup: {
            select: {
              name: true,
            },
          },
        },
      },
      responses: {
        select: {
          questionId: true,
          choice: true,
        },
      },
    },
  })

  if (!attempt || attempt.userId !== session.user.id) {
    redirect(`/activities/${activityId}/exam`)
  }

  if (attempt.status === 'completed') {
    redirect(`/activities/${activityId}/exam`)
  }

  // Get questions in order
  const questionOrder = (attempt.questionOrder as string[]) || []
  const questions = await prisma.question.findMany({
    where: { id: { in: questionOrder } },
    select: {
      id: true,
      content: true,
      choices: true,
    },
  })

  // Sort questions by order
  const orderedQuestions = questionOrder
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean) as typeof questions

  // Transform choices
  const questionsWithChoices = orderedQuestions.map((q) => ({
    id: q.id,
    content: q.content,
    choices: (q.choices as string[]) || [],
  }))

  // Get existing answers
  const existingAnswers: Record<string, string[]> = {}
  for (const response of attempt.responses) {
    existingAnswers[response.questionId] = response.choice?.split(',') || []
  }

  const examSettings = (attempt.activity.examSettings as unknown as ExamSettings) || {
    timeLimit: 30,
  }

  // Calculate remaining time
  const elapsedSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)
  const totalSeconds = examSettings.timeLimit * 60
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

  if (remainingSeconds <= 0) {
    // Time expired, redirect to exam page
    redirect(`/activities/${activityId}/exam`)
  }

  return (
    <ExamTakeClient
      activityId={activityId}
      activityName={attempt.activity.name}
      groupName={attempt.activity.owningGroup.name}
      attemptId={attemptId}
      questions={questionsWithChoices}
      existingAnswers={existingAnswers}
      remainingSeconds={remainingSeconds}
      totalQuestions={questionsWithChoices.length}
      timeLimitMinutes={examSettings.timeLimit}
      instructions={attempt.activity.description || undefined}
      description={attempt.activity.description || undefined}
    />
  )
}
