'use client'

import Link from 'next/link'

/**
 * Props for the CaseModeContent component
 */
export interface CaseModeContentProps {
    activityId: string
    numCases: number
    totalTimeLimit: number
    maxAttempts: number
    passThreshold: number
    isPublished: boolean
    className?: string
}

/**
 * CaseModeContent Component
 * 
 * Displays Case mode activity content including:
 * - Case settings (number of cases, time limit, attempts, pass threshold)
 * - Published status badge
 * - Start Case Study action (when published)
 * - Leaderboard link
 */
export function CaseModeContent({
    activityId,
    numCases,
    totalTimeLimit,
    maxAttempts,
    passThreshold,
    isPublished,
    className = ''
}: CaseModeContentProps) {
    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            {/* Header with status */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <i className="fas fa-briefcase text-green-500"></i>
                    Case Study Mode
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {isPublished ? 'Published' : 'Draft'}
                </span>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{numCases}</p>
                    <p className="text-xs text-gray-600">Cases</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{totalTimeLimit}</p>
                    <p className="text-xs text-gray-600">Minutes</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{maxAttempts}</p>
                    <p className="text-xs text-gray-600">Attempts</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{passThreshold.toFixed(1)}</p>
                    <p className="text-xs text-gray-600">Min Score</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {isPublished && (
                    <Link
                        href={`/activities/${activityId}/case`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                    >
                        <i className="fas fa-play"></i>
                        Start Case Study
                    </Link>
                )}
                <Link
                    href={`/activities/${activityId}/leaderboard`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
                >
                    <i className="fas fa-trophy"></i>
                    View Leaderboard
                </Link>
            </div>
        </div>
    )
}
