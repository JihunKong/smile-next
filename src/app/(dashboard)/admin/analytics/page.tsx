'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PlatformAnalytics {
  users: {
    total: number
    active: number
    newThisWeek: number
    newThisMonth: number
    byRole: { role: string; count: number }[]
  }
  activities: {
    total: number
    byMode: { mode: string; count: number }[]
    publishedCount: number
    draftCount: number
  }
  engagement: {
    totalQuestions: number
    totalResponses: number
    totalExamAttempts: number
    totalCaseAttempts: number
    totalInquiryAttempts: number
    avgQuestionsPerActivity: number
  }
  certificates: {
    total: number
    active: number
    pending: number
    enrollments: number
    completions: number
  }
  weeklyActivity: {
    week: string
    users: number
    activities: number
    responses: number
  }[]
}

export default function AdminAnalyticsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')

  // Check if user is admin
  const isAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 1

  useEffect(() => {
    if (session && isAdmin) {
      loadAnalytics()
    }
  }, [session, isAdmin, dateRange])

  async function loadAnalytics() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/admin/analytics?range=${dateRange}`)
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to load analytics')
      }

      const data = await res.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Admin privileges required.</p>
          <Link href="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const modeLabels: Record<string, string> = {
    '0': 'Open',
    '1': 'Exam',
    '2': 'Inquiry',
    '3': 'Case',
  }

  const roleLabels: Record<string, string> = {
    '0': 'Super Admin',
    '1': 'Admin',
    '2': 'Teacher',
    '3': 'Student',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-indigo-600 hover:underline text-sm mb-2 inline-block"
          >
            &larr; Back to Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
              <p className="text-gray-600 mt-1">Overview of platform usage and engagement</p>
            </div>
            <div className="flex items-center gap-2">
              {(['week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    dateRange === range
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  style={dateRange === range ? { backgroundColor: '#4f46e5', color: '#ffffff' } : undefined}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.users.total.toLocaleString()}</p>
                <p className="text-sm text-green-600 mt-2">
                  +{analytics.users.newThisWeek} this week
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 mb-1">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.users.active.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {((analytics.users.active / analytics.users.total) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 mb-1">Total Activities</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.activities.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {analytics.activities.publishedCount} published
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 mb-1">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.engagement.totalResponses.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {analytics.engagement.totalQuestions.toLocaleString()} questions
                </p>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Mode</h3>
                <p className="text-4xl font-bold text-indigo-600">
                  {analytics.engagement.totalExamAttempts.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total attempts</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Mode</h3>
                <p className="text-4xl font-bold text-purple-600">
                  {analytics.engagement.totalCaseAttempts.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total attempts</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquiry Mode</h3>
                <p className="text-4xl font-bold text-green-600">
                  {analytics.engagement.totalInquiryAttempts.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total attempts</p>
              </div>
            </div>

            {/* Users by Role & Activities by Mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Users by Role */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
                <div className="space-y-3">
                  {analytics.users.byRole.map((item) => {
                    const percentage = (item.count / analytics.users.total) * 100
                    return (
                      <div key={item.role}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">
                            {roleLabels[item.role] || item.role}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: '#4f46e5' }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Activities by Mode */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activities by Mode</h3>
                <div className="space-y-3">
                  {analytics.activities.byMode.map((item) => {
                    const percentage = (item.count / analytics.activities.total) * 100
                    const colors: Record<string, string> = {
                      '0': '#6366f1',
                      '1': '#f59e0b',
                      '2': '#10b981',
                      '3': '#8b5cf6',
                    }
                    return (
                      <div key={item.mode}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">
                            {modeLabels[item.mode] || item.mode}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: colors[item.mode] || '#6366f1' }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Certificate Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Programs</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{analytics.certificates.total}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Programs</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{analytics.certificates.active}</p>
                  <p className="text-sm text-gray-500 mt-1">Active</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{analytics.certificates.pending}</p>
                  <p className="text-sm text-gray-500 mt-1">Pending Approval</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{analytics.certificates.enrollments}</p>
                  <p className="text-sm text-gray-500 mt-1">Enrollments</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{analytics.certificates.completions}</p>
                  <p className="text-sm text-gray-500 mt-1">Completions</p>
                </div>
              </div>
            </div>

            {/* Weekly Activity Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity Trends</h3>
              {analytics.weeklyActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No trend data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Week</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">New Users</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Activities Created</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-500">Responses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.weeklyActivity.map((week, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 text-sm text-gray-900">{week.week}</td>
                          <td className="py-3 text-sm text-gray-600">{week.users}</td>
                          <td className="py-3 text-sm text-gray-600">{week.activities}</td>
                          <td className="py-3 text-sm text-gray-600">{week.responses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
