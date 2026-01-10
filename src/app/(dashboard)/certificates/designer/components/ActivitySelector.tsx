'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'

interface Activity {
  id: string
  name: string
  activityType: string
  mode: number
  owningGroup: {
    id: string
    name: string
  } | null
  _count: {
    questions: number
  }
}

interface SelectedActivity {
  activityId: string
  name: string
  activityType: string
  mode: number
  sequenceOrder: number
  required: boolean
  groupName?: string
}

interface ActivitySelectorProps {
  selectedActivities: SelectedActivity[]
  onActivitiesChange: (activities: SelectedActivity[]) => void
}

// Activity mode icons
const MODE_ICONS: Record<number, { icon: ReactNode; label: string; color: string }> = {
  0: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    label: 'Open',
    color: 'text-green-600 bg-green-100',
  },
  1: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Exam',
    color: 'text-blue-600 bg-blue-100',
  },
  2: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Inquiry',
    color: 'text-purple-600 bg-purple-100',
  },
  3: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    label: 'Case',
    color: 'text-amber-600 bg-amber-100',
  },
}

function debounce(fn: (query: string) => void | Promise<void>, delay: number): (query: string) => void {
  let timeoutId: NodeJS.Timeout
  return (query: string) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(query), delay)
  }
}

export default function ActivitySelector({
  selectedActivities,
  onActivitiesChange,
}: ActivitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Search activities with debounce
  const searchActivities = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/activities/search?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.activities || [])
      }
    } catch (error) {
      console.error('Failed to search activities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => searchActivities(query), 300),
    [searchActivities]
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const addActivity = (activity: Activity) => {
    if (selectedActivities.some((a) => a.activityId === activity.id)) {
      return
    }

    const newActivity: SelectedActivity = {
      activityId: activity.id,
      name: activity.name,
      activityType: activity.activityType,
      mode: activity.mode,
      sequenceOrder: selectedActivities.length,
      required: true,
      groupName: activity.owningGroup?.name,
    }

    onActivitiesChange([...selectedActivities, newActivity])
    setSearchQuery('')
    setSearchResults([])
    setIsDropdownOpen(false)
  }

  const removeActivity = (activityId: string) => {
    const updated = selectedActivities
      .filter((a) => a.activityId !== activityId)
      .map((a, idx) => ({ ...a, sequenceOrder: idx }))
    onActivitiesChange(updated)
  }

  const toggleRequired = (activityId: string) => {
    const updated = selectedActivities.map((a) =>
      a.activityId === activityId ? { ...a, required: !a.required } : a
    )
    onActivitiesChange(updated)
  }

  const moveActivity = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= selectedActivities.length) return

    const newActivities = [...selectedActivities]
    const temp = newActivities[index]
    newActivities[index] = newActivities[newIndex]
    newActivities[newIndex] = temp

    onActivitiesChange(newActivities.map((a, idx) => ({ ...a, sequenceOrder: idx })))
  }

  const filteredResults = searchResults.filter(
    (a) => !selectedActivities.some((sa) => sa.activityId === a.id)
  )

  return (
    <div className="space-y-4">
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
              setIsDropdownOpen(true)
            }}
            onFocus={() => setIsDropdownOpen(true)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition"
            placeholder="Search activities by name or topic..."
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isDropdownOpen && searchQuery && filteredResults.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {filteredResults.map((activity) => {
              const modeInfo = MODE_ICONS[activity.mode] || MODE_ICONS[0]
              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => addActivity(activity)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-start gap-3"
                >
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${modeInfo.color}`}>
                    {modeInfo.icon}
                    <span className="ml-1">{modeInfo.label}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{activity.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.owningGroup?.name || 'No group'} - {activity._count.questions} questions
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* No Results */}
        {isDropdownOpen && searchQuery && !isLoading && filteredResults.length === 0 && searchResults.length === 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            No activities found matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {/* Selected Activities List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selected Activities ({selectedActivities.length})
        </label>

        {selectedActivities.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 font-medium">No activities added</p>
            <p className="text-sm text-gray-400 mt-1">Search and add activities above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedActivities.map((activity, index) => {
              const modeInfo = MODE_ICONS[activity.mode] || MODE_ICONS[0]
              return (
                <div
                  key={activity.activityId}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition"
                >
                  {/* Order Number */}
                  <div className="w-7 h-7 bg-[#8C1515] text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* Mode Badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${modeInfo.color}`}>
                    {modeInfo.icon}
                  </span>

                  {/* Activity Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{activity.name}</p>
                    {activity.groupName && (
                      <p className="text-xs text-gray-500 truncate">{activity.groupName}</p>
                    )}
                  </div>

                  {/* Required Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={activity.required}
                      onChange={() => toggleRequired(activity.activityId)}
                      className="rounded border-gray-300 text-[#8C1515] focus:ring-[#8C1515] h-4 w-4"
                    />
                    <span className="text-xs text-gray-600">Required</span>
                  </label>

                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveActivity(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveActivity(index, 'down')}
                      disabled={index === selectedActivities.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeActivity(activity.activityId)}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                    title="Remove activity"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}
