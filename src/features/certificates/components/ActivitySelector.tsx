/**
 * ActivitySelector Component
 *
 * Allows searching and selecting activities for a certificate.
 * Supports reordering and required toggle.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Activity, SelectedActivity } from '../types'

export interface ActivitySelectorProps {
  /** Currently selected activities */
  selectedActivities: SelectedActivity[]
  /** Called when an activity is added */
  onAdd: (activity: Omit<SelectedActivity, 'sequenceOrder'>) => void
  /** Called when an activity is removed */
  onRemove: (activityId: string) => void
  /** Called when activities are reordered */
  onReorder?: (fromIndex: number, toIndex: number) => void
  /** Called when required status is toggled */
  onToggleRequired?: (activityId: string, required: boolean) => void
  /** Search API endpoint */
  searchEndpoint?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Debounce utility
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Activity type badge colors
 */
const TYPE_COLORS: Record<string, string> = {
  lesson: 'bg-blue-100 text-blue-800',
  quiz: 'bg-purple-100 text-purple-800',
  project: 'bg-orange-100 text-orange-800',
  exam: 'bg-red-100 text-red-800',
}

export function ActivitySelector({
  selectedActivities,
  onAdd,
  onRemove,
  onReorder,
  onToggleRequired,
  searchEndpoint = '/api/activities/search',
  className = '',
}: ActivitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const debouncedQuery = useDebounce(searchQuery, 300)

  // Search for activities
  const searchActivities = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${searchEndpoint}?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to search activities:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }, [searchEndpoint])

  // Run search when debounced query changes
  useEffect(() => {
    searchActivities(debouncedQuery)
  }, [debouncedQuery, searchActivities])

  // Filter out already selected activities
  const filteredResults = searchResults.filter(
    (activity) => !selectedActivities.some((sa) => sa.activityId === activity.id)
  )

  // Handle adding an activity
  const handleAdd = (activity: Activity) => {
    onAdd({
      activityId: activity.id,
      name: activity.name,
      activityType: activity.activityType,
      required: true,
    })
    setSearchQuery('')
    setSearchResults([])
    setIsOpen(false)
  }

  // Handle reordering
  const handleMoveUp = (index: number) => {
    if (index > 0 && onReorder) {
      onReorder(index, index - 1)
    }
  }

  const handleMoveDown = (index: number) => {
    if (index < selectedActivities.length - 1 && onReorder) {
      onReorder(index, index + 1)
    }
  }

  // Handle required toggle
  const handleToggleRequired = (activityId: string, currentRequired: boolean) => {
    onToggleRequired?.(activityId, !currentRequired)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search and Add Activities
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search activities by name..."
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoading ? (
              <svg
                data-testid="search-loading"
                className="animate-spin h-5 w-5 text-gray-400"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isOpen && searchQuery && filteredResults.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {filteredResults.map((activity) => (
              <button
                key={activity.id}
                type="button"
                aria-label={`Add ${activity.name}`}
                onClick={() => handleAdd(activity)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-start gap-3"
              >
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    TYPE_COLORS[activity.activityType] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {activity.activityType}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{activity.name}</p>
                  {activity.owningGroup && (
                    <p className="text-sm text-gray-500 truncate">{activity.owningGroup.name}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {isOpen && searchQuery && !isLoading && filteredResults.length === 0 && searchResults.length === 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            No activities found matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* Selected Activities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selected Activities ({selectedActivities.length})
        </label>

        {selectedActivities.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <svg
              className="w-12 h-12 mx-auto text-gray-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-500 font-medium">No activities added</p>
            <p className="text-sm text-gray-400 mt-1">Search and add activities above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedActivities.map((activity, index) => (
              <div
                key={activity.activityId}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
              >
                {/* Order Number */}
                <div className="w-7 h-7 bg-[#8C1515] text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {index + 1}
                </div>

                {/* Type Badge */}
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
                    TYPE_COLORS[activity.activityType] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {activity.activityType}
                </span>

                {/* Activity Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{activity.name}</p>
                </div>

                {/* Required Toggle */}
                {onToggleRequired && (
                  <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={activity.required}
                      onChange={() => handleToggleRequired(activity.activityId, activity.required)}
                      className="rounded border-gray-300 text-[#8C1515] focus:ring-[#8C1515] h-4 w-4"
                    />
                    <span className="text-xs text-gray-600">Required</span>
                  </label>
                )}

                {/* Reorder Buttons */}
                {onReorder && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === selectedActivities.length - 1}
                      aria-label="Move down"
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => onRemove(activity.activityId)}
                  aria-label="Remove activity"
                  className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
