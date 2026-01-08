'use client'

import { useState, useEffect, useCallback } from 'react'

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

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/responses/${responseId}/status`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: EvaluationData = await response.json()

      // Update state if status changed
      if (data.aiEvaluationStatus !== status) {
        setStatus(data.aiEvaluationStatus)
        setEvaluation(data)
      }

      return data.aiEvaluationStatus
    } catch (err) {
      console.error('[useResponseEvaluationPolling] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
      return null
    }
  }, [responseId, status])

  useEffect(() => {
    // Don't poll if disabled or status is not pending
    if (!enabled || status !== 'pending') {
      setIsPolling(false)
      return
    }

    setIsPolling(true)
    setError(null)

    const startTime = Date.now()
    let intervalId: NodeJS.Timeout | null = null

    const poll = async () => {
      // Stop if max duration exceeded
      if (Date.now() - startTime > maxDuration) {
        setIsPolling(false)
        setError('Evaluation timeout - please refresh the page')
        if (intervalId) clearInterval(intervalId)
        return
      }

      const newStatus = await fetchStatus()

      // Stop polling if evaluation is complete or failed
      if (newStatus && newStatus !== 'pending') {
        setIsPolling(false)
        if (intervalId) clearInterval(intervalId)
      }
    }

    // Initial fetch
    poll()

    // Set up interval for subsequent polls
    intervalId = setInterval(poll, interval)

    // Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId)
      setIsPolling(false)
    }
  }, [enabled, status, interval, maxDuration, fetchStatus])

  return {
    status,
    evaluation,
    isPolling,
    error,
  }
}
