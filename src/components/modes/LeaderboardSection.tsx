'use client'

import { useState, useEffect } from 'react'
import { ActivityLeaderboard } from './ActivityLeaderboard'

interface LeaderboardEntry {
  userId: string
  userName: string
  totalScore: number
  averageScore: number | null
  rank: number
  attemptCount: number
}

interface LeaderboardSectionProps {
  activityId: string
  mode: 'exam' | 'inquiry' | 'case'
  title?: string
}

export function LeaderboardSection({ activityId, mode, title }: LeaderboardSectionProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch(`/api/activities/${activityId}/leaderboard?mode=${mode}`)

        if (!response.ok) {
          throw new Error('Failed to load leaderboard')
        }

        const data = await response.json()
        setEntries(data.entries || [])
        setCurrentUserId(data.currentUserId)
      } catch (err) {
        setError('Could not load leaderboard')
        console.error('Leaderboard fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [activityId, mode])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return null // Don't show error, just hide the section
  }

  return (
    <ActivityLeaderboard
      entries={entries}
      currentUserId={currentUserId}
      mode={mode}
      title={title || 'Leaderboard'}
      showPodium={entries.length >= 3}
      maxEntries={10}
    />
  )
}

export default LeaderboardSection
