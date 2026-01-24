'use client'

import Link from 'next/link'

/**
 * Props for the ExamModeContent component
 */
export interface ExamModeContentProps {
    activityId: string
    timeLimit: number
    questionsToShow: number
    passThreshold: number
    maxAttempts: number
    isPublished: boolean
    isManager: boolean
    attemptCount?: number
    avgScore?: number
    className?: string
}

/**
 * ExamModeContent Component
 * 
 * Displays Exam mode activity content including:
 * - Exam settings (time, questions, pass threshold, attempts)
 * - Published status badge
 * - Take Exam action (when published)
 * - Analytics link (for managers)
 */
export function ExamModeContent({
    activityId,
    timeLimit,
    questionsToShow,
    passThreshold,
    maxAttempts,
    isPublished,
    isManager,
    attemptCount,
    avgScore,
    className = ''
}: ExamModeContentProps) {
    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            {/* Header with status */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <i className="fas fa-clipboard-check text-red-500"></i>
                    Exam Mode
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {isPublished ? 'Published' : 'Draft'}
                </span>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{timeLimit}</p>
                    <p className="text-xs text-gray-600">Minutes</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{questionsToShow}</p>
                    <p className="text-xs text-gray-600">Questions</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{passThreshold}%</p>
                    <p className="text-xs text-gray-600">Pass Threshold</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{maxAttempts}</p>
                    <p className="text-xs text-gray-600">Max Attempts</p>
                </div>
            </div>

            {/* Manager Stats */}
            {isManager && attemptCount !== undefined && avgScore !== undefined && (
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-700">{attemptCount}</p>
                        <p className="text-xs text-gray-600">Attempts</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-700">{avgScore}%</p>
                        <p className="text-xs text-gray-600">Avg Score</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                {isPublished && (
                    <Link
                        href={`/activities/${activityId}/exam`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                        <i className="fas fa-play"></i>
                        Take Exam
                    </Link>
                )}
                {isManager && (
                    <Link
                        href={`/activities/${activityId}/exam/analytics`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition"
                    >
                        <i className="fas fa-chart-bar"></i>
                        View Analytics
                    </Link>
                )}
            </div>
        </div>
    )
}
