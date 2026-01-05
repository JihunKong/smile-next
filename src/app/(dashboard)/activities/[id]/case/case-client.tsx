'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startCaseAttempt } from './actions'

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
        className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2 mx-auto"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Starting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {hasInProgress ? 'Continue Case Study' : 'Start Case Study'}
          </>
        )}
      </button>
    </div>
  )
}
