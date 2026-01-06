'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface AttemptSummary {
  id: string
  activityId: string
  activityName: string
  groupName: string
  mode: number
  score: number | null
  status: string
  startedAt: string
  completedAt: string | null
  timeSpent: number | null
  passed: boolean | null
}

interface UserStats {
  totalQuestions: number
  totalResponses: number
  totalExamAttempts: number
  totalInquiryAttempts: number
  totalCaseAttempts: number
  averageScore: number | null
  passRate: number | null
  totalTimeSpent: number
  bloomsBreakdown: Record<string, number>
}

export default function MyResultsPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [attempts, setAttempts] = useState<AttemptSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'exam' | 'inquiry' | 'case'>('all')

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch('/api/user/results')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setAttempts(data.attempts)
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
  }, [session])

  const filteredAttempts = filter === 'all'
    ? attempts
    : attempts.filter(a => {
        if (filter === 'exam') return a.mode === 1
        if (filter === 'inquiry') return a.mode === 2
        if (filter === 'case') return a.mode === 3
        return true
      })

  const modeLabels: Record<number, string> = {
    0: 'Open',
    1: 'Exam',
    2: 'Inquiry',
    3: 'Case',
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2E2D29]">My Results</h1>
          <p className="text-gray-600 mt-1">Track your learning progress and performance</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Questions Created</p>
              <p className="text-2xl font-bold text-[#2E2D29]">{stats.totalQuestions}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Exams Taken</p>
              <p className="text-2xl font-bold text-[#2E2D29]">{stats.totalExamAttempts}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Inquiries</p>
              <p className="text-2xl font-bold text-[#2E2D29]">{stats.totalInquiryAttempts}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Cases</p>
              <p className="text-2xl font-bold text-[#2E2D29]">{stats.totalCaseAttempts}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-[#2E2D29]">
                {stats.averageScore !== null ? `${Math.round(stats.averageScore)}%` : '-'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Pass Rate</p>
              <p className="text-2xl font-bold text-[#2E2D29]">
                {stats.passRate !== null ? `${Math.round(stats.passRate)}%` : '-'}
              </p>
            </div>
          </div>
        )}

        {/* Bloom's Breakdown */}
        {stats && Object.values(stats.bloomsBreakdown).some(v => v > 0) && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Bloom&apos;s Taxonomy Progress</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {Object.entries(stats.bloomsBreakdown).map(([level, count]) => (
                <div key={level} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    count > 0 ? 'bg-[#8C1515] text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <span className="text-xl font-bold">{count}</span>
                  </div>
                  <p className="text-xs text-gray-600">{level}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'exam', 'inquiry', 'case'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                filter === f
                  ? 'bg-[#8C1515] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-2 text-xs opacity-70">
                  ({attempts.filter(a =>
                    f === 'exam' ? a.mode === 1 : f === 'inquiry' ? a.mode === 2 : a.mode === 3
                  ).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Attempts List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredAttempts.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts yet</h3>
              <p className="text-gray-500">Start learning by joining activities in your groups!</p>
              <Link href="/groups" className="mt-4 inline-block text-[#8C1515] hover:underline">
                Browse Groups
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAttempts.map((attempt) => (
                <div key={attempt.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/activities/${attempt.activityId}`}
                          className="text-lg font-medium text-[#2E2D29] hover:text-[#8C1515]"
                        >
                          {attempt.activityName}
                        </Link>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          attempt.mode === 1 ? 'bg-blue-100 text-blue-800' :
                          attempt.mode === 2 ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {modeLabels[attempt.mode]}
                        </span>
                        {attempt.passed !== null && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{attempt.groupName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Started: {new Date(attempt.startedAt).toLocaleDateString()}</span>
                        {attempt.completedAt && (
                          <span>Completed: {new Date(attempt.completedAt).toLocaleDateString()}</span>
                        )}
                        <span>Time: {formatTime(attempt.timeSpent)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {attempt.score !== null ? (
                        <>
                          <p className={`text-3xl font-bold ${
                            attempt.score >= 70 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.round(attempt.score)}%
                          </p>
                          <p className="text-xs text-gray-500">Score</p>
                        </>
                      ) : (
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          attempt.status === 'completed' ? 'bg-green-100 text-green-800' :
                          attempt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {attempt.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
