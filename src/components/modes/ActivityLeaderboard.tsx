'use client'

import React from 'react'

interface LeaderboardEntry {
  userId: string
  userName: string
  totalScore: number
  averageScore?: number | null
  rank?: number | null
  attemptCount?: number
}

interface ActivityLeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  mode?: 'exam' | 'inquiry' | 'case'
  title?: string
  showPodium?: boolean
  maxEntries?: number
}

const rankColors = {
  1: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', medal: 'text-yellow-500' },
  2: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700', medal: 'text-gray-400' },
  3: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', medal: 'text-orange-500' },
}

function MedalIcon({ rank }: { rank: number }) {
  const color = rankColors[rank as keyof typeof rankColors]?.medal || 'text-gray-400'

  return (
    <svg className={`w-6 h-6 ${color}`} fill="currentColor" viewBox="0 0 24 24">
      {rank === 1 && (
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      )}
      {rank === 2 && (
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      )}
      {rank === 3 && (
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      )}
    </svg>
  )
}

function PodiumView({ topThree, currentUserId, mode }: { topThree: LeaderboardEntry[]; currentUserId?: string; mode?: string }) {
  // Reorder for podium: 2nd, 1st, 3rd
  const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean)
  const heights = ['h-20', 'h-28', 'h-16'] // 2nd, 1st, 3rd

  return (
    <div className="flex items-end justify-center gap-2 mb-6 pt-8">
      {podiumOrder.map((entry, index) => {
        if (!entry) return null
        const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3
        const colors = rankColors[actualRank as keyof typeof rankColors]
        const isCurrentUser = entry.userId === currentUserId

        return (
          <div key={entry.userId} className="flex flex-col items-center">
            {/* Avatar and Name */}
            <div className="mb-2 text-center">
              <div
                className={`w-12 h-12 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center mb-1 ${
                  isCurrentUser ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                <span className={`font-bold ${colors.text}`}>
                  {entry.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className={`text-sm font-medium truncate max-w-[80px] ${isCurrentUser ? 'text-blue-600' : 'text-gray-900'}`}>
                {entry.userName}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {mode === 'exam' ? `${entry.totalScore.toFixed(0)}%` : entry.totalScore.toFixed(1)}
              </p>
            </div>

            {/* Podium Block */}
            <div
              className={`${heights[index]} w-20 ${colors.bg} ${colors.border} border-2 rounded-t-lg flex items-start justify-center pt-2`}
            >
              <MedalIcon rank={actualRank} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ActivityLeaderboard({
  entries,
  currentUserId,
  mode = 'exam',
  title = 'Leaderboard',
  showPodium = true,
  maxEntries = 10,
}: ActivityLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p>No rankings yet</p>
          <p className="text-sm text-gray-400 mt-1">Complete an attempt to appear on the leaderboard</p>
        </div>
      </div>
    )
  }

  // Sort by score and assign ranks
  const sortedEntries = [...entries]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, maxEntries)
    .map((entry, index) => ({
      ...entry,
      rank: entry.rank || index + 1,
    }))

  const topThree = sortedEntries.slice(0, 3)
  const remainingEntries = sortedEntries.slice(3)

  // Find current user's position if not in top entries
  const currentUserEntry = currentUserId
    ? sortedEntries.find((e) => e.userId === currentUserId)
    : null

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        {title}
      </h3>

      {/* Podium View */}
      {showPodium && topThree.length >= 1 && (
        <PodiumView topThree={topThree} currentUserId={currentUserId} mode={mode} />
      )}

      {/* Remaining Rankings Table */}
      {remainingEntries.length > 0 && (
        <div className="border-t pt-4">
          <div className="space-y-2">
            {remainingEntries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCurrentUser ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <span
                      className={`font-medium ${isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}
                    >
                      {entry.userName}
                      {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                    </span>
                  </div>
                  <span className={`font-bold ${isCurrentUser ? 'text-blue-600' : 'text-gray-700'}`}>
                    {mode === 'exam' ? `${entry.totalScore.toFixed(0)}%` : entry.totalScore.toFixed(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Current User Position (if not in visible list) */}
      {currentUserEntry && currentUserEntry.rank && currentUserEntry.rank > maxEntries && (
        <div className="mt-4 pt-4 border-t border-dashed">
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-sm font-bold">
                {currentUserEntry.rank}
              </span>
              <span className="font-medium text-blue-700">
                {currentUserEntry.userName}
                <span className="ml-2 text-xs">(You)</span>
              </span>
            </div>
            <span className="font-bold text-blue-600">
              {mode === 'exam'
                ? `${currentUserEntry.totalScore.toFixed(0)}%`
                : currentUserEntry.totalScore.toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityLeaderboard
