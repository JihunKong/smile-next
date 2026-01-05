'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startInquiryAttempt } from './actions'

interface InquiryStartButtonProps {
  activityId: string
  hasInProgress: boolean
}

export function InquiryStartButton({ activityId, hasInProgress }: InquiryStartButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    setIsLoading(true)
    setError('')

    const result = await startInquiryAttempt(activityId)

    if (result.success && result.data) {
      router.push(`/activities/${activityId}/inquiry/take?attempt=${result.data.attemptId}`)
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
        className="px-8 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition flex items-center gap-2 mx-auto"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {hasInProgress ? 'Continue' : 'Start Inquiry'}
          </>
        )}
      </button>
    </div>
  )
}
