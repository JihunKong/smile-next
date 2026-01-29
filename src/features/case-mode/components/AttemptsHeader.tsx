'use client'

import Link from 'next/link'

interface AttemptsHeaderProps {
  activityName: string
  groupName: string
  activityId: string
  maxAttemptsReached: boolean
}

export function AttemptsHeader({
  activityName,
  groupName,
  activityId,
  maxAttemptsReached,
}: AttemptsHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Case Attempts</h1>
          <p className="text-gray-600 mt-2">
            {activityName} - {groupName}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/activities/${activityId}/case/take`}
            className={`font-semibold py-2 px-4 rounded-lg ${
              maxAttemptsReached
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
            style={maxAttemptsReached ? {} : { backgroundColor: '#4f46e5', color: '#ffffff' }}
            onClick={(e) => {
              if (maxAttemptsReached) e.preventDefault()
            }}
          >
            {maxAttemptsReached ? (
              <>
                <i className="fas fa-ban mr-2"></i>Max Attempts Reached
              </>
            ) : (
              <>
                <i className="fas fa-play mr-2"></i>Take Activity
              </>
            )}
          </Link>
          <Link
            href={`/activities/${activityId}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg"
          >
            <i className="fas fa-arrow-left mr-2"></i>Back
          </Link>
        </div>
      </div>
    </div>
  )
}
