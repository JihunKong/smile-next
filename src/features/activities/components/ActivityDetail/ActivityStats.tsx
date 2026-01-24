'use client'

/**
 * Props for the ActivityStats component
 */
export interface ActivityStatsProps {
    questionCount: number
    memberCount: number
    likeCount: number
    isPrivate: boolean
    className?: string
}

/**
 * ActivityStats Component
 * 
 * Displays a statistics grid showing:
 * - Questions count
 * - Members count
 * - Likes count
 * - Visibility status (Public/Private)
 */
export function ActivityStats({
    questionCount,
    memberCount,
    likeCount,
    isPrivate,
    className = ''
}: ActivityStatsProps) {
    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-chart-pie text-blue-500"></i>
                Activity Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
                {/* Questions */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{questionCount}</p>
                    <p className="text-sm text-gray-600">Questions</p>
                </div>

                {/* Members */}
                <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{memberCount}</p>
                    <p className="text-sm text-gray-600">Members</p>
                </div>

                {/* Likes */}
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">{likeCount}</p>
                    <p className="text-sm text-gray-600">Likes</p>
                </div>

                {/* Visibility */}
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">
                        {isPrivate ? 'Private' : 'Public'}
                    </p>
                    <p className="text-sm text-gray-600">Visibility</p>
                </div>
            </div>
        </div>
    )
}
