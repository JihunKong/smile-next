// LeaderboardRow Component
// Displays a single row in the case mode leaderboard table
// Used in leaderboard page

import type { LeaderboardEntry } from '../types'

interface LeaderboardRowProps {
  /** The leaderboard entry data */
  entry: LeaderboardEntry
  /** Whether this entry belongs to the current user */
  isCurrentUser: boolean
}

const CheckIcon = (
  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

const FailIcon = (
  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
)

/**
 * Displays a single row in the leaderboard table.
 */
export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isCurrentUser ? 'bg-blue-50' : ''}`}>
      <td className="px-3 py-3">
        <span className="text-sm font-bold text-gray-600">#{entry.rank}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold mr-3">
            {entry.userName[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {entry.userName}
              {isCurrentUser && (
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
          {entry.passed ? <>{CheckIcon}Passed</> : <>{FailIcon}Failed</>}
        </span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-sm font-medium text-gray-700">{entry.numCasesShown}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-sm text-gray-600">{entry.timeTaken}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
          #{entry.attemptNumber}
        </span>
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
  )
}
