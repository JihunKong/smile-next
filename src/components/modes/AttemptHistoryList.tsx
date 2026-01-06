'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface AttemptRecord {
  id: string
  startedAt: string | Date
  completedAt?: string | Date | null
  score?: number | null
  passed?: boolean | null
  status: string
  timeSpentSeconds?: number | null
}

interface AttemptHistoryListProps {
  attempts: AttemptRecord[]
  activityId: string
  mode: 'exam' | 'inquiry' | 'case'
  passThreshold?: number
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes === 0) {
    return `${remainingSeconds}s`
  }
  return `${minutes}m ${remainingSeconds}s`
}

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AttemptHistoryList({
  attempts,
  activityId,
  mode,
  passThreshold,
}: AttemptHistoryListProps) {
  if (attempts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No previous attempts</p>
      </div>
    )
  }

  // Sort attempts by date (newest first)
  const sortedAttempts = [...attempts].sort((a, b) => {
    const dateA = new Date(a.startedAt).getTime()
    const dateB = new Date(b.startedAt).getTime()
    return dateB - dateA
  })

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-900 mb-3">Previous Attempts</h3>

      {sortedAttempts.map((attempt, index) => {
        const isCompleted = attempt.status === 'completed'
        const isPassed = attempt.passed === true
        const isFailed = attempt.passed === false
        const isInProgress = attempt.status === 'in_progress'

        return (
          <div
            key={attempt.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              isInProgress
                ? 'bg-blue-50 border-blue-200'
                : isPassed
                  ? 'bg-green-50 border-green-200'
                  : isFailed
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  Attempt {sortedAttempts.length - index}
                </span>

                {/* Status Badge */}
                {isInProgress && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-200 text-blue-800">
                    IN PROGRESS
                  </span>
                )}
                {isPassed && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800">
                    PASSED
                  </span>
                )}
                {isFailed && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-200 text-red-800">
                    FAILED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>{formatDate(attempt.startedAt)}</span>

                {attempt.timeSpentSeconds && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDuration(attempt.timeSpentSeconds)}
                  </span>
                )}

                {isCompleted && attempt.completedAt && (
                  <span className="text-gray-500">
                    {formatDistanceToNow(new Date(attempt.completedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Score */}
              {attempt.score !== null && attempt.score !== undefined && (
                <div className="text-right">
                  <p
                    className={`text-xl font-bold ${
                      isPassed ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-gray-700'
                    }`}
                  >
                    {mode === 'exam' ? `${attempt.score.toFixed(1)}%` : attempt.score.toFixed(1)}
                  </p>
                  {passThreshold && (
                    <p className="text-xs text-gray-500">
                      Pass: {mode === 'exam' ? `${passThreshold}%` : passThreshold}
                    </p>
                  )}
                </div>
              )}


              {/* Resume Button for In Progress */}
              {isInProgress && (
                <Link
                  href={`/activities/${activityId}/${mode}/take?attempt=${attempt.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Resume
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AttemptHistoryList
