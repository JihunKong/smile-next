'use client'

import { useMemo } from 'react'

export interface RankingCardProps {
  rank: number
  totalUsers: number
  percentile?: number
  label?: string // "Global Rank" or group name
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Get ordinal suffix for a number
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

// Get rank tier styling
function getRankTier(rank: number): {
  icon: string
  color: string
  bgColor: string
  gradient: string
  glow: string
} {
  if (rank === 1) {
    return {
      icon: 'fa-crown',
      color: '#ca8a04', // yellow-600
      bgColor: '#fef9c3', // yellow-100
      gradient: 'linear-gradient(135deg, #fde047, #eab308)',
      glow: '0 0 20px rgba(234, 179, 8, 0.5)',
    }
  }
  if (rank === 2) {
    return {
      icon: 'fa-medal',
      color: '#6b7280', // gray-500
      bgColor: '#f3f4f6', // gray-100
      gradient: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
      glow: '0 0 15px rgba(156, 163, 175, 0.5)',
    }
  }
  if (rank === 3) {
    return {
      icon: 'fa-medal',
      color: '#b45309', // amber-700
      bgColor: '#fef3c7', // amber-100
      gradient: 'linear-gradient(135deg, #fbbf24, #b45309)',
      glow: '0 0 15px rgba(180, 83, 9, 0.5)',
    }
  }
  if (rank <= 10) {
    return {
      icon: 'fa-star',
      color: '#8C1515', // Stanford Cardinal
      bgColor: '#fee2e2', // red-100
      gradient: 'linear-gradient(135deg, #B91E1E, #8C1515)',
      glow: '0 0 10px rgba(140, 21, 21, 0.3)',
    }
  }
  return {
    icon: 'fa-trophy',
    color: '#6b7280', // gray-500
    bgColor: '#f3f4f6', // gray-100
    gradient: 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
    glow: 'none',
  }
}

const SIZE_CLASSES = {
  sm: {
    container: 'p-3',
    rankNum: 'text-2xl',
    icon: 'text-lg',
    label: 'text-xs',
    stats: 'text-xs',
  },
  md: {
    container: 'p-4',
    rankNum: 'text-3xl',
    icon: 'text-xl',
    label: 'text-sm',
    stats: 'text-sm',
  },
  lg: {
    container: 'p-6',
    rankNum: 'text-4xl',
    icon: 'text-2xl',
    label: 'text-base',
    stats: 'text-base',
  },
}

export default function RankingCard({
  rank,
  totalUsers,
  percentile,
  label = 'Global Rank',
  size = 'md',
  className = '',
}: RankingCardProps) {
  const rankTier = useMemo(() => getRankTier(rank), [rank])
  const sizeClasses = SIZE_CLASSES[size]

  const ordinalSuffix = getOrdinalSuffix(rank)
  const calculatedPercentile = percentile ?? Math.round((1 - (rank - 1) / totalUsers) * 100)

  return (
    <div
      className={`bg-white rounded-xl shadow-md border overflow-hidden transition-transform hover:scale-[1.02] ${sizeClasses.container} ${className}`}
      style={{ borderColor: rankTier.color + '40' }}
      role="region"
      aria-label={`${label}: Rank ${rank} of ${totalUsers}`}
    >
      <div className="flex items-center gap-4">
        {/* Rank icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0"
          style={{
            background: rankTier.gradient,
            boxShadow: rankTier.glow,
          }}
        >
          <i className={`fas ${rankTier.icon} ${sizeClasses.icon}`} aria-hidden="true" />
        </div>

        {/* Rank info */}
        <div className="flex-1 min-w-0">
          <div className={`${sizeClasses.label} text-gray-500 mb-0.5`}>
            {label}
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`${sizeClasses.rankNum} font-bold`}
              style={{ color: rankTier.color }}
            >
              #{rank}
            </span>
            <span className={`${sizeClasses.stats} font-medium`} style={{ color: rankTier.color }}>
              {ordinalSuffix}
            </span>
          </div>
          <div className={`${sizeClasses.stats} text-gray-500`}>
            of {totalUsers.toLocaleString()} users
          </div>
        </div>

        {/* Percentile */}
        {calculatedPercentile > 0 && (
          <div
            className="text-right shrink-0 px-3 py-2 rounded-lg"
            style={{ backgroundColor: rankTier.bgColor }}
          >
            <div
              className={`${sizeClasses.rankNum} font-bold`}
              style={{ color: rankTier.color }}
            >
              {calculatedPercentile}%
            </div>
            <div className={`${sizeClasses.label} text-gray-500`}>
              Top
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export helper functions for use elsewhere
export { getOrdinalSuffix, getRankTier }
