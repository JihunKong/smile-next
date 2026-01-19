'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { LoadingSpinner } from '@/components/ui'

interface TimelineEvent {
  id: string
  type: 'question' | 'response' | 'exam' | 'inquiry' | 'case' | 'badge' | 'group' | 'certificate'
  title: string
  description: string | null
  timestamp: Date
  icon: string
  color: string
  metadata?: Record<string, unknown>
}

interface GroupedEvents {
  [key: string]: TimelineEvent[]
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  question: 'Questions',
  response: 'Responses',
  exam: 'Exams',
  inquiry: 'Inquiries',
  case: 'Cases',
  badge: 'Badges',
  group: 'Groups',
  certificate: 'Certificates',
}

const EVENT_ICONS: Record<string, { icon: ReactNode; bgColor: string }> = {
  question: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-blue-500',
  },
  response: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    bgColor: 'bg-green-500',
  },
  exam: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    bgColor: 'bg-purple-500',
  },
  inquiry: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    bgColor: 'bg-yellow-500',
  },
  case: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    bgColor: 'bg-orange-500',
  },
  badge: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    bgColor: 'bg-yellow-400',
  },
  group: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    bgColor: 'bg-indigo-500',
  },
  certificate: {
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    bgColor: 'bg-amber-500',
  },
}

export default function ActivityTimelineTab() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchTimeline = useCallback(async (pageNum: number, type: string | null, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      })

      if (type) {
        params.set('type', type)
      }

      const response = await fetch(`/api/user/profile/timeline?${params}`)

      if (response.ok) {
        const data = await response.json()

        if (append) {
          setEvents(prev => [...prev, ...data.events])
        } else {
          setEvents(data.events)
          setGroupedEvents(data.groupedEvents)
        }

        setHasMore(data.pagination.hasMore)
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchTimeline(1, selectedType)
  }, [selectedType, fetchTimeline])

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchTimeline(nextPage, selectedType, true)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity Timeline
        </h3>

        {/* Type Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Filter:</span>
          <select
            value={selectedType || ''}
            onChange={(e) => {
              setSelectedType(e.target.value || null)
              setPage(1)
            }}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8C1515]"
          >
            <option value="">All Activities</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {events.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([dateGroup, groupEvents]) => (
            <div key={dateGroup}>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {dateGroup}
              </h4>

              <div className="space-y-4">
                {groupEvents.map((event) => {
                  const eventConfig = EVENT_ICONS[event.type] || EVENT_ICONS.question

                  return (
                    <div
                      key={event.id}
                      className="flex items-start space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className={`flex-shrink-0 w-10 h-10 ${eventConfig.bgColor} rounded-full flex items-center justify-center`}>
                        {eventConfig.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {event.title}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>

                        {event.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {event.metadata && (
                          <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                            {'activityName' in event.metadata && event.metadata.activityName ? (
                              <span className="bg-gray-100 px-2 py-0.5 rounded">
                                {String(event.metadata.activityName)}
                              </span>
                            ) : null}
                            {'score' in event.metadata && event.metadata.score !== undefined ? (
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Score: {typeof event.metadata.score === 'number' && event.metadata.score < 1
                                  ? `${Math.round(event.metadata.score * 100)}%`
                                  : String(event.metadata.score)}
                              </span>
                            ) : null}
                            {'passed' in event.metadata && event.metadata.passed !== undefined ? (
                              <span className={`px-2 py-0.5 rounded ${event.metadata.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {event.metadata.passed ? 'Passed' : 'Not Passed'}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <LoadingSpinner size="sm" className="-ml-1 mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Load More
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
          <p className="text-gray-500 mb-4">
            {selectedType
              ? `No ${EVENT_TYPE_LABELS[selectedType]} found. Try a different filter.`
              : 'Your activity timeline will appear here as you use SMILE.'}
          </p>
          <a
            href="/groups"
            className="inline-flex items-center px-4 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90"
          >
            Browse Activities
          </a>
        </div>
      )}
    </div>
  )
}
