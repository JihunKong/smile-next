import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import type { InquirySettings } from '@/types/activities'
import {
  LeaderboardHeader,
  PassingCriteriaInfo,
  LeaderboardStats,
  LeaderboardTable,
  UserPerformanceCard,
  formatTime,
  BLOOMS_LEVEL_VALUES,
  type LeaderboardEntry,
  type InquiryStats,
  type UserSummary,
} from '@/features/inquiry-mode'

interface InquiryLeaderboardPageProps {
  params: Promise<{ id: string }>
}

export default async function InquiryLeaderboardPage({ params }: InquiryLeaderboardPageProps) {
  const { id: activityId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Get activity with inquiry settings
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, name: true, openModeSettings: true },
  })

  if (!activity) {
    notFound()
  }

  const inquirySettings = (activity.openModeSettings as unknown as InquirySettings) || {
    passThreshold: 6.0,
    questionsRequired: 5,
  }

  // Get completed inquiry attempts
  const attempts = await prisma.inquiryAttempt.findMany({
    where: { activityId, status: 'completed' },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, username: true },
      },
    },
    orderBy: [{ questionsGenerated: 'desc' }, { completedAt: 'asc' }],
  })

  // Get question evaluations
  const userIds = [...new Set(attempts.map(a => a.userId))]
  const questions = await prisma.question.findMany({
    where: { activityId, creatorId: { in: userIds } },
    select: {
      creatorId: true,
      questionEvaluationScore: true,
      evaluation: { select: { bloomsLevel: true } },
    },
  })

  // Calculate scores per user
  const userScores: Record<string, { totalScore: number; count: number; totalBloom: number }> = {}
  questions.forEach(q => {
    if (!userScores[q.creatorId]) {
      userScores[q.creatorId] = { totalScore: 0, count: 0, totalBloom: 0 }
    }
    if (q.questionEvaluationScore !== null) {
      userScores[q.creatorId].totalScore += q.questionEvaluationScore
      userScores[q.creatorId].count += 1
    }
    if (q.evaluation?.bloomsLevel) {
      const level = q.evaluation.bloomsLevel.toLowerCase() as keyof typeof BLOOMS_LEVEL_VALUES
      userScores[q.creatorId].totalBloom += BLOOMS_LEVEL_VALUES[level] || 0
    }
  })

  // Calculate statistics
  const avgScores = Object.values(userScores).map(s => (s.count > 0 ? s.totalScore / s.count : 0))
  const overallAvg = avgScores.length > 0 ? avgScores.reduce((a, b) => a + b, 0) / avgScores.length : 0

  const stats: InquiryStats = {
    totalAttempts: attempts.length,
    uniqueStudents: new Set(attempts.map(a => a.userId)).size,
    averageScore: overallAvg * 10,
    passRate: attempts.length > 0
      ? (attempts.filter(a => {
          const userScore = userScores[a.userId]
          const avgScore = userScore && userScore.count > 0 ? userScore.totalScore / userScore.count : 0
          return avgScore >= inquirySettings.passThreshold
        }).length / attempts.length) * 100
      : 0,
  }

  // Build leaderboard entries
  const bestScoreByUser: Record<string, number> = {}
  const mostRecentByUser: Record<string, string> = {}
  const userAttemptCounts: Record<string, number> = {}

  attempts.forEach(attempt => {
    userAttemptCounts[attempt.userId] = (userAttemptCounts[attempt.userId] || 0) + 1
    const userScore = userScores[attempt.userId]
    const avgScore = userScore && userScore.count > 0 ? userScore.totalScore / userScore.count : 0
    if (!bestScoreByUser[attempt.userId] || avgScore > bestScoreByUser[attempt.userId]) {
      bestScoreByUser[attempt.userId] = avgScore
    }
  })

  const sortedByDate = [...attempts].sort((a, b) =>
    (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
  )
  sortedByDate.forEach(attempt => {
    if (!mostRecentByUser[attempt.userId]) {
      mostRecentByUser[attempt.userId] = attempt.id
    }
  })

  const leaderboard: LeaderboardEntry[] = attempts
    .map(attempt => {
      const userScore = userScores[attempt.userId]
      const avgScore = userScore && userScore.count > 0 ? userScore.totalScore / userScore.count : 0
      const avgBloom = userScore && userScore.count > 0 ? userScore.totalBloom / userScore.count : 0
      return { attempt, avgScore, avgBloom }
    })
    .sort((a, b) => b.avgScore - a.avgScore)
    .map(({ attempt, avgScore, avgBloom }, index) => {
      const userName = attempt.user.firstName && attempt.user.lastName
        ? `${attempt.user.firstName} ${attempt.user.lastName}`
        : attempt.user.username || 'Anonymous'

      const isBest = avgScore === bestScoreByUser[attempt.userId]
      const isRecent = mostRecentByUser[attempt.userId] === attempt.id
      let filterType: 'best' | 'recent' | 'both' = isBest && isRecent ? 'both' : isBest ? 'best' : 'recent'

      const timeTaken = attempt.completedAt && attempt.startedAt
        ? formatTime(Math.floor((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000))
        : 'N/A'

      return {
        rank: index + 1,
        userId: attempt.userId,
        userName,
        qualityScore: avgScore,
        qualityPercentage: avgScore * 10,
        passed: avgScore >= inquirySettings.passThreshold,
        questionsGenerated: attempt.questionsGenerated,
        questionsRequired: attempt.questionsRequired,
        avgBloomLevel: avgBloom,
        timeTaken,
        attemptNumber: userAttemptCounts[attempt.userId],
        submittedAt: attempt.completedAt,
        filterType,
      }
    })

  // Calculate user summary
  let userSummary: UserSummary | null = null
  const userAttempts = attempts.filter(a => a.userId === session.user.id)
  if (userAttempts.length > 0) {
    const userScore = userScores[session.user.id]
    const userBest = userScore && userScore.count > 0 ? (userScore.totalScore / userScore.count) * 10 : 0
    const userPassCount = userAttempts.filter(() => {
      const avgScore = userScore && userScore.count > 0 ? userScore.totalScore / userScore.count : 0
      return avgScore >= inquirySettings.passThreshold
    }).length
    const userRank = leaderboard.findIndex(e => e.userId === session.user.id) + 1

    userSummary = {
      bestScore: userBest,
      totalAttempts: userAttempts.length,
      passRate: (userPassCount / userAttempts.length) * 100,
      rank: userRank || leaderboard.length + 1,
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <LeaderboardHeader
          activityId={activityId}
          activityName={activity.name}
          title="Inquiry Leaderboard"
          backLabel="Back to Inquiry Mode"
        />

        <PassingCriteriaInfo
          passThreshold={inquirySettings.passThreshold}
          questionsRequired={inquirySettings.questionsRequired}
          labels={{
            title: 'Passing Criteria',
            description: 'To pass this inquiry activity:',
            minScore: 'Minimum Quality Score:',
            questionsRequired: 'Questions Required:',
            tip: "Focus on generating higher Bloom's taxonomy level questions for better scores!",
          }}
        />

        <LeaderboardStats
          stats={stats}
          labels={{
            totalAttempts: 'Total Attempts',
            participants: 'Participants',
            averageScore: 'Average Score',
            passRate: 'Pass Rate',
          }}
        />

        <LeaderboardTable
          entries={leaderboard}
          currentUserId={session.user.id}
          labels={{
            rank: 'Rank',
            student: 'Student',
            qualityScore: 'Quality Score',
            status: 'Status',
            questions: 'Questions',
            bloomLevel: 'Bloom Level',
            time: 'Time',
            date: 'Date',
            passed: 'Passed',
            failed: 'Failed',
            you: 'You',
            noAttempts: 'No inquiry attempts yet',
            beFirst: 'Be the first to complete this inquiry activity!',
          }}
        />

        {userSummary && (
          <UserPerformanceCard
            summary={userSummary}
            labels={{
              title: 'Your Performance',
              bestScore: 'Your Best Score',
              rank: 'Your Rank',
              totalAttempts: 'Total Attempts',
              passRate: 'Your Pass Rate',
            }}
          />
        )}
      </div>
    </div>
  )
}
