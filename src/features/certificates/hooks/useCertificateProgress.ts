/**
 * useCertificateProgress Hook
 *
 * Manages certificate enrollment progress tracking.
 * Fetches and monitors student's progress through certificate activities.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CertificateProgress, ActivityProgress } from '../types'

export interface UseCertificateProgressOptions {
  /** The enrollment ID to fetch progress for */
  enrollmentId?: string
  /** Optional polling interval in milliseconds */
  pollInterval?: number
}

export interface UseCertificateProgressReturn {
  /** Full progress data from API */
  progress: CertificateProgress | null
  /** List of activities with their progress status */
  activities: ActivityProgress[]
  /** Progress statistics */
  stats: CertificateProgress['progress'] | null
  /** Whether all activities are completed */
  isCompleted: boolean
  /** Initial loading state */
  isLoading: boolean
  /** Refetch loading state */
  isRefetching: boolean
  /** Error message if any */
  error: string | null
  /** Refetch progress data */
  refetch: () => Promise<void>
  /** Get activity by its ID */
  getActivityById: (activityId: string) => ActivityProgress | undefined
  /** Get the next activity to work on (first in_progress or not_started) */
  getNextActivity: () => ActivityProgress | undefined
}

export function useCertificateProgress(
  options: UseCertificateProgressOptions
): UseCertificateProgressReturn {
  const { enrollmentId, pollInterval } = options

  const [progress, setProgress] = useState<CertificateProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchProgress = useCallback(
    async (isRefetch = false) => {
      if (!enrollmentId) return

      if (isRefetch) {
        setIsRefetching(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const response = await fetch(`/api/my-certificates/${enrollmentId}/progress`, {
          method: 'GET',
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch progress')
        }

        const data = await response.json()
        setProgress(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress'
        setError(errorMessage)
        setProgress(null)
      } finally {
        setIsLoading(false)
        setIsRefetching(false)
      }
    },
    [enrollmentId]
  )

  // Initial fetch
  useEffect(() => {
    if (enrollmentId) {
      fetchProgress(false)
    }
  }, [enrollmentId, fetchProgress])

  // Polling
  useEffect(() => {
    if (pollInterval && enrollmentId) {
      pollIntervalRef.current = setInterval(() => {
        fetchProgress(true)
      }, pollInterval)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [pollInterval, enrollmentId, fetchProgress])

  const refetch = useCallback(async () => {
    await fetchProgress(true)
  }, [fetchProgress])

  const getActivityById = useCallback(
    (activityId: string): ActivityProgress | undefined => {
      return progress?.activities.find((a) => a.activity.id === activityId)
    },
    [progress]
  )

  const getNextActivity = useCallback((): ActivityProgress | undefined => {
    if (!progress?.activities) return undefined

    // First try to find an in_progress activity
    const inProgress = progress.activities.find((a) => a.status === 'in_progress')
    if (inProgress) return inProgress

    // Otherwise find the first not_started activity
    return progress.activities.find((a) => a.status === 'not_started')
  }, [progress])

  const activities = progress?.activities ?? []
  const stats = progress?.progress ?? null
  const isCompleted = progress?.status === 'completed'

  return {
    progress,
    activities,
    stats,
    isCompleted,
    isLoading,
    isRefetching,
    error,
    refetch,
    getActivityById,
    getNextActivity,
  }
}
