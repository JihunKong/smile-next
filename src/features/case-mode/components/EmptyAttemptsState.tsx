'use client'

import Link from 'next/link'

interface EmptyAttemptsStateProps {
  activityId: string
}

export function EmptyAttemptsState({ activityId }: EmptyAttemptsStateProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <i className="fas fa-clipboard-list text-gray-300 text-6xl mb-4"></i>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Attempts Yet</h3>
      <p className="text-gray-600 mb-6">You haven&apos;t taken this case activity yet.</p>
      <Link
        href={`/activities/${activityId}/case/take`}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg inline-block"
        style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
      >
        <i className="fas fa-play mr-2"></i>Start Your First Attempt
      </Link>
    </div>
  )
}
