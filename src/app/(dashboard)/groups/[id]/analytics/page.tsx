'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoadingState } from '@/components/ui'

interface GroupAnalytics {
  group: {
    id: string
    name: string
    memberCount: number
    activityCount: number
    createdAt: string
  }
  overview: {
    totalQuestions: number
    totalResponses: number
    averageScore: number | null
    totalExamAttempts: number
    totalInquiryAttempts: number
    totalCaseAttempts: number
  }
  memberActivity: Array<{
    userId: string
    userName: string
    questionsCreated: number
    responsesGiven: number
    examsTaken: number
    averageScore: number | null
    lastActive: string | null
  }>
  activityPerformance: Array<{
    activityId: string
    activityName: string
    mode: number
    participantCount: number
    averageScore: number | null
    completionRate: number | null
  }>
  weeklyTrends: Array<{
    week: string
    questions: number
    responses: number
    examsTaken: number
  }>
}

export default function GroupAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activities'>('overview')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/analytics`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        } else if (response.status === 403) {
          router.push('/groups')
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchAnalytics()
    }
  }, [session, groupId, router])

  if (isLoading) {
    return <LoadingState fullPage message="Loading analytics..." />
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Analytics not available.</p>
      </div>
    )
  }

  const modeLabels: Record<number, string> = {
    0: 'Open',
    1: 'Exam',
    2: 'Inquiry',
    3: 'Case',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/groups/${groupId}`}
            className="text-[#8C1515] hover:underline text-sm mb-2 inline-block"
          >
            &larr; Back to Group
          </Link>
          <h1 className="text-2xl font-bold text-[#2E2D29]">{analytics.group.name} Analytics</h1>
          <p className="text-gray-500 mt-1">
            {analytics.group.memberCount} members | {analytics.group.activityCount} activities
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Questions</p>
            <p className="text-2xl font-bold text-[#2E2D29]">{analytics.overview.totalQuestions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Responses</p>
            <p className="text-2xl font-bold text-[#2E2D29]">{analytics.overview.totalResponses}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Avg Score</p>
            <p className="text-2xl font-bold text-[#2E2D29]">
              {analytics.overview.averageScore !== null ? `${Math.round(analytics.overview.averageScore)}%` : '-'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Exams</p>
            <p className="text-2xl font-bold text-[#2E2D29]">{analytics.overview.totalExamAttempts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Inquiries</p>
            <p className="text-2xl font-bold text-[#2E2D29]">{analytics.overview.totalInquiryAttempts}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Cases</p>
            <p className="text-2xl font-bold text-[#2E2D29]">{analytics.overview.totalCaseAttempts}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'members', 'activities'] as const).map((tab) => (
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
              <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Weekly Trends</h2>
              {analytics.weeklyTrends.length === 0 ? (
                <p className="text-gray-500">No trend data available yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Week</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Questions</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Responses</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">Exams</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.weeklyTrends.map((week, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 text-sm text-gray-900">{week.week}</td>
                          <td className="py-3 text-sm text-gray-600">{week.questions}</td>
                          <td className="py-3 text-sm text-gray-600">{week.responses}</td>
                          <td className="py-3 text-sm text-gray-600">{week.examsTaken}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="overflow-x-auto">
              {analytics.memberActivity.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No member activity data.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exams</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.memberActivity.map((member) => (
                      <tr key={member.userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {member.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {member.questionsCreated}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {member.responsesGiven}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {member.examsTaken}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {member.averageScore !== null ? (
                            <span className={member.averageScore >= 70 ? 'text-green-600' : 'text-red-600'}>
                              {Math.round(member.averageScore)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="divide-y divide-gray-200">
              {analytics.activityPerformance.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No activity performance data.</p>
                </div>
              ) : (
                analytics.activityPerformance.map((activity) => (
                  <div key={activity.activityId} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/activities/${activity.activityId}/results`}
                          className="text-lg font-medium text-[#2E2D29] hover:text-[#8C1515]"
                        >
                          {activity.activityName}
                        </Link>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {modeLabels[activity.mode] || 'Unknown'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {activity.participantCount} participants
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#8C1515]">
                          {activity.averageScore !== null ? `${Math.round(activity.averageScore)}%` : '-'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.completionRate !== null ? `${Math.round(activity.completionRate)}% completed` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
