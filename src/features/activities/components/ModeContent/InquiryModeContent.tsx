'use client'

import Link from 'next/link'

/**
 * Props for the InquiryModeContent component
 */
export interface InquiryModeContentProps {
    activityId: string
    questionsRequired: number
    timePerQuestion: number // in seconds
    passThreshold: number
    keywordCount1: number
    keywordCount2: number
    isPublished: boolean
    className?: string
}

/**
 * InquiryModeContent Component
 * 
 * Displays Inquiry mode activity content including:
 * - Inquiry settings (questions required, time per question, pass threshold)
 * - Keyword pool counts
 * - Start Inquiry action (when published)
 * - Leaderboard link
 */
export function InquiryModeContent({
    activityId,
    questionsRequired,
    timePerQuestion,
    passThreshold,
    keywordCount1,
    keywordCount2,
    isPublished,
    className = ''
}: InquiryModeContentProps) {
    // Convert seconds to minutes for display
    const minutesPerQuestion = Math.floor(timePerQuestion / 60)

    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            {/* Header */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-lightbulb text-purple-500"></i>
                Inquiry Mode Settings
            </h3>

            {/* Settings Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{questionsRequired}</p>
                    <p className="text-xs text-gray-600">Questions Required</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{minutesPerQuestion}</p>
                    <p className="text-xs text-gray-600">Minutes/Question</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{passThreshold.toFixed(1)}</p>
                    <p className="text-xs text-gray-600">Min Score</p>
                </div>
            </div>

            {/* Keyword Pools */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{keywordCount1}</p>
                    <p className="text-xs text-gray-600">Concepts</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-teal-600">{keywordCount2}</p>
                    <p className="text-xs text-gray-600">Actions</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {isPublished && (
                    <Link
                        href={`/activities/${activityId}/inquiry`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
                    >
                        <i className="fas fa-play"></i>
                        Start Inquiry
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
