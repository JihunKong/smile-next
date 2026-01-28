'use client'

import { getScoreColor, getScoreQualityLabel } from '../utils'

interface QualityScoreDisplayProps {
  score: number | null
  maxScore?: number
  showLabel?: boolean
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const SIZE_CLASSES = {
  sm: {
    score: 'text-lg',
    maxScore: 'text-xs',
    label: 'text-xs',
  },
  md: {
    score: 'text-2xl',
    maxScore: 'text-sm',
    label: 'text-sm',
  },
  lg: {
    score: 'text-4xl',
    maxScore: 'text-base',
    label: 'text-base',
  },
}

export function QualityScoreDisplay({
  score,
  maxScore = 10,
  showLabel = false,
  showPercentage = false,
  size = 'sm',
  loading = false,
}: QualityScoreDisplayProps) {
  const sizeClasses = SIZE_CLASSES[size]

  if (loading) {
    return (
      <div className="flex flex-col items-center" data-testid="score-loading">
        <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
        <p className={`text-yellow-600 mt-1 ${sizeClasses.label}`}>Evaluating</p>
      </div>
    )
  }

  if (showPercentage && score !== null) {
    const percentage = Math.round((score / maxScore) * 100)
    const colorClass = getScoreColor(score)

    return (
      <div className="text-center">
        <span className={`font-bold ${sizeClasses.score} ${colorClass}`}>
          {percentage}%
        </span>
        {showLabel && (
          <div className={`font-medium ${sizeClasses.label} ${colorClass}`}>
            {getScoreQualityLabel(score)}
          </div>
        )}
      </div>
    )
  }

  const colorClass = score !== null ? getScoreColor(score) : 'text-gray-500'
  const displayScore = score !== null ? score.toFixed(1) : '-'

  return (
    <div className="text-center">
      <span className={`font-bold ${sizeClasses.score} ${colorClass}`}>
        {displayScore}
      </span>
      <span className={`text-gray-500 ${sizeClasses.maxScore}`}> / {maxScore}</span>
      {showLabel && score !== null && (
        <div className={`font-medium ${sizeClasses.label} ${colorClass}`}>
          {getScoreQualityLabel(score)}
        </div>
      )}
    </div>
  )
}
