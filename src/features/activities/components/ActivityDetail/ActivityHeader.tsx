'use client'

import { getModeLabel, getModeBadgeColor } from '@/lib/activities/utils'
import { type ActivityMode } from '@/types/activities'

/**
 * Props for the ActivityHeader component
 */
export interface ActivityHeaderProps {
    activity: {
        id: string
        name: string
        description: string | null
        mode: ActivityMode
        createdAt: Date
        aiRatingEnabled: boolean
        creator: {
            id: string
            firstName: string | null
            lastName: string | null
            avatarUrl: string | null
        }
        owningGroup: {
            id: string
            name: string
        }
        _count: {
            questions: number
        }
    }
}

/**
 * ActivityHeader Component
 * 
 * Displays activity title, mode badge, description, metadata, and creator info.
 * Designed to be used in the activity detail page header section.
 */
export function ActivityHeader({ activity }: ActivityHeaderProps) {
    const mode = activity.mode
    const questionCount = activity._count.questions
    const questionLabel = questionCount === 1 ? 'question' : 'questions'

    // Creator initials for avatar fallback
    const creatorInitials =
        (activity.creator.firstName?.[0] || '') +
        (activity.creator.lastName?.[0] || '')

    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
                {/* Title and Mode Badge */}
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{activity.name}</h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getModeBadgeColor(mode)}`}>
                        {getModeLabel(mode)}
                    </span>
                </div>

                {/* Description */}
                {activity.description && (
                    <p className="text-white/80 max-w-2xl">{activity.description}</p>
                )}

                {/* Metadata Row */}
                <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
                    {/* Question Count */}
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {questionCount} {questionLabel}
                    </span>

                    {/* AI Rating Indicator */}
                    {activity.aiRatingEnabled && (
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Rating Enabled
                        </span>
                    )}

                    {/* Group Name */}
                    <span>{activity.owningGroup.name}</span>
                </div>
            </div>

            {/* Creator Avatar and Info */}
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium">
                    {activity.creator.avatarUrl ? (
                        <img
                            src={activity.creator.avatarUrl}
                            alt={`${activity.creator.firstName} ${activity.creator.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <>{creatorInitials}</>
                    )}
                </div>
                <div className="text-sm">
                    <p className="font-medium">
                        {activity.creator.firstName} {activity.creator.lastName}
                    </p>
                    <p className="text-white/70">Creator</p>
                </div>
            </div>
        </div>
    )
}
