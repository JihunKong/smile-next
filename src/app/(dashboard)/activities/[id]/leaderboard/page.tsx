import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ActivityLeaderboardPage({ params }: Props) {
  const { id } = await params

  const activity = await prisma.activity.findUnique({
    where: { id },
    select: { mode: true }
  })

  if (!activity) {
    notFound()
  }

  // Redirect based on activity mode
  // 0=Open (no leaderboard), 1=Exam, 2=Inquiry, 3=Case
  switch (activity.mode) {
    case 1:
      redirect(`/activities/${id}/exam/leaderboard`)
    case 2:
      redirect(`/activities/${id}/inquiry/leaderboard`)
    case 3:
      redirect(`/activities/${id}/case/leaderboard`)
    default:
      // Open mode - redirect to activity page
      redirect(`/activities/${id}`)
  }
}
