/**
 * ExamOverviewStats Component
 *
 * Displays the overview statistics cards for exam analytics page.
 * Shows total attempts, pass rate, average score, and average time.
 *
 * @see VIBE-0004C
 */

interface ExamOverviewStatsProps {
    totalAttempts: number
    uniqueStudents: number
    passRate: number
    passedStudents: number
    averageScore: number
    avgTimeMinutes: number
    minTimeMinutes: number
    maxTimeMinutes: number
}

export function ExamOverviewStats({
    totalAttempts,
    uniqueStudents,
    passRate,
    passedStudents,
    averageScore,
    avgTimeMinutes,
    minTimeMinutes,
    maxTimeMinutes,
}: ExamOverviewStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Attempts */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
                        <p className="text-3xl font-bold text-gray-900">{totalAttempts}</p>
                        <p className="text-xs text-gray-500 mt-1">{uniqueStudents} students</p>
                    </div>
                    <div className="text-blue-500">
                        <i className="fas fa-clipboard-list text-4xl"></i>
                    </div>
                </div>
            </div>

            {/* Pass Rate */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
                        <p
                            className={`text-3xl font-bold ${passRate >= 70
                                    ? 'text-green-700'
                                    : passRate >= 50
                                        ? 'text-yellow-500'
                                        : 'text-red-700'
                                }`}
                        >
                            {passRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {passedStudents} / {uniqueStudents} passed
                        </p>
                    </div>
                    <div className="text-green-500">
                        <i className="fas fa-check-circle text-4xl"></i>
                    </div>
                </div>
            </div>

            {/* Average Score */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Average Score</p>
                        <p className="text-3xl font-bold text-gray-900">{averageScore.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">Across all attempts</p>
                    </div>
                    <div className="text-purple-500">
                        <i className="fas fa-star text-4xl"></i>
                    </div>
                </div>
            </div>

            {/* Average Time */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Average Time</p>
                        <p className="text-3xl font-bold text-gray-900">{avgTimeMinutes}m</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Range: {minTimeMinutes}m - {maxTimeMinutes}m
                        </p>
                    </div>
                    <div className="text-orange-500">
                        <i className="fas fa-clock text-4xl"></i>
                    </div>
                </div>
            </div>
        </div>
    )
}
