import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { InquirySettings } from '@/types/activities'

interface InquiryLeaderboardPageProps {
  params: Promise<{ id: string }>
}

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  qualityScore: number
  qualityPercentage: number
  passed: boolean
  questionsGenerated: number
  questionsRequired: number
  avgBloomLevel: number
  timeTaken: string
  attemptNumber: number
  submittedAt: Date | null
  filterType: 'best' | 'recent' | 'both'
}

interface Stats {
  totalAttempts: number
  uniqueStudents: number
  averageScore: number
  passRate: number
}

interface UserSummary {
  bestScore: number
  totalAttempts: number
  passRate: number
  rank: number
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

export default async function InquiryLeaderboardPage({ params }: InquiryLeaderboardPageProps) {
  const { id: activityId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Get activity with inquiry settings (stored in openModeSettings)
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      name: true,
      openModeSettings: true,
    },
  })

  if (!activity) {
    notFound()
  }

  const inquirySettings = (activity.openModeSettings as unknown as InquirySettings) || {
    passThreshold: 6.0,
    questionsRequired: 5,
  }

  // Get all completed inquiry attempts
  const attempts = await prisma.inquiryAttempt.findMany({
    where: {
      activityId,
      status: 'completed',
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
        },
      },
    },
    orderBy: [
      { questionsGenerated: 'desc' },
      { completedAt: 'asc' },
    ],
  })

  // Get question evaluations for these attempts' users to calculate scores
  const userIds = [...new Set(attempts.map(a => a.userId))]
  const questions = await prisma.question.findMany({
    where: {
      activityId,
      creatorId: { in: userIds },
    },
    select: {
      creatorId: true,
      questionEvaluationScore: true,
      evaluation: {
        select: {
          bloomsLevel: true,
        },
      },
    },
  })

  // Convert Bloom's level string to number
  const bloomLevelMap: Record<string, number> = {
    'remember': 1,
    'understand': 2,
    'apply': 3,
    'analyze': 4,
    'evaluate': 5,
    'create': 6,
  }

  // Calculate scores per user
  const userScores: Record<string, { totalScore: number, count: number, totalBloom: number }> = {}
  questions.forEach(q => {
    if (!userScores[q.creatorId]) {
      userScores[q.creatorId] = { totalScore: 0, count: 0, totalBloom: 0 }
    }
    if (q.questionEvaluationScore !== null) {
      userScores[q.creatorId].totalScore += q.questionEvaluationScore
      userScores[q.creatorId].count += 1
    }
    if (q.evaluation?.bloomsLevel) {
      const bloomLevel = bloomLevelMap[q.evaluation.bloomsLevel.toLowerCase()] || 0
      userScores[q.creatorId].totalBloom += bloomLevel
    }
  })

  // Calculate statistics
  const avgScores = Object.values(userScores).map(s => s.count > 0 ? s.totalScore / s.count : 0)
  const overallAvg = avgScores.length > 0 ? avgScores.reduce((a, b) => a + b, 0) / avgScores.length : 0

  const stats: Stats = {
    totalAttempts: attempts.length,
    uniqueStudents: new Set(attempts.map(a => a.userId)).size,
    averageScore: overallAvg * 10, // Convert to percentage
    passRate: attempts.length > 0
      ? (attempts.filter(a => {
          const userScore = userScores[a.userId]
          const avgScore = userScore && userScore.count > 0 ? userScore.totalScore / userScore.count : 0
          return avgScore >= inquirySettings.passThreshold
        }).length / attempts.length) * 100
      : 0,
  }

  // Build leaderboard entries
  const leaderboard: LeaderboardEntry[] = []
  const userAttemptCounts: Record<string, number> = {}
  const bestScoreByUser: Record<string, number> = {}
  const mostRecentByUser: Record<string, string> = {}

  // First pass: find best and most recent for each user
  attempts.forEach(attempt => {
    const userId = attempt.userId
    userAttemptCounts[userId] = (userAttemptCounts[userId] || 0) + 1
    const userScore = userScores[userId]
    const avgScore = userScore && userScore.count > 0 ? userScore.totalScore / userScore.count : 0

    if (!bestScoreByUser[userId] || avgScore > bestScoreByUser[userId]) {
      bestScoreByUser[userId] = avgScore
    }
  })

  // Sort by completedAt to find most recent
  const sortedByDate = [...attempts].sort((a, b) =>
    (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
  )
  sortedByDate.forEach(attempt => {
    if (!mostRecentByUser[attempt.userId]) {
      mostRecentByUser[attempt.userId] = attempt.id
    }
  })

  // Build entries sorted by score
  const entriesWithScores = attempts.map(attempt => {
    const userScore = userScores[attempt.userId]
    const avgScore = userScore && userScore.count > 0 ? userScore.totalScore / userScore.count : 0
    const avgBloom = userScore && userScore.count > 0 ? userScore.totalBloom / userScore.count : 0
    return { attempt, avgScore, avgBloom }
  }).sort((a, b) => b.avgScore - a.avgScore)

  entriesWithScores.forEach(({ attempt, avgScore, avgBloom }, index) => {
    const userName = attempt.user.firstName && attempt.user.lastName
      ? `${attempt.user.firstName} ${attempt.user.lastName}`
      : attempt.user.username || 'Anonymous'

    const isBest = avgScore === bestScoreByUser[attempt.userId]
    const isRecent = mostRecentByUser[attempt.userId] === attempt.id
    let filterType: 'best' | 'recent' | 'both' = 'best'
    if (isBest && isRecent) filterType = 'both'
    else if (isBest) filterType = 'best'
    else if (isRecent) filterType = 'recent'
    else filterType = 'recent'

    const timeTaken = attempt.completedAt && attempt.startedAt
      ? formatTime(Math.floor((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000))
      : 'N/A'

    leaderboard.push({
      rank: index + 1,
      userId: attempt.userId,
      userName,
      qualityScore: avgScore,
      qualityPercentage: avgScore * 10, // 0-10 to 0-100%
      passed: avgScore >= inquirySettings.passThreshold,
      questionsGenerated: attempt.questionsGenerated,
      questionsRequired: attempt.questionsRequired,
      avgBloomLevel: avgBloom,
      timeTaken,
      attemptNumber: userAttemptCounts[attempt.userId],
      submittedAt: attempt.completedAt,
      filterType,
    })
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-yellow-600 flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Inquiry Leaderboard
              </h1>
              <p className="text-gray-600 mt-2">{activity.name}</p>
            </div>
            <Link
              href={`/activities/${activityId}/inquiry`}
              className="mt-4 md:mt-0 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Inquiry Mode
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
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Passing Criteria
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>To pass this inquiry activity:</strong></p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li><strong>Minimum Quality Score:</strong> {inquirySettings.passThreshold}/10 average per question</li>
                  <li><strong>Questions Required:</strong> {inquirySettings.questionsRequired} questions must be generated</li>
                </ul>
                <p className="mt-3 text-sm text-gray-800 bg-yellow-50 px-3 py-2 rounded border-l-4 border-yellow-500">
                  <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <strong>Tip:</strong> Focus on generating higher Bloom&apos;s taxonomy level questions for better scores!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Attempts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</p>
              </div>
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Participants</p>
                <p className="text-2xl font-bold text-green-600">{stats.uniqueStudents}</p>
              </div>
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Average Score</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.averageScore.toFixed(1)}%</p>
              </div>
              <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pass Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.passRate.toFixed(1)}%</p>
              </div>
              <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: '#ca8a04' }}>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white">Rank</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white">Student</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Quality Score</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Questions</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Bloom Level</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Time</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboard.map((entry) => (
                  <tr
                    key={`${entry.userId}-${entry.attemptNumber}`}
                    className={`hover:bg-gray-50 transition-colors ${
                      entry.userId === session.user.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-3 py-3">
                      <span className="text-sm font-bold text-gray-600">#{entry.rank}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold mr-3">
                          {entry.userName[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {entry.userName}
                            {entry.userId === session.user.id && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-1">You</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${entry.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.qualityPercentage.toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500">({entry.qualityScore.toFixed(1)}/10)</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        entry.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.passed ? (
                          <>
                            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Passed
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Failed
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {entry.questionsGenerated}/{entry.questionsRequired}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {entry.avgBloomLevel.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm text-gray-600">{entry.timeTaken}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-gray-500">
                        {entry.submittedAt
                          ? new Date(entry.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}

                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No inquiry attempts yet</p>
                      <p className="text-gray-400 text-sm mt-2">Be the first to complete this inquiry activity!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Performance Card */}
        {userSummary && (
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg shadow-xl p-6 mt-6 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Performance
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Your Best Score</p>
                <p className="text-3xl font-bold">{userSummary.bestScore.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-yellow-100 text-sm mb-1">Your Rank</p>
                <p className="text-3xl font-bold">#{userSummary.rank}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-sm mb-1">Total Attempts</p>
                <p className="text-3xl font-bold">{userSummary.totalAttempts}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-sm mb-1">Your Pass Rate</p>
                <p className="text-3xl font-bold">{userSummary.passRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
