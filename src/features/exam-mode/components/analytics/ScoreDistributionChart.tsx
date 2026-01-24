/**
 * ScoreDistributionChart Component
 *
 * Displays a horizontal bar chart showing the distribution of scores
 * across different ranges.
 *
 * @see VIBE-0004C
 */

interface ScoreDistributionChartProps {
    distribution: Record<string, number>
    totalAttempts: number
}

export function ScoreDistributionChart({
    distribution,
    totalAttempts,
}: ScoreDistributionChartProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-chart-bar mr-2 text-red-700"></i>
                Score Distribution
            </h2>
            <div className="space-y-3">
                {Object.entries(distribution).map(([range, count]) => (
                    <div key={range} className="flex items-center">
                        <div className="w-20 text-sm font-semibold text-gray-700">{range}%</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-400 h-full flex items-center justify-end pr-3 transition-all duration-500"
                                style={{
                                    width: totalAttempts > 0 ? `${(count / totalAttempts) * 100}%` : '0%',
                                }}
                            >
                                {count > 0 && <span className="text-white text-sm font-bold">{count}</span>}
                            </div>
                        </div>
                        <div className="w-16 text-right text-sm text-gray-600 ml-3">
                            {totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
