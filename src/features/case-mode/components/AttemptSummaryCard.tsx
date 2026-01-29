'use client'

interface AttemptSummaryCardProps {
  totalAttempts: number
  passedCount: number
  bestScore: number
  remaining: number
}

export function AttemptSummaryCard({
  totalAttempts,
  passedCount,
  bestScore,
  remaining,
}: AttemptSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center p-4 bg-indigo-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Attempts</p>
          <p className="text-4xl font-bold text-indigo-600">{totalAttempts}</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">Passed</p>
          <p className="text-4xl font-bold text-green-600">{passedCount}</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">Best Score</p>
          <p className="text-4xl font-bold text-yellow-600">{bestScore.toFixed(1)}</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-2">Remaining</p>
          <p className="text-4xl font-bold text-gray-600">{remaining}</p>
        </div>
      </div>
    </div>
  )
}
