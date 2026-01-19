'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startCaseAttempt } from './actions'
import { LoadingSpinner } from '@/components/ui'

interface CaseStartButtonProps {
  activityId: string
  hasInProgress: boolean
}

export function CaseStartButton({ activityId, hasInProgress }: CaseStartButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    setIsLoading(true)
    setError('')

    const result = await startCaseAttempt(activityId)

    if (result.success && result.data) {
      router.push(`/activities/${activityId}/case/take?attempt=${result.data.attemptId}`)
    } else {
      setError(result.error || 'Failed to start')
      setIsLoading(false)
    }
  }

  return (
    <div className="text-center">
      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}
      <button
        onClick={handleStart}
        disabled={isLoading}
        data-testid="start-case"
        suppressHydrationWarning
        className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2 mx-auto"
        style={{ backgroundColor: '#4f46e5' }}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            Starting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {hasInProgress ? 'Continue Case Activity' : 'Start Case Activity'}
          </>
        )}
      </button>
    </div>
  )
}
