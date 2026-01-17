'use client'

import { useState, useMemo } from 'react'
import type { LeaderboardEntry, UserSummary } from './page'

type FilterType = 'best' | 'recent' | 'all'

interface LeaderboardClientProps {
  leaderboard: LeaderboardEntry[]
  currentUserId: string
  userSummary: UserSummary | null
}

export default function LeaderboardClient({
  leaderboard,
  currentUserId,
  userSummary,
}: LeaderboardClientProps) {
  const [filter, setFilter] = useState<FilterType>('best')

  const filteredLeaderboard = useMemo(() => {
    let filtered: LeaderboardEntry[]

    switch (filter) {
      case 'best':
        // Show only best attempts (one per user)
        filtered = leaderboard.filter(e => e.filterType === 'best' || e.filterType === 'both')
        break
      case 'recent':
        // Show only most recent attempts (one per user)
        filtered = leaderboard.filter(e => e.filterType === 'recent' || e.filterType === 'both')
        break
      case 'all':
      default:
        filtered = leaderboard
    }

    // Re-rank the filtered list
    return filtered.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
  }, [leaderboard, filter])

  const filterTabs = [
    { key: 'best' as FilterType, label: 'Best Attempts', icon: '🏆', description: 'Highest score per student' },
    { key: 'recent' as FilterType, label: 'Recent', icon: '🕐', description: 'Most recent attempt per student' },
    { key: 'all' as FilterType, label: 'All', icon: '📋', description: 'All attempts' },
  ]

  return (
    <>
      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-xl p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                filter === tab.key
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {filterTabs.find(t => t.key === filter)?.description}
        </p>
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
              {filteredLeaderboard.map((entry) => (
                <tr
                  key={entry.uniqueKey}
                  className={`hover:bg-gray-50 transition-colors ${
                    entry.userId === currentUserId ? 'bg-blue-50' : ''
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
                          {entry.userId === currentUserId && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-1">You</span>
                          )}
                        </p>
                        {filter === 'all' && entry.filterType === 'best' && (
                          <span className="text-xs text-yellow-600">🏆 Best</span>
                        )}
                        {filter === 'all' && entry.filterType === 'recent' && (
                          <span className="text-xs text-blue-600">🕐 Recent</span>
                        )}
                        {filter === 'all' && entry.filterType === 'both' && (
                          <span className="text-xs text-purple-600">🏆 Best & Recent</span>
                        )}
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

              {filteredLeaderboard.length === 0 && (
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
    </>
  )
}
