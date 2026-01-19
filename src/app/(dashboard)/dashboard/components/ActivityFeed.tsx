/**
 * ActivityFeed Component
 *
 * Displays the user's recent activity in the dashboard.
 * Shows an empty state when no activities exist.
 *
 * Extracted as part of VIBE-0003E refactoring.
 */

import Link from 'next/link'
import type { ProcessedActivity } from '../types'

interface ActivityFeedProps {
  activities: ProcessedActivity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <i className="fas fa-user-clock text-blue-500 mr-2"></i>Your Activity
        </h2>
        <Link href="/my-events" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <EmptyState />
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-3">🎯 Keep your streak alive!</div>
          <Link
            href="/activities"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <i className="fas fa-plus mr-2"></i>Ask Today&apos;s Question
          </Link>
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: ProcessedActivity }) {
  return (
    <div
      className={`flex items-start space-x-3 p-3 bg-${activity.color}-50 rounded-lg hover:bg-${activity.color}-100 transition-colors`}
    >
      <div className={`text-${activity.color}-600 mt-1`}>
        <i className={`fas ${activity.icon}`}></i>
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-900">{activity.title}</div>
        <div className="text-xs text-gray-500 mt-1">
          {new Date(activity.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          {activity.subtitle && ` • ${activity.subtitle}`}
          {activity.badge_progress && (
            <span className={`text-${activity.color}-600`}> • High Quality!</span>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="text-gray-400 mb-3">
        <i className="fas fa-inbox text-4xl"></i>
      </div>
      <p className="text-gray-600 text-sm">No recent activity</p>
      <p className="text-gray-500 text-xs mt-1">Start by joining a group or creating questions!</p>
    </div>
  )
}
