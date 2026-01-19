import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { CaseSettings, LeaderboardEntry, LeaderboardStats, UserSummary } from '@/features/case-mode'
import { StatCard, LeaderboardRow, UserPerformanceCard } from '@/features/case-mode'

interface CaseLeaderboardPageProps {
  params: Promise<{ id: string }>
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

// Icons for stat cards
const AttemptsIcon = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)
const ParticipantsIcon = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)
const ScoreIcon = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)
const PassIcon = (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default async function CaseLeaderboardPage({ params }: CaseLeaderboardPageProps) {
  const { id: activityId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Get activity with case settings
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, name: true, openModeSettings: true },
  })

  if (!activity) {
    notFound()
  }

  const caseSettings = (activity.openModeSettings as unknown as CaseSettings) || { passThreshold: 6.0 }

  // Get all completed case attempts
  const attempts = await prisma.caseAttempt.findMany({
    where: { activityId, status: 'completed' },
    include: { user: { select: { id: true, firstName: true, lastName: true, username: true } } },
    orderBy: [{ totalScore: 'desc' }, { completedAt: 'asc' }],
  })

  // Calculate statistics
  const stats: LeaderboardStats = {
    totalAttempts: attempts.length,
    uniqueStudents: new Set(attempts.map(a => a.userId)).size,
    averageScore: attempts.length > 0 ? (attempts.reduce((acc, a) => acc + (a.totalScore || 0), 0) / attempts.length) * 10 : 0,
    passRate: attempts.length > 0 ? (attempts.filter(a => (a.totalScore || 0) >= caseSettings.passThreshold).length / attempts.length) * 100 : 0,
  }

  // Build leaderboard entries
  const userAttemptCounts: Record<string, number> = {}
  const bestScoreByUser: Record<string, number> = {}
  const mostRecentByUser: Record<string, string> = {}

  attempts.forEach(attempt => {
    const userId = attempt.userId
    userAttemptCounts[userId] = (userAttemptCounts[userId] || 0) + 1
    if (!bestScoreByUser[userId] || (attempt.totalScore || 0) > bestScoreByUser[userId]) {
      bestScoreByUser[userId] = attempt.totalScore || 0
    }
  })

  const sortedByDate = [...attempts].sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
  sortedByDate.forEach(attempt => {
    if (!mostRecentByUser[attempt.userId]) mostRecentByUser[attempt.userId] = attempt.id
  })

  const leaderboard: LeaderboardEntry[] = attempts.map((attempt, index) => {
    const userName = attempt.user.firstName && attempt.user.lastName
      ? `${attempt.user.firstName} ${attempt.user.lastName}` : attempt.user.username || 'Anonymous'
    const isBest = (attempt.totalScore || 0) === bestScoreByUser[attempt.userId]
    const isRecent = mostRecentByUser[attempt.userId] === attempt.id
    const filterType = isBest && isRecent ? 'both' : isBest ? 'best' : 'recent'
    const qualityScore = attempt.totalScore || 0
    const scenarioScores = attempt.scenarioScores as Record<string, unknown> | null

    return {
      rank: index + 1,
      userId: attempt.userId,
      userName,
      qualityScore,
      qualityPercentage: qualityScore * 10,
      passed: qualityScore >= caseSettings.passThreshold,
      numCasesShown: scenarioScores ? Object.keys(scenarioScores).length : 0,
      timeTaken: attempt.completedAt && attempt.startedAt
        ? formatTime(Math.floor((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000)) : 'N/A',
      attemptNumber: userAttemptCounts[attempt.userId],
      submittedAt: attempt.completedAt,
      filterType,
    }
  })

  // Calculate user summary
  let userSummary: UserSummary | null = null
  const userAttempts = attempts.filter(a => a.userId === session.user.id)
  if (userAttempts.length > 0) {
    const userBest = Math.max(...userAttempts.map(a => (a.totalScore || 0) * 10))
    const userPassCount = userAttempts.filter(a => (a.totalScore || 0) >= caseSettings.passThreshold).length
    const userRank = leaderboard.findIndex(e => e.userId === session.user.id && e.qualityPercentage === userBest) + 1
    userSummary = { bestScore: userBest, totalAttempts: userAttempts.length, passRate: (userPassCount / userAttempts.length) * 100, rank: userRank || leaderboard.length + 1 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Case Mode Leaderboard
              </h1>
              <p className="text-gray-600 mt-2">{activity.name}</p>
            </div>
            <Link href={`/activities/${activityId}/case`} className="mt-4 md:mt-0 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Case Mode
            </Link>
          </div>
        </div>

        {/* Passing Criteria Info */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-4 mb-6 border-l-4 border-green-500">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Evaluation Criteria</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Cases are evaluated on 4 dimensions (0-10 scale each):</strong></p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li><strong>Understanding:</strong> Comprehension of case context and nuances</li>
                  <li><strong>Ingenuity:</strong> Creative and innovative problem-solving</li>
                  <li><strong>Critical Thinking:</strong> Depth of flaw identification</li>
                  <li><strong>Real-World Application:</strong> Practicality of proposed solutions</li>
                </ul>
                <p className="mt-3 text-sm text-gray-800 bg-yellow-50 px-3 py-2 rounded border-l-4 border-yellow-500">
                  <strong>Passing Threshold:</strong> {caseSettings.passThreshold.toFixed(1)}/10 ({(caseSettings.passThreshold * 10).toFixed(0)}% overall score required to pass)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Attempts" value={stats.totalAttempts} valueColor="text-blue-600" icon={AttemptsIcon} iconColor="text-blue-500" />
          <StatCard label="Participants" value={stats.uniqueStudents} valueColor="text-green-600" icon={ParticipantsIcon} iconColor="text-green-500" />
          <StatCard label="Average Score" value={`${stats.averageScore.toFixed(1)}%`} valueColor="text-yellow-600" icon={ScoreIcon} iconColor="text-yellow-500" />
          <StatCard label="Pass Rate" value={`${stats.passRate.toFixed(1)}%`} valueColor="text-purple-600" icon={PassIcon} iconColor="text-purple-500" />
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#a855f7' }}>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white">Rank</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white">Student</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Quality Score</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Cases Evaluated</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Time</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Attempt</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.map((entry) => (
                  <LeaderboardRow key={`${entry.userId}-${entry.attemptNumber}`} entry={entry} isCurrentUser={entry.userId === session.user.id} />
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No case attempts yet</p>
                      <p className="text-gray-400 text-sm mt-2">Be the first to complete this case activity!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Performance Card */}
        {userSummary && <UserPerformanceCard summary={userSummary} />}
      </div>
    </div>
  )
}
