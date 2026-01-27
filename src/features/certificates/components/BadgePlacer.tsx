/**
 * BadgePlacer Component
 *
 * Allows placing and positioning badges on a certificate design.
 * Includes badge type selection, positioning, and sizing controls.
 */

'use client'

import { useState } from 'react'
import type { CertificateBadge } from '../types'

export interface BadgeType {
  type: string
  label: string
  icon: string
}

export interface BadgePlacerProps {
  /** Currently placed badges */
  badges: CertificateBadge[]
  /** Available badge types to add */
  availableBadgeTypes: BadgeType[]
  /** Called when a new badge is added */
  onAddBadge: (badge: Omit<CertificateBadge, 'id'>) => void
  /** Called when a badge is removed */
  onRemoveBadge: (badgeId: string) => void
  /** Called when badge position changes */
  onUpdatePosition: (badgeId: string, x: number, y: number) => void
  /** Called when badge size changes */
  onUpdateSize: (badgeId: string, width: number, height: number) => void
  /** Called when a badge is selected */
  onSelectBadge?: (badgeId: string) => void
  /** Currently selected badge ID */
  selectedBadgeId?: string
  /** Additional CSS classes */
  className?: string
}

const DEFAULT_BADGE_SIZE = 64
const DEFAULT_POSITION = { x: 50, y: 50 }

export function BadgePlacer({
  badges,
  availableBadgeTypes,
  onAddBadge,
  onRemoveBadge,
  onUpdatePosition,
  onUpdateSize,
  onSelectBadge,
  selectedBadgeId,
  className = '',
}: BadgePlacerProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const selectedBadge = badges.find((b) => b.id === selectedBadgeId)

  const handleAddBadge = (badgeType: BadgeType) => {
    onAddBadge({
      badgeType: badgeType.type,
      positionX: DEFAULT_POSITION.x,
      positionY: DEFAULT_POSITION.y,
      width: DEFAULT_BADGE_SIZE,
      height: DEFAULT_BADGE_SIZE,
    })
    setIsDropdownOpen(false)
  }

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    if (!selectedBadge) return
    const numValue = parseInt(value, 10) || 0
    if (axis === 'x') {
      onUpdatePosition(selectedBadge.id, numValue, selectedBadge.positionY)
    } else {
      onUpdatePosition(selectedBadge.id, selectedBadge.positionX, numValue)
    }
  }

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    if (!selectedBadge) return
    const numValue = parseInt(value, 10) || DEFAULT_BADGE_SIZE
    if (dimension === 'width') {
      onUpdateSize(selectedBadge.id, numValue, selectedBadge.height)
    } else {
      onUpdateSize(selectedBadge.id, selectedBadge.width, numValue)
    }
  }

  const getBadgeLabel = (badgeType: string) => {
    const found = availableBadgeTypes.find((bt) => bt.type === badgeType)
    return found?.label || badgeType
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Badges</h3>
          <p className="text-xs text-gray-500">
            {badges.length} badge{badges.length !== 1 ? 's' : ''} added
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Badge
          </button>

          {/* Badge Type Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {availableBadgeTypes.map((badgeType) => (
                <button
                  key={badgeType.type}
                  type="button"
                  onClick={() => handleAddBadge(badgeType)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-lg">{badgeType.icon}</span>
                  <span className="text-sm text-gray-700">{badgeType.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Badge List */}
      {badges.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <p className="text-sm text-gray-500">No badges added</p>
          <p className="text-xs text-gray-400 mt-1">Click &quot;Add Badge&quot; to place badges</p>
        </div>
      ) : (
        <div className="space-y-2">
          {badges.map((badge) => {
            const isSelected = badge.id === selectedBadgeId
            return (
              <div
                key={badge.id}
                data-testid={`badge-item-${badge.id}`}
                className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition ${
                  isSelected ? 'ring-2 ring-[#8C1515] border-[#8C1515]' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Badge Icon/Type */}
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">
                    {availableBadgeTypes.find((bt) => bt.type === badge.badgeType)?.icon || '🏅'}
                  </span>
                </div>

                {/* Badge Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getBadgeLabel(badge.badgeType)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {badge.width}×{badge.height}px at ({badge.positionX}, {badge.positionY})
                  </p>
                </div>

                {/* Select Button */}
                {onSelectBadge && (
                  <button
                    type="button"
                    onClick={() => onSelectBadge(badge.id)}
                    aria-label={`Select ${getBadgeLabel(badge.badgeType)}`}
                    className="p-1.5 text-gray-400 hover:text-[#8C1515] transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => onRemoveBadge(badge.id)}
                  aria-label={`Remove ${getBadgeLabel(badge.badgeType)}`}
                  className="p-1.5 text-red-400 hover:text-red-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Position & Size Controls (when badge selected) */}
      {selectedBadge && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Edit: {getBadgeLabel(selectedBadge.badgeType)}
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Position X */}
            <div>
              <label htmlFor="positionX" className="block text-xs text-gray-500 mb-1">
                X Position
              </label>
              <input
                type="number"
                id="positionX"
                aria-label="X Position"
                value={selectedBadge.positionX}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#8C1515] focus:border-[#8C1515] outline-none"
              />
            </div>

            {/* Position Y */}
            <div>
              <label htmlFor="positionY" className="block text-xs text-gray-500 mb-1">
                Y Position
              </label>
              <input
                type="number"
                id="positionY"
                aria-label="Y Position"
                value={selectedBadge.positionY}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#8C1515] focus:border-[#8C1515] outline-none"
              />
            </div>

            {/* Width */}
            <div>
              <label htmlFor="width" className="block text-xs text-gray-500 mb-1">
                Width
              </label>
              <input
                type="number"
                id="width"
                aria-label="Width"
                value={selectedBadge.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#8C1515] focus:border-[#8C1515] outline-none"
              />
            </div>

            {/* Height */}
            <div>
              <label htmlFor="height" className="block text-xs text-gray-500 mb-1">
                Height
              </label>
              <input
                type="number"
                id="height"
                aria-label="Height"
                value={selectedBadge.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#8C1515] focus:border-[#8C1515] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {isDropdownOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsDropdownOpen(false)} />
      )}
    </div>
  )
}
