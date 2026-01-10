'use client'

import { useEffect, useState, useCallback } from 'react'

interface ProgressData {
  enabled: boolean
  status?: 'passed' | 'in_progress' | 'not_started'
  hasPassed?: boolean
  current?: {
    questionCount: number
    avgLevel: number
    avgScore: number
    peerRatingsGiven: number
    peerResponsesGiven: number
  }
  required?: {
    questionCount: number
    avgLevel: number
    avgScore: number
    peerRatingsRequired: number
    peerResponsesRequired: number
  }
  progress?: {
    questionsMet: boolean
    levelMet: boolean
    scoreMet: boolean
    peerRatingsMet: boolean
    peerResponsesMet: boolean
    noPeersAvailable: boolean
  }
}

interface ProgressItemProps {
  label: string
  current: number
  required: number
  met: boolean
  suffix?: string
  waiting?: boolean
}

function ProgressItem({ label, current, required, met, suffix = '', waiting }: ProgressItemProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {waiting ? (
          <span className="text-xs text-yellow-600">Waiting for peers...</span>
        ) : met ? (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold ${met ? 'text-green-600' : 'text-gray-900'}`}>
          {current}{suffix}
        </span>
        <span className="text-sm text-gray-500">/ {required}{suffix}</span>
      </div>
      {!met && !waiting && current < required && (
        <p className="text-xs text-gray-500 mt-1">
          Need {required - current} more
        </p>
      )}
    </div>
  )
}

export function StudentProgressWidget({ activityId }: { activityId: string }) {
  const [data, setData] = useState<ProgressData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/activities/${activityId}/progress`)
      if (!res.ok) throw new Error('Failed to fetch progress')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    fetchProgress()
    // Refresh every 10 seconds
    const interval = setInterval(fetchProgress, 10000)
    return () => clearInterval(interval)
  }, [fetchProgress])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !data?.enabled) {
    return null
  }

  const { status, hasPassed, current, required, progress } = data

  if (!current || !required || !progress) {
    return null
  }

  // Count how many goals are met
  const goalsToCount = [
    progress.questionsMet,
    progress.levelMet,
    progress.scoreMet,
    required.peerRatingsRequired > 0 ? progress.peerRatingsMet : null,
    required.peerResponsesRequired > 0 ? progress.peerResponsesMet : null,
  ].filter(g => g !== null)

  const goalsMet = goalsToCount.filter(Boolean).length
  const totalGoals = goalsToCount.length

  return (
    <div className={`rounded-lg shadow-sm p-4 ${hasPassed ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {hasPassed ? (
            <>
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-green-800">Congratulations! You&apos;ve Passed</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-bold text-yellow-800">Your Progress</span>
            </>
          )}
        </div>
        <span className={`text-sm font-medium ${hasPassed ? 'text-green-700' : 'text-yellow-700'}`}>
          {goalsMet} of {totalGoals} Goals
        </span>
      </div>

      {/* Progress Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Questions */}
        <ProgressItem
          label="Questions"
          current={current.questionCount}
          required={required.questionCount}
          met={progress.questionsMet}
        />

        {/* Bloom's Level */}
        <ProgressItem
          label="Bloom's Level"
          current={current.avgLevel}
          required={required.avgLevel}
          met={progress.levelMet}
        />

        {/* AI Score */}
        <ProgressItem
          label="AI Score"
          current={current.avgScore}
          required={required.avgScore}
          met={progress.scoreMet}
        />

        {/* Peer Ratings (optional) */}
        {required.peerRatingsRequired > 0 && (
          <ProgressItem
            label="Peer Ratings"
            current={current.peerRatingsGiven}
            required={required.peerRatingsRequired}
            met={progress.peerRatingsMet}
            waiting={progress.noPeersAvailable && !progress.peerRatingsMet}
          />
        )}

        {/* Peer Responses (optional) */}
        {required.peerResponsesRequired > 0 && (
          <ProgressItem
            label="Peer Responses"
            current={current.peerResponsesGiven}
            required={required.peerResponsesRequired}
            met={progress.peerResponsesMet}
            waiting={progress.noPeersAvailable && !progress.peerResponsesMet}
          />
        )}
      </div>

      {/* Status Message */}
      {!hasPassed && status === 'in_progress' && (
        <p className="text-xs text-yellow-700 mt-3">
          Keep going! Complete all requirements to pass this activity.
        </p>
      )}
      {status === 'not_started' && (
        <p className="text-xs text-gray-600 mt-3">
          Post your first question to get started!
        </p>
      )}
    </div>
  )
}
