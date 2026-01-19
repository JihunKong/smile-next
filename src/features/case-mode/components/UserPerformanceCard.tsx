// UserPerformanceCard Component
// Displays the current user's performance summary
// Used at the bottom of the leaderboard page

import type { UserSummary } from '../types'

interface UserPerformanceCardProps {
  /** The user's performance summary */
  summary: UserSummary
}

const UserIcon = (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

/**
 * Displays the current user's performance summary in a gradient card.
 */
export function UserPerformanceCard({ summary }: UserPerformanceCardProps) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-xl p-6 mt-6 text-white">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        {UserIcon}
        Your Performance
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-blue-100 text-sm mb-1">Your Best Score</p>
          <p className="text-3xl font-bold">{summary.bestScore.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-blue-100 text-sm mb-1">Your Rank</p>
          <p className="text-3xl font-bold">#{summary.rank}</p>
        </div>
        <div>
          <p className="text-blue-100 text-sm mb-1">Total Attempts</p>
          <p className="text-3xl font-bold">{summary.totalAttempts}</p>
        </div>
        <div>
          <p className="text-blue-100 text-sm mb-1">Your Pass Rate</p>
          <p className="text-3xl font-bold">{summary.passRate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  )
}
