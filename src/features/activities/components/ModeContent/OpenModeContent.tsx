'use client'

import Link from 'next/link'

/**
 * Props for the OpenModeContent component
 */
export interface OpenModeContentProps {
    activityId: string
    instructions?: string
    questionCount: number
    isPassFailEnabled?: boolean
    requiredQuestionCount?: number
    requiredAvgScore?: number
    className?: string
}

/**
 * OpenModeContent Component
 * 
 * Displays Open mode activity content including:
 * - Instructions
 * - Pass/Fail requirements (when enabled)
 * - Current question count
 * - Ask a Question action
 */
export function OpenModeContent({
    activityId,
    instructions,
    questionCount,
    isPassFailEnabled = false,
    requiredQuestionCount = 1,
    requiredAvgScore = 5.0,
    className = ''
}: OpenModeContentProps) {
    const displayInstructions = instructions || 'Ask thoughtful questions related to the topic.'

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <i className="fas fa-info-circle"></i>
                    Instructions
                </h2>
                <p className="text-sm text-blue-700">{displayInstructions}</p>
            </div>

            {/* Pass/Fail Requirements */}
            {isPassFailEnabled && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <i className="fas fa-check-double"></i>
                        Pass/Fail Requirements
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                            <p className="text-2xl font-bold text-amber-600">{requiredQuestionCount}</p>
                            <p className="text-xs text-gray-600">Questions Required</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                            <p className="text-2xl font-bold text-amber-600">{requiredAvgScore.toFixed(1)}</p>
                            <p className="text-xs text-gray-600">Min Avg Score</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Stats & Action */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{questionCount}</p>
                            <p className="text-sm text-gray-600">Questions Posted</p>
                        </div>
                    </div>
                    <Link
                        href={`/activities/${activityId}/questions/create`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                    >
                        <i className="fas fa-plus"></i>
                        Ask a Question
                    </Link>
                </div>
            </div>
        </div>
    )
}
