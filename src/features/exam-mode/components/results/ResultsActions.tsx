/**
 * ResultsActions Component
 *
 * Displays action buttons for the exam results page including
 * back to activity, retry, leaderboard, and share buttons.
 *
 * @see VIBE-0004C
 */

import Link from 'next/link'
import { ExamShareButtons } from '@/components/activities/ExamShareButtons'

interface ResultsActionsProps {
    activityId: string
    attemptId: string
    activityName: string
    score: number
    passed: boolean
    remainingAttempts: number
    showLeaderboard?: boolean
}

export function ResultsActions({
    activityId,
    attemptId,
    activityName,
    score,
    passed,
    remainingAttempts,
    showLeaderboard = true,
}: ResultsActionsProps) {
    return (
        <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                {/* Return to Activity */}
                <Link
                    href={`/activities/${activityId}`}
                    className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Activity
                </Link>

                {/* Retry Button (if reattempts allowed) */}
                {remainingAttempts > 0 ? (
                    <Link
                        href={`/activities/${activityId}/exam/take`}
                        className="flex-1 md:flex-initial bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again ({remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} left)
                    </Link>
                ) : (
                    <button
                        disabled
                        className="flex-1 md:flex-initial bg-gray-300 text-gray-500 font-medium py-3 px-6 rounded-lg text-center cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        No Attempts Left
                    </button>
                )}

                {/* View Leaderboard */}
                {showLeaderboard && (
                    <Link
                        href={`/activities/${activityId}/exam/leaderboard`}
                        className="flex-1 md:flex-initial bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        View Leaderboard
                    </Link>
                )}
            </div>

            {/* Share Results (if passed) */}
            {passed && (
                <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-sm text-gray-600 mb-3">Share your achievement!</p>
                    <ExamShareButtons
                        examName={activityName}
                        score={score}
                        activityId={activityId}
                        attemptId={attemptId}
                    />
                </div>
            )}
        </div>
    )
}
