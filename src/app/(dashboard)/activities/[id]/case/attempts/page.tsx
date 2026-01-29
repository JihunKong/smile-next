'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LoadingState } from '@/components/ui'
import {
  useCaseAttempts,
  AttemptSummaryCard,
  AttemptCard,
  AttemptsHeader,
  EmptyAttemptsState,
} from '@/features/case-mode'

export default function CaseAttemptsPage() {
  const params = useParams()
  const activityId = params.id as string

  const {
    loading,
    error,
    attempts,
    activity,
    attemptsCount,
    passedCount,
    bestScore,
    remaining,
    maxAttemptsReached,
  } = useCaseAttempts({ activityId })

  if (loading) {
    return <LoadingState size="lg" message="Loading Attempts..." />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Attempts</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href={`/activities/${activityId}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
          >
            Back to Activity
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <AttemptsHeader
        activityName={activity?.name || ''}
        groupName={activity?.group_name || ''}
        activityId={activityId}
        maxAttemptsReached={maxAttemptsReached}
      />

      <AttemptSummaryCard
        totalAttempts={attemptsCount}
        passedCount={passedCount}
        bestScore={bestScore}
        remaining={remaining}
      />

      {attempts.length === 0 ? (
        <EmptyAttemptsState activityId={activityId} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Attempt History</h2>
          <div className="space-y-4">
            {[...attempts]
              .sort((a, b) => b.attempt_number - a.attempt_number)
              .map((attempt) => (
                <AttemptCard
                  key={attempt.id}
                  attempt={attempt}
                  activityId={activityId}
                  isBest={attempt.total_score === bestScore}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
