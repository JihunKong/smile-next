'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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

export default function CaseAttemptsPage() {
  const params = useParams()
  const router = useRouter()
  const activityId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<CaseAttempt[]>([])
  const [configuration, setConfiguration] = useState<Configuration | null>(null)
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [attemptsCount, setAttemptsCount] = useState(0)

  useEffect(() => {
    loadAttempts()
  }, [activityId])

  async function loadAttempts() {
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
  }

  function calculateAvgCriteria(responses: CaseResponse[], field: keyof CaseResponse): string {
    if (!responses || responses.length === 0) return 'N/A'
    const sum = responses.reduce((acc, resp) => acc + (resp[field] || 0), 0)
    return (sum / responses.length).toFixed(1)
  }

  const passedCount = attempts.filter((a) => a.passed).length
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.total_score)) : 0
  const remaining = Math.max(0, (configuration?.max_attempts || 3) - attemptsCount)
  const maxAttemptsReached = remaining === 0

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Attempts...</h3>
          <p className="text-gray-600">Fetching your attempt history</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Attempts</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href={`/activities/${activityId}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
          >
            Back to Activity
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Case Attempts</h1>
            <p className="text-gray-600 mt-2">
              {activity?.name} - {activity?.group_name}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/activities/${activityId}/case/take`}
              className={`font-semibold py-2 px-4 rounded-lg ${
                maxAttemptsReached
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white`}
              style={
                maxAttemptsReached ? {} : { backgroundColor: '#4f46e5', color: '#ffffff' }
              }
              onClick={(e) => {
                if (maxAttemptsReached) e.preventDefault()
              }}
            >
              {maxAttemptsReached ? (
                <>
                  <i className="fas fa-ban mr-2"></i>Max Attempts Reached
                </>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>Take Activity
                </>
              )}
            </Link>
            <Link
              href={`/activities/${activityId}`}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg"
            >
              <i className="fas fa-arrow-left mr-2"></i>Back
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Attempts</p>
            <p className="text-4xl font-bold text-indigo-600">{attemptsCount}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">Passed</p>
            <p className="text-4xl font-bold text-green-600">{passedCount}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">Best Score</p>
            <p className="text-4xl font-bold text-yellow-600">{bestScore.toFixed(1)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">Remaining</p>
            <p className="text-4xl font-bold text-gray-600">{remaining}</p>
          </div>
        </div>
      </div>

      {/* Attempts List */}
      {attempts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <i className="fas fa-clipboard-list text-gray-300 text-6xl mb-4"></i>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Attempts Yet</h3>
          <p className="text-gray-600 mb-6">You haven&apos;t taken this case activity yet.</p>
          <Link
            href={`/activities/${activityId}/case/take`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg inline-block"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
          >
            <i className="fas fa-play mr-2"></i>Start Your First Attempt
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Attempt History</h2>
          <div className="space-y-4">
            {[...attempts]
              .sort((a, b) => b.attempt_number - a.attempt_number)
              .map((attempt) => {
                const startDate = new Date(attempt.started_at)
                const submitDate = new Date(attempt.submitted_at)
                const timeSpent = Math.round((submitDate.getTime() - startDate.getTime()) / 1000)
                const minutes = Math.floor(timeSpent / 60)
                const seconds = timeSpent % 60

                const isBest = attempt.total_score === bestScore

                return (
                  <div
                    key={attempt.id}
                    className={`border rounded-lg p-6 ${
                      attempt.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          Attempt {attempt.attempt_number}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            attempt.passed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <i
                            className={`fas fa-${attempt.passed ? 'check' : 'times'}-circle mr-1`}
                          ></i>
                          {attempt.passed ? 'Passed' : 'Not Passed'}
                        </span>
                        {isBest && (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold ml-2">
                            <i className="fas fa-star mr-1"></i>Best
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {attempt.total_score.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500">out of 10.0</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Understanding</p>
                        <p className="font-semibold text-yellow-700">
                          {calculateAvgCriteria(attempt.responses, 'understanding_score')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Ingenuity</p>
                        <p className="font-semibold text-purple-700">
                          {calculateAvgCriteria(attempt.responses, 'ingenuity_score')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Critical Thinking</p>
                        <p className="font-semibold text-blue-700">
                          {calculateAvgCriteria(attempt.responses, 'critical_thinking_score')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Real-World</p>
                        <p className="font-semibold text-green-700">
                          {calculateAvgCriteria(attempt.responses, 'real_world_score')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
                      <div className="flex items-center gap-4">
                        <span>
                          <i className="fas fa-calendar mr-1"></i>
                          {submitDate.toLocaleDateString()}
                        </span>
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {minutes}m {seconds}s
                        </span>
                        <span>
                          <i className="fas fa-clipboard-list mr-1"></i>
                          {attempt.responses?.length || 0} cases
                        </span>
                      </div>
                      <Link
                        href={`/activities/${activityId}/case/${attempt.id}/results`}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
                        style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                      >
                        View Details
                        <i className="fas fa-arrow-right ml-2"></i>
                      </Link>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
