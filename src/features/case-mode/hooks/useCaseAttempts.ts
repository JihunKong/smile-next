'use client'

import { useEffect, useState, useCallback } from 'react'

interface CaseResponse {
  understanding_score: number
  ingenuity_score: number
  critical_thinking_score: number
  real_world_score: number
}

interface CaseAttempt {
  id: string
  attempt_number: number
  total_score: number
  passed: boolean
  started_at: string
  submitted_at: string
  responses: CaseResponse[]
}

interface Configuration {
  max_attempts: number
  pass_threshold: number
}

interface ActivityInfo {
  id: string
  name: string
  group_name: string
}

export interface UseCaseAttemptsOptions {
  activityId: string
}

export interface UseCaseAttemptsReturn {
  loading: boolean
  error: string | null
  attempts: CaseAttempt[]
  configuration: Configuration | null
  activity: ActivityInfo | null
  attemptsCount: number
  passedCount: number
  bestScore: number
  remaining: number
  maxAttemptsReached: boolean
  reload: () => Promise<void>
}

export function useCaseAttempts({ activityId }: UseCaseAttemptsOptions): UseCaseAttemptsReturn {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<CaseAttempt[]>([])
  const [configuration, setConfiguration] = useState<Configuration | null>(null)
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [attemptsCount, setAttemptsCount] = useState(0)

  const loadAttempts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch activity info
      const activityRes = await fetch(`/api/activities/${activityId}`)
      if (!activityRes.ok) throw new Error('Failed to load activity')
      const activityData = await activityRes.json()
      setActivity({
        id: activityData.id,
        name: activityData.name,
        group_name: activityData.owningGroup?.name || 'Unknown Group',
      })

      // Fetch attempts
      const attemptsRes = await fetch(`/api/case/my-attempts/${activityId}`)
      if (!attemptsRes.ok) throw new Error('Failed to load attempts')
      const attemptsData = await attemptsRes.json()

      if (!attemptsData.success) {
        throw new Error(attemptsData.error || 'Failed to load attempts')
      }

      setAttempts(attemptsData.attempts || [])
      setConfiguration(attemptsData.configuration || { max_attempts: 3, pass_threshold: 6.0 })
      setAttemptsCount(attemptsData.attempts_count || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [activityId])

  useEffect(() => {
    loadAttempts()
  }, [loadAttempts])

  const passedCount = attempts.filter((a) => a.passed).length
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.total_score)) : 0
  const remaining = Math.max(0, (configuration?.max_attempts || 3) - attemptsCount)
  const maxAttemptsReached = remaining === 0

  return {
    loading,
    error,
    attempts,
    configuration,
    activity,
    attemptsCount,
    passedCount,
    bestScore,
    remaining,
    maxAttemptsReached,
    reload: loadAttempts,
  }
}
