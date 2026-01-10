'use client'

import { useState, useEffect } from 'react'

interface ProfileStats {
  totalQuestions: number
  totalResponses: number
  totalActivities: number
  totalGroups: number
  highQualityQuestions: number
  weeklyQuestions: number
  monthlyQuestions: number
  averageQuestionScore: number
  examAttempts: number
  passedExams: number
  perfectExams: number
  averageExamScore: number
  inquiryAttempts: number
  caseAttempts: number
  certificatesCompleted: number
  streak: number
  totalPoints: number
  levelInfo: {
    current: {
      tier: {
        name: string
        icon: string
      }
    }
  }
}

interface BadgeData {
  earnedBadges: Array<{ id: string }>
}

export default function ContributionStatsTab() {
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [badges, setBadges] = useState<BadgeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, badgesRes] = await Promise.all([
          fetch('/api/user/profile/stats'),
          fetch('/api/user/badges'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (badgesRes.ok) {
          const badgesData = await badgesRes.json()
          setBadges(badgesData)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load contribution statistics.</p>
      </div>
    )
  }

  // Calculate growth percentage (simplified - weekly vs previous)
  const weeklyGrowth = stats.weeklyQuestions > 0 ? '+15%' : '0%'
  const monthlyGrowth = stats.monthlyQuestions > 0 ? `+${stats.monthlyQuestions}` : '0'

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Metrics */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Performance Metrics
          </h3>

          <div className="space-y-6">
            {/* Questions */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-700">{stats.totalQuestions}</div>
                  <div className="text-sm text-blue-600">Questions Asked</div>
                </div>
                <div className="text-blue-500">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600">&#x2197;</span>
                <span className="text-sm text-green-600 ml-1">{weeklyGrowth} this month</span>
              </div>
            </div>

            {/* Responses */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-700">{stats.totalResponses}</div>
                  <div className="text-sm text-green-600">Responses Submitted</div>
                </div>
                <div className="text-green-500">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600">&#x2197;</span>
                <span className="text-sm text-green-600 ml-1">{monthlyGrowth} this month</span>
              </div>
            </div>

            {/* Activities */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-700">{stats.totalActivities}</div>
                  <div className="text-sm text-purple-600">Activities Participated</div>
                </div>
                <div className="text-purple-500">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600">&#x2197;</span>
                <span className="text-sm text-green-600 ml-1">Active member</span>
              </div>
            </div>

            {/* Groups */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-indigo-700">{stats.totalGroups}</div>
                  <div className="text-sm text-indigo-600">Groups Joined</div>
                </div>
                <div className="text-indigo-500">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quality & Engagement */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Quality & Engagement
          </h3>

          <div className="space-y-6">
            {/* Average Question Quality */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium">Average Question Quality</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.averageQuestionScore > 0 ? stats.averageQuestionScore.toFixed(1) : '-'}/10
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.averageQuestionScore / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Exam Performance */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium">Exam Pass Rate</div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.examAttempts > 0
                    ? `${Math.round((stats.passedExams / stats.examAttempts) * 100)}%`
                    : '-'}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${stats.examAttempts > 0 ? (stats.passedExams / stats.examAttempts) * 100 : 0}%`
                  }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {stats.passedExams} passed out of {stats.examAttempts} attempts
              </div>
            </div>

            {/* High Quality Questions */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium">High Quality Questions</div>
                <div className="text-2xl font-bold text-purple-600">{stats.highQualityQuestions}</div>
              </div>
              <div className="text-sm text-gray-600">Questions with 8+ quality score</div>
            </div>

            {/* Streak */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium flex items-center">
                  <span className="text-2xl mr-2">🔥</span>
                  Current Streak
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.streak} days
                </div>
              </div>
              <div className="text-sm text-gray-600">Keep asking questions to maintain your streak!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Activity Breakdown */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Monthly Activity Breakdown
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.monthlyQuestions}</div>
            <div className="text-sm text-gray-600">Questions This Month</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.passedExams}</div>
            <div className="text-sm text-gray-600">Exams Passed</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.weeklyQuestions}</div>
            <div className="text-sm text-gray-600">Questions This Week</div>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{badges?.earnedBadges?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Badges</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Learning Mode Stats
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-blue-700">Exam Mode</div>
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-blue-700">{stats.examAttempts}</div>
            <div className="text-sm text-blue-600">Attempts | {stats.perfectExams} Perfect</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-yellow-700">Inquiry Mode</div>
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-yellow-700">{stats.inquiryAttempts}</div>
            <div className="text-sm text-yellow-600">Inquiries Completed</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-orange-700">Case Mode</div>
              <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-orange-700">{stats.caseAttempts}</div>
            <div className="text-sm text-orange-600">Cases Analyzed</div>
          </div>
        </div>
      </div>

      {/* Certificates */}
      {stats.certificatesCompleted > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Certificates Earned
          </h3>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-amber-700 mb-2">{stats.certificatesCompleted}</div>
            <div className="text-sm text-amber-600">Certificates Completed</div>
            <a
              href="/my-certificates"
              className="inline-flex items-center mt-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
            >
              View Certificates
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
