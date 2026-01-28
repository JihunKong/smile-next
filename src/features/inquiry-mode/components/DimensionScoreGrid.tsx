'use client'

import type { DimensionScores } from '../types'
import { getScoreColor, getScoreBgColor } from '../utils'

interface DimensionScoreGridProps {
  scores: DimensionScores
  cols?: 2 | 4
  showIcons?: boolean
  showComplexity?: boolean
}

const DIMENSION_CONFIG = [
  { key: 'creativity' as const, label: 'Creativity', icon: '💡' },
  { key: 'clarity' as const, label: 'Clarity', icon: '📝' },
  { key: 'relevance' as const, label: 'Relevance', icon: '🎯' },
  { key: 'innovation' as const, label: 'Innovation', icon: '🚀' },
  { key: 'complexity' as const, label: 'Complexity', icon: '🧩' },
]

export function DimensionScoreGrid({
  scores,
  cols = 4,
  showIcons = true,
  showComplexity = false,
}: DimensionScoreGridProps) {
  const dimensions = showComplexity
    ? DIMENSION_CONFIG
    : DIMENSION_CONFIG.filter(d => d.key !== 'complexity')

  const gridCols = cols === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {dimensions.map((dim) => {
        const score = scores[dim.key]
        return (
          <div
            key={dim.key}
            className={`rounded-lg p-4 text-center ${getScoreBgColor(score)}`}
          >
            {showIcons && <div className="text-2xl mb-1">{dim.icon}</div>}
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">{dim.label}</div>
          </div>
        )
      })}
    </div>
  )
}
