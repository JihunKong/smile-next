/**
 * ProgressTracker Component
 *
 * Displays certificate completion progress with activity list
 * and status indicators.
 */

'use client'

import Link from 'next/link'
import type { ActivityProgress, CertificateProgress } from '../types'

export interface ProgressTrackerProps {
  /** List of activities with progress */
  activities: ActivityProgress[]
  /** Progress statistics */
  progress: CertificateProgress['progress']
  /** Certificate ID for activity links */
  certificateId?: string
  /** Compact display mode */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Status indicator component
 */
function StatusIndicator({ status }: { status: ActivityProgress['status'] }) {
  const colors = {
    completed: 'bg-green-500',
    in_progress: 'bg-yellow-500',
    not_started: 'bg-gray-300',
  }

  const icons = {
    completed: (
      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    in_progress: (
      <svg className="w-3 h-3 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="4" />
      </svg>
    ),
    not_started: null,
  }

  return (
    <div
      data-testid={`status-${status}`}
      className={`w-6 h-6 rounded-full flex items-center justify-center ${colors[status]}`}
    >
      {icons[status]}
    </div>
  )
}

/**
 * Activity type badge
 */
function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    lesson: 'bg-blue-100 text-blue-800',
    quiz: 'bg-purple-100 text-purple-800',
    project: 'bg-orange-100 text-orange-800',
    exam: 'bg-red-100 text-red-800',
  }

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded ${
        colors[type] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {type}
    </span>
  )
}

export function ProgressTracker({
  activities,
  progress,
  certificateId,
  compact = false,
  className = '',
}: ProgressTrackerProps) {
  const ActivityWrapper = certificateId
    ? ({ activity, children }: { activity: ActivityProgress; children: React.ReactNode }) => (
        <Link
          href={`/certificates/${certificateId}/activities/${activity.activity.id}`}
          className="block hover:bg-gray-50 transition-colors"
        >
          {children}
        </Link>
      )
    : ({ children }: { activity: ActivityProgress; children: React.ReactNode }) => (
        <div>{children}</div>
      )

  return (
    <div className={className}>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {progress.completed} of {progress.total} activities completed
          </span>
          <span className="text-sm font-bold text-[#8C1515]">{progress.percentage}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            data-testid="progress-fill"
            className="h-full bg-gradient-to-r from-[#8C1515] to-[#B83A4B] transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityWrapper key={activity.id} activity={activity}>
            <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              {/* Status Indicator */}
              <div className="flex-shrink-0 pt-0.5">
                <StatusIndicator status={activity.status} />
              </div>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.activity.name}
                  </h4>
                  <TypeBadge type={activity.activity.activityType} />
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      activity.required
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {activity.required ? 'Required' : 'Optional'}
                  </span>
                </div>

                {!compact && activity.activity.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {activity.activity.description}
                  </p>
                )}

                {/* Score (if completed) */}
                {activity.status === 'completed' && activity.score !== undefined && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    Score: {activity.score}%
                  </div>
                )}
              </div>

              {/* Sequence Number */}
              <div className="flex-shrink-0 text-xs text-gray-400">
                #{activity.sequenceOrder}
              </div>
            </div>
          </ActivityWrapper>
        ))}
      </div>
    </div>
  )
}
