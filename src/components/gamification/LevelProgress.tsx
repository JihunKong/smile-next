'use client'

import { useMemo, useEffect, useState } from 'react'
import LevelBadge, { LEVEL_CONFIGS } from './LevelBadge'

export interface LevelProgressProps {
  currentPoints: number
  levelThresholds: number[] // Points needed for each level
  currentLevel: number
  showBadge?: boolean
  animated?: boolean
  className?: string
}

// Default thresholds if none provided (progressive difficulty)
const DEFAULT_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500]

export default function LevelProgress({
  currentPoints,
  levelThresholds = DEFAULT_THRESHOLDS,
  currentLevel,
  showBadge = true,
  animated = true,
  className = '',
}: LevelProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  const progressInfo = useMemo(() => {
    const clampedLevel = Math.min(Math.max(currentLevel, 1), 6)
    const thresholds = levelThresholds.length > 0 ? levelThresholds : DEFAULT_THRESHOLDS

    // Get points for current level and next level
    const currentThreshold = thresholds[clampedLevel - 1] || 0
    const nextThreshold = thresholds[clampedLevel] || thresholds[thresholds.length - 1]

    // Calculate progress within current level
    const pointsInLevel = currentPoints - currentThreshold
    const pointsNeeded = nextThreshold - currentThreshold
    const percentage = pointsNeeded > 0
      ? Math.min(Math.max((pointsInLevel / pointsNeeded) * 100, 0), 100)
      : 100

    const isMaxLevel = clampedLevel >= 6
    const pointsToNext = Math.max(nextThreshold - currentPoints, 0)

    return {
      currentThreshold,
      nextThreshold,
      pointsInLevel: Math.max(pointsInLevel, 0),
      pointsNeeded,
      percentage,
      isMaxLevel,
      pointsToNext,
      currentLevel: clampedLevel,
    }
  }, [currentPoints, levelThresholds, currentLevel])

  // Animate progress bar
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progressInfo.percentage)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayProgress(progressInfo.percentage)
    }
  }, [progressInfo.percentage, animated])

  const levelConfig = LEVEL_CONFIGS[progressInfo.currentLevel]
  const nextLevelConfig = progressInfo.currentLevel < 6
    ? LEVEL_CONFIGS[progressInfo.currentLevel + 1]
    : null

  return (
    <div className={`w-full ${className}`} role="region" aria-label="Level progress">
      <div className="flex items-center gap-3">
        {showBadge && (
          <LevelBadge level={progressInfo.currentLevel} size="md" />
        )}

        <div className="flex-1">
          {/* Level info header */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{ color: levelConfig.color }}>
              {levelConfig.name}
            </span>
            {!progressInfo.isMaxLevel && nextLevelConfig && (
              <span className="text-xs text-gray-500">
                Next: {nextLevelConfig.name}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="h-3 bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progressInfo.percentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(progressInfo.percentage)}% progress to next level`}
          >
            <div
              className={`h-full rounded-full ${animated ? 'transition-all duration-700 ease-out' : ''}`}
              style={{
                width: `${displayProgress}%`,
                background: levelConfig.gradient,
              }}
            />
          </div>

          {/* Points info */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-600">
              {currentPoints.toLocaleString()} pts
            </span>
            {progressInfo.isMaxLevel ? (
              <span className="text-xs font-medium" style={{ color: levelConfig.color }}>
                Max Level Reached!
              </span>
            ) : (
              <span className="text-xs text-gray-500">
                {progressInfo.pointsToNext.toLocaleString()} pts to Level {progressInfo.currentLevel + 1}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Export default thresholds for reference
export { DEFAULT_THRESHOLDS }
