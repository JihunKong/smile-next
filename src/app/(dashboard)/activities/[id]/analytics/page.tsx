'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface OverviewData {
  total_questions: number
  total_students: number
  average_quality: string
  total_responses: number
}

interface QualityDistribution {
  level: number
  count: number
}

interface StudentPerformanceData {
  student_name: string
  student_id: string
  question_count: number
  avg_quality: string
  responses_received: number
  avg_level: string
  answers_given: number
  level_distribution: {
    L1: number
    L2: number
    L3: number
    L4: number
    L5: number
    L6: number
  }
}

interface ActivityInfo {
  id: string
  name: string
  group_name: string
}

export default function ActivityAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const activityId = params.id as string

  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [qualityDistribution, setQualityDistribution] = useState<QualityDistribution[]>([])
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformanceData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [activityId])

  async function loadAnalytics() {
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

      // Fetch analytics data
      const [overviewRes, qualityRes, performanceRes] = await Promise.all([
        fetch(`/api/analytics/activity/${activityId}/overview`),
        fetch(`/api/analytics/activity/${activityId}/quality-distribution`),
        fetch(`/api/analytics/activity/${activityId}/student-performance`),
      ])

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json()
        setOverview(overviewData)
      }

      if (qualityRes.ok) {
        const qualityData = await qualityRes.json()
        setQualityDistribution(qualityData)
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json()
        setStudentPerformance(performanceData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function generateInsights() {
    const insights: { icon: string; color: string; text: string }[] = []

    if (!overview) return insights

    // Engagement insights
    if (overview.total_students > 0) {
      const questionsPerStudent = (overview.total_questions / overview.total_students).toFixed(1)
      insights.push({
        icon: 'fas fa-users',
        color: 'text-blue-600',
        text: `${overview.total_students} students are actively participating with an average of ${questionsPerStudent} questions each.`,
      })
    }

    // Quality insights
    const avgQuality = parseFloat(overview.average_quality) || 0
    if (avgQuality > 0) {
      if (avgQuality >= 4.0) {
        insights.push({
          icon: 'fas fa-star',
          color: 'text-green-600',
          text: `Excellent question quality! Average rating of ${overview.average_quality}/5 indicates strong student understanding.`,
        })
      } else if (avgQuality >= 3.0) {
        insights.push({
          icon: 'fas fa-chart-line',
          color: 'text-yellow-600',
          text: `Good progress with ${overview.average_quality}/5 average quality. Consider providing feedback to help students improve.`,
        })
      } else {
        insights.push({
          icon: 'fas fa-exclamation-triangle',
          color: 'text-red-600',
          text: `Students may need additional support. Average quality of ${overview.average_quality}/5 suggests room for improvement.`,
        })
      }
    }

    // Performance insights
    if (studentPerformance.length > 0) {
      const topPerformer = studentPerformance[0]
      insights.push({
        icon: 'fas fa-trophy',
        color: 'text-purple-600',
        text: `${topPerformer.student_name} is leading with ${topPerformer.question_count} questions and ${topPerformer.avg_quality}/5 average quality.`,
      })

      if (studentPerformance.length >= 3) {
        const activeStudents = studentPerformance.filter((s) => s.question_count >= 3).length
        const percentage = Math.round((activeStudents / studentPerformance.length) * 100)
        insights.push({
          icon: 'fas fa-chart-pie',
          color: 'text-indigo-600',
          text: `${percentage}% of students (${activeStudents}/${studentPerformance.length}) are highly engaged with 3+ questions.`,
        })
      }
    }

    // Default insight if no data
    if (insights.length === 0) {
      insights.push({
        icon: 'fas fa-info-circle',
        color: 'text-gray-600',
        text: 'Activity is just getting started. Encourage students to create their first questions!',
      })
    }

    return insights
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Analytics...</h3>
            <p className="text-gray-600">Fetching activity data</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Analytics</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href={`/activities/${activityId}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
            >
              Back to Activity
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const insights = generateInsights()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/static/smileq-logo.svg" alt="SMILE Logo" className="h-10 w-auto" />
              <span className="ml-3 text-xl font-bold text-gray-800">Activity Analytics</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center">
                <i className="fas fa-tachometer-alt mr-2"></i>Dashboard
              </Link>
              <Link href="/activities" className="text-gray-600 hover:text-blue-600 flex items-center">
                <i className="fas fa-tasks mr-2"></i>Activities
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Activity Analytics</h1>
              <p className="mt-2 text-gray-600">
                {activity?.name} - {activity?.group_name}
              </p>
            </div>
            <Link
              href={`/activities/${activityId}`}
              className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Activity
            </Link>
          </div>
        </div>

        {/* Activity Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview?.total_questions || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <i className="fas fa-question text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{overview?.total_students || 0}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <i className="fas fa-users text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Quality</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview?.average_quality || '0.0'}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <i className="fas fa-star text-white text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview?.total_responses || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-full">
                <i className="fas fa-comments text-white text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quality Distribution */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-chart-pie mr-2 text-blue-500"></i>
              Question Quality Distribution
            </h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((level) => {
                const data = qualityDistribution.find((q) => q.level === level)
                const count = data?.count || 0
                const total = qualityDistribution.reduce((sum, q) => sum + q.count, 0)
                const percentage = total > 0 ? (count / total) * 100 : 0
                const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6']

                return (
                  <div key={level} className="flex items-center">
                    <div className="w-24 text-sm font-medium text-gray-700">
                      {level} Star{level > 1 ? 's' : ''}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full flex items-center justify-end pr-2"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: colors[level - 1],
                        }}
                      >
                        {count > 0 && (
                          <span className="text-white text-xs font-bold">{count}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm text-gray-600 ml-3">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Student Performance */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i className="fas fa-trophy mr-2 text-green-500"></i>
              Top Student Performance
            </h3>
            <div className="space-y-3">
              {studentPerformance.slice(0, 8).map((student, index) => {
                const avgQuality = parseFloat(student.avg_quality) || 0
                const maxQuality = 5

                return (
                  <div key={student.student_id} className="flex items-center">
                    <div className="w-8 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : index === 1
                              ? 'bg-gray-100 text-gray-800'
                              : index === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 ml-3">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {student.student_name.split(' ')[0]}
                      </div>
                    </div>
                    <div className="w-32 mx-3 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${(avgQuality / maxQuality) * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium text-gray-900">
                      {student.avg_quality}
                    </div>
                  </div>
                )
              })}
              {studentPerformance.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <i className="fas fa-users text-3xl mb-2"></i>
                  <p>No student activity yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student Performance Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <i className="fas fa-graduation-cap mr-2 text-indigo-500"></i>
              Student Performance Rankings
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Detailed performance metrics for all participating students
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Answers
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Bloom Level 1: Remember">
                    L1
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Bloom Level 2: Understand">
                    L2
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Bloom Level 3: Apply">
                    L3
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Bloom Level 4: Analyze">
                    L4
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Bloom Level 5: Evaluate">
                    L5
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" title="Bloom Level 6: Create">
                    L6
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Quality
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                      <i className="fas fa-users text-3xl mb-2"></i>
                      <p>No student activity yet</p>
                      <p className="text-sm">Students haven&apos;t created questions in this activity</p>
                    </td>
                  </tr>
                ) : (
                  studentPerformance.map((student, index) => {
                    const avgQuality = parseFloat(student.avg_quality) || 0
                    const avgLevel = parseFloat(student.avg_level) || 0
                    const levels = student.level_distribution || { L1: 0, L2: 0, L3: 0, L4: 0, L5: 0, L6: 0 }

                    return (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                              index === 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : index === 1
                                  ? 'bg-gray-100 text-gray-800'
                                  : index === 2
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                              {student.student_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.student_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {student.question_count}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            avgLevel >= 4 ? 'bg-green-100 text-green-800' :
                            avgLevel >= 3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {student.avg_level || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {student.answers_given || 0}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                          {levels.L1 || '—'}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                          {levels.L2 || '—'}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                          {levels.L3 || '—'}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                          {levels.L4 || '—'}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                          {levels.L5 || '—'}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-center text-xs text-gray-600">
                          {levels.L6 || '—'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-900 mr-2">
                              {student.avg_quality}
                            </span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                  key={star}
                                  className={`fas fa-star text-sm ${
                                    star <= Math.floor(avgQuality)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                ></i>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Insights */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
            Activity Insights
          </h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <i className={`${insight.icon} ${insight.color} mt-1`}></i>
                <p className="text-sm text-gray-700">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
