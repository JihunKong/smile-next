'use client'

interface GroupStatsProps {
    memberCount: number
    activityCount: number
    questionCount?: number
}

export function GroupStats({ memberCount, activityCount, questionCount }: GroupStatsProps) {
    return (
        <div className="flex gap-6 py-4">
            <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
                <p className="text-sm text-gray-500">
                    {memberCount === 1 ? 'Member' : 'Members'}
                </p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{activityCount}</p>
                <p className="text-sm text-gray-500">
                    {activityCount === 1 ? 'Activity' : 'Activities'}
                </p>
            </div>
            {questionCount !== undefined && (
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{questionCount}</p>
                    <p className="text-sm text-gray-500">
                        {questionCount === 1 ? 'Question' : 'Questions'}
                    </p>
                </div>
            )}
        </div>
    )
}
