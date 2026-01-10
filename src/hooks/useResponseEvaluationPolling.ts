'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface EvaluationData {
  id: string
  aiEvaluationStatus: string | null
  aiEvaluationRating: string | null
  aiEvaluationScore: number | null
  aiEvaluationFeedback: string | null
  aiEvaluationTimestamp: string | null
}

interface UseResponseEvaluationPollingOptions {
  /** Polling interval in milliseconds (default: 3000) */
  interval?: number
  /** Maximum polling duration in milliseconds (default: 300000 = 5 minutes) */
  maxDuration?: number
}

interface UseResponseEvaluationPollingResult {
  status: string | null
  evaluation: EvaluationData | null
  isPolling: boolean
  error: string | null
}

/**
 * Custom hook for polling AI evaluation status
 * Polls the API until evaluation is complete or max duration is reached
 */
export function useResponseEvaluationPolling(
  responseId: string,
  initialStatus: string | null,
  enabled: boolean = true,
  options: UseResponseEvaluationPollingOptions = {}
): UseResponseEvaluationPollingResult {
  const { interval = 3000, maxDuration = 300000 } = options

  const [status, setStatus] = useState<string | null>(initialStatus)
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use ref to track if polling should stop (avoids dependency issues)
  const shouldStopRef = useRef(false)
  const startTimeRef = useRef<number>(0)

  // Stop polling immediately when status changes to completed or error
  useEffect(() => {
    if (status === 'completed' || status === 'error') {
      shouldStopRef.current = true
      setIsPolling(false)
    }
  }, [status])

  // Memoized fetch function without status dependency
  const fetchStatus = useCallback(async (): Promise<EvaluationData | null> => {
    try {
      const response = await fetch(`/api/responses/${responseId}/status`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      console.error('[useResponseEvaluationPolling] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
      return null
    }
  }, [responseId])

  useEffect(() => {
    // Don't poll if disabled, status is not pending, or already completed
    if (!enabled || initialStatus !== 'pending' || status === 'completed' || status === 'error') {
      setIsPolling(false)
      return
    }

    // Reset refs
    shouldStopRef.current = false
    startTimeRef.current = Date.now()

    setIsPolling(true)
    setError(null)

    let intervalId: NodeJS.Timeout | null = null

    const poll = async () => {
      // Check if we should stop
      if (shouldStopRef.current) {
        if (intervalId) clearInterval(intervalId)
        return
      }

      // Stop if max duration exceeded
      if (Date.now() - startTimeRef.current > maxDuration) {
        setIsPolling(false)
        setError('Evaluation timeout - please refresh the page')
        shouldStopRef.current = true
        if (intervalId) clearInterval(intervalId)
        return
      }

      const data = await fetchStatus()

      if (data) {
        // Always update with latest data
        setStatus(data.aiEvaluationStatus)
        setEvaluation(data)

        // Stop polling if evaluation is complete or failed
        if (data.aiEvaluationStatus !== 'pending') {
          console.log('[useResponseEvaluationPolling] Evaluation complete:', data.aiEvaluationStatus)
          setIsPolling(false)
          shouldStopRef.current = true
          if (intervalId) clearInterval(intervalId)
        }
      }
    }

    // Initial fetch
    poll()

    // Set up interval for subsequent polls
    intervalId = setInterval(poll, interval)

    // Cleanup
    return () => {
      shouldStopRef.current = true
      if (intervalId) clearInterval(intervalId)
      setIsPolling(false)
    }
  }, [enabled, initialStatus, status, interval, maxDuration, fetchStatus])

  return {
    status,
    evaluation,
    isPolling,
    error,
  }
}
