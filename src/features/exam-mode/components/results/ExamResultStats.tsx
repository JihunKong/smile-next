/**
 * ExamResultStats Component
 *
 * Displays the breakdown of exam results including correct/wrong/total counts
 * and additional stats like time taken, passing threshold, submission time, etc.
 *
 * @see VIBE-0004C
 */

interface ExamResultStatsProps {
    correctAnswers: number
    totalQuestions: number
    timeSpentMinutes: number
    timeSpentSeconds: number
    passThreshold: number
    completedAt: Date | null
    remainingAttempts: number
    showScore?: boolean
}

export function ExamResultStats({
    correctAnswers,
    totalQuestions,
    timeSpentMinutes,
    timeSpentSeconds,
    passThreshold,
    completedAt,
    remainingAttempts,
    showScore = true,
}: ExamResultStatsProps) {
    const wrongAnswers = totalQuestions - correctAnswers

    return (
        <>
            {/* Results Breakdown */}
            {showScore && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 mb-1">Correct Answers</p>
                                <p className="text-3xl font-bold text-green-600">{correctAnswers}</p>
                            </div>
                            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-700 mb-1">Wrong Answers</p>
                                <p className="text-3xl font-bold text-red-600">{wrongAnswers}</p>
                            </div>
                            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 mb-1">Total Questions</p>
                                <p className="text-3xl font-bold text-blue-600">{totalQuestions}</p>
                            </div>
                            <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-sm text-gray-500">Time Taken</p>
                        <p className="text-lg font-semibold text-gray-700">
                            {timeSpentMinutes}m {timeSpentSeconds}s
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div>
                        <p className="text-sm text-gray-500">Passing Threshold</p>
                        <p className="text-lg font-semibold text-gray-700">{passThreshold}%</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                        <p className="text-sm text-gray-500">Submitted At</p>
                        <p className="text-lg font-semibold text-gray-700">
                            {completedAt ? new Date(completedAt).toLocaleString() : 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <div>
                        <p className="text-sm text-gray-500">Attempts Remaining</p>
                        <p className="text-lg font-semibold text-gray-700">{remainingAttempts}</p>
                    </div>
                </div>
            </div>
        </>
    )
}
