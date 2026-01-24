'use client'

import Link from 'next/link'
import { ActivityModes, type ActivityMode } from '@/types/activities'

/**
 * Props for the ActivityActions component
 */
export interface ActivityActionsProps {
    activityId: string
    mode: ActivityMode
    isManager: boolean
    className?: string
}

/**
 * ActivityActions Component
 * 
 * Displays action buttons for an activity:
 * - Leaderboard (always visible)
 * - Edit Activity (manager only)
 * - Mode-specific start actions (Ask Question, Take Exam, Start Inquiry, Start Case Study)
 */
export function ActivityActions({
    activityId,
    mode,
    isManager,
    className = ''
}: ActivityActionsProps) {
    return (
        <div className={`flex flex-wrap items-center gap-3 ${className}`}>
            {/* Leaderboard - Always visible */}
            <Link
                href={`/activities/${activityId}/leaderboard`}
                className="inline-flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: 'var(--stanford-pine)' }}
            >
                <i className="fas fa-trophy"></i>
                Leaderboard
            </Link>

            {/* Edit Activity - Manager only */}
            {isManager && (
                <Link
                    href={`/activities/${activityId}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition"
                    style={{ backgroundColor: 'var(--stanford-cardinal)' }}
                >
                    <i className="fas fa-edit"></i>
                    Edit Activity
                </Link>
            )}

            {/* Mode-specific start actions */}
            {mode === ActivityModes.OPEN && (
                <Link
                    href={`/activities/${activityId}/questions/create`}
                    data-testid="ask-question"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                >
                    <i className="fas fa-plus"></i>
                    Ask a Question
                </Link>
            )}

            {mode === ActivityModes.EXAM && (
                <Link
                    href={`/activities/${activityId}/exam`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                    <i className="fas fa-clipboard-check"></i>
                    Take Exam
                </Link>
            )}

            {mode === ActivityModes.INQUIRY && (
                <Link
                    href={`/activities/${activityId}/inquiry`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
                >
                    <i className="fas fa-lightbulb"></i>
                    Start Inquiry
                </Link>
            )}

            {mode === ActivityModes.CASE && (
                <Link
                    href={`/activities/${activityId}/case`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                >
                    <i className="fas fa-briefcase"></i>
                    Start Case Study
                </Link>
            )}
        </div>
    )
}
