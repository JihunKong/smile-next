'use client'

interface InquiryProgressProps {
  current: number
  total: number
  showCurrentQuestion?: boolean
  averageScore?: number
  compact?: boolean
}

export function InquiryProgress({
  current,
  total,
  showCurrentQuestion = false,
  averageScore,
  compact = false,
}: InquiryProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0
  const remaining = total - current
  const currentQuestion = Math.min(current + 1, total)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 font-medium">{current}/{total}</span>
      </div>
    )
  }

  return (
    <div>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Progress Details */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{current} completed</span>
        <span>{remaining} remaining</span>
      </div>

      {/* Optional Current Question Display */}
      {showCurrentQuestion && (
        <div className="text-center mt-2 text-sm text-gray-600">
          Question {currentQuestion} of {total}
        </div>
      )}

      {/* Optional Average Score */}
      {averageScore !== undefined && (
        <div className="text-center mt-2 text-sm text-gray-500">
          Average Score:{' '}
          <span className="font-semibold text-gray-900">
            {averageScore.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  )
}
