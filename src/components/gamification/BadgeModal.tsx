'use client'

import { useEffect, useCallback } from 'react'
import { Badge } from './BadgeGrid'

export interface BadgeModalProps {
  badge: Badge | null
  isOpen: boolean
  onClose: () => void
  progress?: {
    current: number
    total: number
  }
}

const LEVEL_GRADIENTS: Record<string, string> = {
  bronze: 'linear-gradient(135deg, #CD7F32, #B87333)',
  silver: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
  gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
  platinum: 'linear-gradient(135deg, #E5E4E2, #C9C9C9)',
}

const CATEGORY_STYLES: Record<string, { bgColor: string; textColor: string }> = {
  participation: { bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  milestone: { bgColor: 'bg-green-100', textColor: 'text-green-800' },
  quality: { bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  special: { bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  default: { bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
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

export default function BadgeModal({
  badge,
  isOpen,
  onClose,
  progress,
}: BadgeModalProps) {
  // Handle escape key
  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscapeKey])

  if (!isOpen || !badge) {
    return null
  }

  const gradient = badge.color
    || (badge.level && LEVEL_GRADIENTS[badge.level])
    || 'linear-gradient(135deg, #8C1515, #6B1010)'

  const categoryStyle = CATEGORY_STYLES[badge.category.toLowerCase()] || CATEGORY_STYLES.default
  const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient background */}
        <div
          className="p-8 text-center"
          style={{
            background: badge.isEarned
              ? gradient
              : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
          }}
        >
          {/* Badge icon */}
          <div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white text-5xl shadow-lg mb-4 ${
              !badge.isEarned ? 'opacity-50 grayscale' : ''
            }`}
            style={{
              background: badge.isEarned ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            }}
          >
            {!badge.isEarned && (
              <div className="absolute">
                <i className="fas fa-lock text-3xl" aria-hidden="true" />
              </div>
            )}
            {badge.isEarned && (
              isEmoji(badge.icon) ? (
                <span>{badge.icon}</span>
              ) : (
                <i className={getFontAwesomeClass(badge.icon)} aria-hidden="true" />
              )
            )}
          </div>

          {/* Badge name */}
          <h3
            id="badge-modal-title"
            className={`text-2xl font-bold ${badge.isEarned ? 'text-white' : 'text-gray-600'}`}
          >
            {badge.name}
          </h3>

          {/* Level indicator */}
          {badge.level && (
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium text-white uppercase">
              {badge.level}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <p className="text-gray-600 text-center mb-4">{badge.description}</p>

          {/* Category tag */}
          <div className="flex justify-center gap-2 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${categoryStyle.bgColor} ${categoryStyle.textColor}`}
            >
              {badge.category}
            </span>
          </div>

          {/* Earned status */}
          {badge.isEarned && badge.earnedAt && (
            <div className="text-center text-green-600 font-medium mb-4">
              <i className="fas fa-check-circle mr-2" aria-hidden="true" />
              Earned on {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}

          {/* Progress bar for locked badges */}
          {!badge.isEarned && progress && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                    background: gradient,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {progressPercentage}% complete
              </p>
            </div>
          )}

          {/* Not earned message */}
          {!badge.isEarned && !progress && (
            <div className="text-center text-gray-500 mb-4">
              <i className="fas fa-lock mr-2" aria-hidden="true" />
              Complete the requirements to unlock this badge
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#8C1515] text-white rounded-lg hover:bg-[#B91E1E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8C1515] focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
