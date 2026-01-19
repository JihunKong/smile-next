// ScoreDisplay Component
// Displays a score with color coding based on value
// Used in results page and leaderboard

// ============================================================================
// Score Color Utilities
// ============================================================================

/**
 * Get text color class based on score (0-10 scale)
 */
export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get background color class based on score (0-10 scale)
 */
export function getScoreBgColor(score: number): string {
  if (score >= 8) return 'bg-green-100'
  if (score >= 6) return 'bg-yellow-100'
  return 'bg-red-100'
}

/**
 * Get progress bar color class based on score (0-10 scale)
 */
export function getBarColor(score: number): string {
  if (score >= 8) return 'bg-green-500'
  if (score >= 6) return 'bg-yellow-500'
  return 'bg-red-500'
}

// ============================================================================
// ScoreDisplay Component
// ============================================================================

interface ScoreDisplayProps {
  /** Score value (0-10 scale) */
  score: number
  /** Maximum possible score (default: 10) */
  maxScore?: number
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show a progress bar beneath the score */
  showBar?: boolean
  /** Label to display above the score */
  label?: string
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-5xl',
}

/**
 * Displays a score with color coding based on value.
 * Optionally shows a progress bar and label.
 */
export function ScoreDisplay({
  score,
  maxScore = 10,
  size = 'md',
  showBar = false,
  label,
}: ScoreDisplayProps) {
  const percentage = (score / maxScore) * 100
  const colorClass = getScoreColor(score)
  const barColorClass = getBarColor(score)

  return (
    <div>
      {label && (
        <p className="text-xs text-gray-600 mb-1">{label}</p>
      )}
      <span className={`font-bold ${colorClass} ${sizeClasses[size]}`}>
        {score.toFixed(1)}
      </span>
      {showBar && (
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all ${barColorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}
