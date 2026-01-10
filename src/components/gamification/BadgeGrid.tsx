'use client'

import { useMemo } from 'react'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string // emoji or Font Awesome icon name (e.g., 'fa-star' or 'star')
  category: string
  earnedAt?: Date
  isEarned: boolean
  color?: string
  level?: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface BadgeGridProps {
  badges: Badge[]
  onBadgeClick?: (badge: Badge) => void
  showLocked?: boolean
  columns?: 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LEVEL_GRADIENTS: Record<string, string> = {
  bronze: 'linear-gradient(135deg, #CD7F32, #B87333)',
  silver: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
  gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
  platinum: 'linear-gradient(135deg, #E5E4E2, #C9C9C9)',
}

const COLUMN_CLASSES = {
  3: 'grid-cols-3',
  4: 'grid-cols-4 sm:grid-cols-4',
  5: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
}

const SIZE_CLASSES = {
  sm: {
    badge: 'w-12 h-12',
    icon: 'text-lg',
    name: 'text-xs',
  },
  md: {
    badge: 'w-16 h-16',
    icon: 'text-2xl',
    name: 'text-xs',
  },
  lg: {
    badge: 'w-20 h-20',
    icon: 'text-3xl',
    name: 'text-sm',
  },
}

// Helper to check if icon is an emoji or Font Awesome
function isEmoji(str: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
  return emojiRegex.test(str)
}

// Helper to get full Font Awesome class
function getFontAwesomeClass(icon: string): string {
  if (icon.startsWith('fa-')) {
    return `fas ${icon}`
  }
  if (icon.startsWith('fas ') || icon.startsWith('far ') || icon.startsWith('fab ')) {
    return icon
  }
  return `fas fa-${icon}`
}

export default function BadgeGrid({
  badges,
  onBadgeClick,
  showLocked = true,
  columns = 4,
  size = 'md',
  className = '',
}: BadgeGridProps) {
  const filteredBadges = useMemo(() => {
    return showLocked ? badges : badges.filter((b) => b.isEarned)
  }, [badges, showLocked])

  const sizeClasses = SIZE_CLASSES[size]
  const columnClass = COLUMN_CLASSES[columns]

  if (filteredBadges.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-300 text-4xl mb-2">
          <i className="fas fa-award" aria-hidden="true" />
        </div>
        <p className="text-gray-500 text-sm">No badges to display</p>
      </div>
    )
  }

  return (
    <div
      className={`grid ${columnClass} gap-4 ${className}`}
      role="list"
      aria-label="Badge collection"
    >
      {filteredBadges.map((badge) => {
        const gradient = badge.color
          || (badge.level && LEVEL_GRADIENTS[badge.level])
          || 'linear-gradient(135deg, #8C1515, #6B1010)'

        const isNew = badge.earnedAt && new Date(badge.earnedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)

        return (
          <div
            key={badge.id}
            className={`relative text-center cursor-pointer transition-transform hover:scale-110 ${
              !badge.isEarned ? 'opacity-50 grayscale' : ''
            } ${isNew ? 'animate-pulse' : ''}`}
            onClick={() => onBadgeClick?.(badge)}
            role="listitem"
            aria-label={`${badge.name}${badge.isEarned ? ' - Earned' : ' - Locked'}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onBadgeClick?.(badge)
              }
            }}
          >
            {/* Badge circle */}
            <div
              className={`${sizeClasses.badge} mx-auto rounded-full flex items-center justify-center text-white shadow-lg relative`}
              style={{
                background: badge.isEarned ? gradient : '#d1d5db',
              }}
            >
              {/* Icon */}
              {isEmoji(badge.icon) ? (
                <span className={sizeClasses.icon}>{badge.icon}</span>
              ) : (
                <i className={`${getFontAwesomeClass(badge.icon)} ${sizeClasses.icon}`} aria-hidden="true" />
              )}

              {/* Lock overlay for unearned badges */}
              {!badge.isEarned && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30">
                  <i className="fas fa-lock text-white text-sm" aria-hidden="true" />
                </div>
              )}

              {/* New badge indicator */}
              {isNew && badge.isEarned && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>

            {/* Badge name */}
            <div
              className={`mt-2 ${sizeClasses.name} font-medium truncate max-w-[80px] mx-auto ${
                badge.isEarned ? 'text-gray-900' : 'text-gray-400'
              }`}
              title={badge.name}
            >
              {badge.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Export types for use in other components
export type { Badge as BadgeType }
