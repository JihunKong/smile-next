'use client'

import { Badge } from './BadgeGrid'

export interface FeaturedBadgesProps {
  badges: Badge[]
  maxDisplay?: number // default 3
  editable?: boolean
  onEdit?: () => void
  onBadgeClick?: (badge: Badge) => void
  className?: string
}

const LEVEL_GRADIENTS: Record<string, string> = {
  bronze: 'linear-gradient(135deg, #CD7F32, #B87333)',
  silver: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
  gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
  platinum: 'linear-gradient(135deg, #E5E4E2, #C9C9C9)',
}

// Helper to check if icon is an emoji
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

export default function FeaturedBadges({
  badges,
  maxDisplay = 3,
  editable = false,
  onEdit,
  onBadgeClick,
  className = '',
}: FeaturedBadgesProps) {
  const displayBadges = badges.slice(0, maxDisplay)
  const emptySlots = Math.max(0, maxDisplay - displayBadges.length)

  return (
    <div
      className={`flex gap-4 p-4 rounded-lg items-center ${className}`}
      style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}
      role="region"
      aria-label="Featured badges"
    >
      {/* Featured badges */}
      <div className="flex gap-3 flex-1">
        {displayBadges.map((badge) => {
          const gradient = badge.color
            || (badge.level && LEVEL_GRADIENTS[badge.level])
            || 'linear-gradient(135deg, #8C1515, #6B1010)'

          return (
            <div
              key={badge.id}
              className="relative group"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg cursor-pointer transition-transform hover:scale-110"
                style={{ background: gradient }}
                onClick={() => onBadgeClick?.(badge)}
                role="button"
                aria-label={`View ${badge.name} badge details`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onBadgeClick?.(badge)
                  }
                }}
              >
                {isEmoji(badge.icon) ? (
                  <span>{badge.icon}</span>
                ) : (
                  <i className={getFontAwesomeClass(badge.icon)} aria-hidden="true" />
                )}
              </div>

              {/* Tooltip on hover */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {badge.name}
              </div>
            </div>
          )
        })}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-500"
            role="presentation"
          >
            <i className="fas fa-plus" aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* Label and edit button */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-medium text-gray-700">
          Featured Badges
        </span>
        {editable && (
          <button
            onClick={onEdit}
            className="text-xs text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 transition-colors"
            aria-label="Edit featured badges"
          >
            <i className="fas fa-pen" aria-hidden="true" />
            Edit
          </button>
        )}
      </div>
    </div>
  )
}
