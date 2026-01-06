'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startExamAttempt } from './actions'

interface ExamStartButtonProps {
  activityId: string
  hasInProgress: boolean
}

export function ExamStartButton({ activityId, hasInProgress }: ExamStartButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleStart() {
    setIsLoading(true)
    setError('')

    const result = await startExamAttempt(activityId)

    if (result.success && result.data) {
      router.push(`/activities/${activityId}/exam/take?attempt=${result.data.attemptId}`)
    } else {
      setError(result.error || 'Failed to start exam')
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
        data-testid="start-exam"
        suppressHydrationWarning
        className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition flex items-center gap-2 mx-auto"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {hasInProgress ? 'Continue Exam' : 'Start Exam'}
          </>
        )}
      </button>
    </div>
  )
}
