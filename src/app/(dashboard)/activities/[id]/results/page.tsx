'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ActivityResult {
  id: string
  activityName: string
  activityType: string
  mode: number
  owningGroup: {
    id: string
    name: string
  }
  stats: {
    totalQuestions: number
    totalResponses: number
    totalParticipants: number
    averageScore: number | null
    passRate: number | null
    completionRate: number | null
  }
  topPerformers: Array<{
    rank: number
    userId: string
    userName: string
    score: number
    questionsAnswered: number
  }>
  recentAttempts: Array<{
    id: string
    userId: string
    userName: string
    score: number | null
    status: string
    completedAt: string | null
    timeSpent: number | null
  }>
  bloomsDistribution: Record<string, number>
}

export default function ActivityResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: activityId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [results, setResults] = useState<ActivityResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'attempts'>('overview')

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/activities/${activityId}/results`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
        } else if (response.status === 403) {
          router.push('/dashboard')
        } else if (response.status === 404) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to fetch results:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchResults()
    }
  }, [session, activityId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Results not found.</p>
      </div>
    )
  }

  const modeLabels: Record<number, string> = {
    0: 'Open Mode',
    1: 'Exam Mode',
    2: 'Inquiry Mode',
    3: 'Case Mode',
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/activities/${activityId}`}
            className="text-[#8C1515] hover:underline text-sm mb-2 inline-block"
          >
            &larr; Back to Activity
          </Link>
          <h1 className="text-2xl font-bold text-[#2E2D29]">{results.activityName}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="px-3 py-1 bg-[#8C1515] text-white text-sm rounded-full">
              {modeLabels[results.mode] || results.activityType}
            </span>
            <span className="text-gray-500">
              {results.owningGroup.name}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Participants</p>
            <p className="text-2xl font-bold text-[#2E2D29]">{results.stats.totalParticipants}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Questions</p>
            <p className="text-2xl font-bold text-[#2E2D29]">{results.stats.totalQuestions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-2xl font-bold text-[#2E2D29]">
              {results.stats.averageScore !== null ? `${Math.round(results.stats.averageScore)}%` : '-'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pass Rate</p>
            <p className="text-2xl font-bold text-[#2E2D29]">
              {results.stats.passRate !== null ? `${Math.round(results.stats.passRate)}%` : '-'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'leaderboard', 'attempts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                activeTab === tab
                  ? 'bg-[#8C1515] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Bloom&apos;s Taxonomy Distribution</h2>
              <div className="space-y-3">
                {Object.entries(results.bloomsDistribution).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-4">
                    <span className="w-32 text-sm text-gray-600">{level}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-[#8C1515] h-full flex items-center justify-end px-2"
                        style={{ width: `${Math.min(100, (count / results.stats.totalQuestions) * 100)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="divide-y divide-gray-200">
              {results.topPerformers.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No leaderboard data available yet.</p>
                </div>
              ) : (
                results.topPerformers.map((performer) => (
                  <div key={performer.userId} className="p-4 flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      performer.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      performer.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      performer.rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {performer.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[#2E2D29]">{performer.userName}</p>
                      <p className="text-sm text-gray-500">{performer.questionsAnswered} questions answered</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#8C1515]">{Math.round(performer.score)}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'attempts' && (
            <div className="overflow-x-auto">
              {results.recentAttempts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No attempts yet.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.recentAttempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attempt.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {attempt.score !== null ? (
                            <span className={`font-medium ${attempt.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.round(attempt.score)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            attempt.status === 'completed' ? 'bg-green-100 text-green-800' :
                            attempt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {attempt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(attempt.timeSpent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
