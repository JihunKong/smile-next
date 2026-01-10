import Link from 'next/link'
import { getModeLabel, getModeBadgeColor, formatRelativeTime } from '@/lib/activities/utils'
import type { ActivityWithGroup } from '@/types/activities'
import type { ActivityMode } from '@/types/activities'

interface ActivityListItemProps {
  activity: ActivityWithGroup
  showGroup?: boolean
}

export function ActivityListItem({ activity, showGroup = true }: ActivityListItemProps) {
  const mode = activity.mode as ActivityMode

  return (
    <Link
      href={`/activities/${activity.id}`}
      className="block bg-white rounded-lg border border-gray-200 px-4 py-3 hover:shadow-md hover:border-gray-300 transition"
    >
      <div className="flex items-center gap-4">
        {/* Left: Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {/* Activity name */}
            <h3 className="font-semibold text-gray-900 truncate">{activity.name}</h3>

            {/* Mode badge */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getModeBadgeColor(mode)}`}>
              {getModeLabel(mode)}
            </span>

            {/* AI Rating indicator */}
            {activity.aiRatingEnabled && (
              <span className="flex items-center gap-1 text-xs text-purple-600 whitespace-nowrap">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI
              </span>
            )}
          </div>

          {/* Description and Group info */}
          <div className="flex items-center gap-4 mt-1">
            {showGroup && (
              <span className="text-xs text-gray-500 truncate">
                {activity.owningGroup.name}
              </span>
            )}
            {activity.description && (
              <span className="text-sm text-gray-600 truncate hidden sm:inline">
                {activity.description.length > 80
                  ? activity.description.substring(0, 80) + '...'
                  : activity.description}
              </span>
            )}
          </div>
        </div>

        {/* Center: Stats */}
        <div className="flex items-center gap-6 text-sm text-gray-500 flex-shrink-0">
          {/* Questions count */}
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{activity._count.questions}</span>
          </div>

          {/* Created time */}
          <div className="hidden md:flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="whitespace-nowrap">{formatRelativeTime(activity.createdAt)}</span>
          </div>
        </div>

        {/* Right: Creator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium">
            {activity.creator.avatarUrl ? (
              <img
                src={activity.creator.avatarUrl}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <>
                {activity.creator.firstName?.[0] || ''}
                {activity.creator.lastName?.[0] || ''}
              </>
            )}
          </div>
          <span className="text-sm text-gray-600 hidden lg:inline max-w-[120px] truncate">
            {activity.creator.firstName} {activity.creator.lastName}
          </span>
        </div>

        {/* Arrow indicator */}
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
