'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface ActivityEvent {
  id: string
  type: 'question_quality' | 'responses' | 'group_join' | 'badge_earned' | 'exam_pass' | 'certificate' | 'certificate_progress'
  title: string
  subtitle: string | null
  timestamp: Date
  icon: string
  color: string
  badgeProgress: boolean
}

const eventTypeConfig: Record<string, { icon: string; color: string; label: string }> = {
  question_quality: { icon: 'fa-question-circle', color: 'blue', label: 'High Quality Question' },
  responses: { icon: 'fa-comments', color: 'green', label: 'Response Activity' },
  group_join: { icon: 'fa-users', color: 'purple', label: 'Group Join' },
  badge_earned: { icon: 'fa-trophy', color: 'yellow', label: 'Badge' },
  exam_pass: { icon: 'fa-check-circle', color: 'green', label: 'Exam Pass' },
  certificate: { icon: 'fa-certificate', color: 'indigo', label: 'Certificate' },
  certificate_progress: { icon: 'fa-tasks', color: 'teal', label: 'Certificate Progress' },
}

export default function MyEventsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      loadEvents()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  async function loadEvents() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/user/events')
      if (!res.ok) {
        throw new Error('Failed to load events')
      }

      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error('Failed to load events:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-user-clock text-blue-500 mr-3"></i>
                My Activity Events
              </h1>
              <p className="text-gray-600 mt-2">
                Your achievements, badges, certificates, and participation history
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadEvents}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
              <span className="text-sm text-gray-500">{events.length} events</span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {events.length > 0 ? (
              events.map(event => {
                const config = eventTypeConfig[event.type] || {
                  icon: 'fa-circle',
                  color: 'gray',
                  label: 'Activity',
                }
                return (
                  <div
                    key={event.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-12 h-12 bg-${config.color}-100 rounded-full flex items-center justify-center`}
                        >
                          <i
                            className={`fas ${config.icon} text-${config.color}-600 text-lg`}
                          ></i>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-base font-medium text-gray-900">
                              {event.title}
                            </p>
                            {event.subtitle && (
                              <p className="text-sm text-gray-600 mt-1">
                                {event.subtitle}
                              </p>
                            )}
                          </div>
                          {event.badgeProgress && (
                            <span
                              className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}
                            >
                              <i className="fas fa-star mr-1"></i>
                              High Quality
                            </span>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <i className="far fa-clock mr-2"></i>
                          {new Date(event.timestamp).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>

                        {/* Type Badge */}
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <i className={`fas ${config.icon} mr-1`}></i>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              /* Empty state */
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <i className="fas fa-inbox text-6xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Activity Events Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by joining groups, creating questions, or participating in activities!
                </p>
                <div className="flex justify-center space-x-4">
                  <Link
                    href="/groups"
                    className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#4f46e5' }}
                  >
                    <i className="fas fa-users mr-2"></i>
                    Browse Groups
                  </Link>
                  <Link
                    href="/certificates"
                    className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#6366f1' }}
                  >
                    <i className="fas fa-certificate mr-2"></i>
                    Browse Certificates
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
