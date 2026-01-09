import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { ExamSettings } from '@/types/activities'

interface ExamLeaderboardPageProps {
  params: Promise<{ id: string }>
}

interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  scorePercentage: number
  passed: boolean
  correctAnswers: number
  totalQuestions: number
  timeTakenSeconds: number | null
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

export default async function ExamLeaderboardPage({ params }: ExamLeaderboardPageProps) {
  const { id: activityId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Get activity with exam settings
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      name: true,
      examSettings: true,
    },
  })

  if (!activity) {
    notFound()
  }

  const examSettings = (activity.examSettings as unknown as ExamSettings) || {
    passThreshold: 60,
  }

  // Get all completed exam attempts
  const attempts = await prisma.examAttempt.findMany({
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
      { score: 'desc' },
      { completedAt: 'asc' },
    ],
  })

  // Calculate statistics
  const stats: Stats = {
    totalAttempts: attempts.length,
    uniqueStudents: new Set(attempts.map(a => a.userId)).size,
    averageScore: attempts.length > 0
      ? attempts.reduce((acc, a) => acc + (a.score || 0), 0) / attempts.length
      : 0,
    passRate: attempts.length > 0
      ? (attempts.filter(a => (a.score || 0) >= examSettings.passThreshold).length / attempts.length) * 100
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

    if (!bestScoreByUser[userId] || (attempt.score || 0) > bestScoreByUser[userId]) {
      bestScoreByUser[userId] = attempt.score || 0
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

  // Build entries
  attempts.forEach((attempt, index) => {
    const userName = attempt.user.firstName && attempt.user.lastName
      ? `${attempt.user.firstName} ${attempt.user.lastName}`
      : attempt.user.username || 'Anonymous'

    const isBest = (attempt.score || 0) === bestScoreByUser[attempt.userId]
    const isRecent = mostRecentByUser[attempt.userId] === attempt.id
    let filterType: 'best' | 'recent' | 'both' = 'best'
    if (isBest && isRecent) filterType = 'both'
    else if (isBest) filterType = 'best'
    else if (isRecent) filterType = 'recent'
    else filterType = 'recent' // Default to recent for all others

    const timeTaken = attempt.completedAt && attempt.startedAt
      ? Math.floor((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : null

    leaderboard.push({
      rank: index + 1,
      userId: attempt.userId,
      userName,
      scorePercentage: attempt.score || 0,
      passed: (attempt.score || 0) >= examSettings.passThreshold,
      correctAnswers: attempt.correctAnswers || 0,
      totalQuestions: attempt.totalQuestions || 0,
      timeTakenSeconds: timeTaken,
      attemptNumber: userAttemptCounts[attempt.userId],
      submittedAt: attempt.completedAt,
      filterType,
    })
  })

  // Calculate user summary
  let userSummary: UserSummary | null = null
  const userAttempts = attempts.filter(a => a.userId === session.user.id)
  if (userAttempts.length > 0) {
    const userBest = Math.max(...userAttempts.map(a => a.score || 0))
    const userPassCount = userAttempts.filter(a => (a.score || 0) >= examSettings.passThreshold).length
    const userRank = leaderboard.findIndex(e => e.userId === session.user.id && e.scorePercentage === userBest) + 1

    userSummary = {
      bestScore: userBest,
      totalAttempts: userAttempts.length,
      passRate: (userPassCount / userAttempts.length) * 100,
      rank: userRank || leaderboard.length + 1,
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Exam Leaderboard
              </h1>
              <p className="text-gray-600 mt-2">{activity.name}</p>
            </div>
            <Link
              href={`/activities/${activityId}/exam`}
              className="mt-4 md:mt-0 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Exam
            </Link>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
              <thead style={{ backgroundColor: '#7c3aed' }}>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white">Rank</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-white">Student</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Score</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-white">Correct</th>
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold mr-3">
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
                      <span className={`text-lg font-bold ${entry.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.scorePercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        entry.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.passed ? (
                          <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-gray-700 text-sm font-medium">
                        {entry.correctAnswers}/{entry.totalQuestions}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-gray-700 text-xs">
                        {entry.timeTakenSeconds
                          ? `${Math.floor(entry.timeTakenSeconds / 60)}m ${entry.timeTakenSeconds % 60}s`
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-600 whitespace-nowrap">
                      {entry.submittedAt
                        ? new Date(entry.submittedAt).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </td>
                  </tr>
                ))}

                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 text-lg">No exam attempts yet</p>
                      <p className="text-gray-400 text-sm mt-2">Be the first to take the exam!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Performance Summary */}
        {userSummary && (
          <div className="bg-white rounded-lg shadow-xl p-6 mt-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-700 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Your Performance Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                <p className="text-sm text-blue-700 mb-1">Your Best Score</p>
                <p className="text-3xl font-bold text-blue-600">{userSummary.bestScore.toFixed(1)}%</p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
                <p className="text-sm text-green-700 mb-1">Total Attempts</p>
                <p className="text-3xl font-bold text-green-600">{userSummary.totalAttempts}</p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-4">
                <p className="text-sm text-yellow-700 mb-1">Pass Rate</p>
                <p className="text-3xl font-bold text-yellow-600">{userSummary.passRate.toFixed(1)}%</p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-lg p-4">
                <p className="text-sm text-purple-700 mb-1">Your Rank</p>
                <p className="text-3xl font-bold text-purple-600">#{userSummary.rank}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
