'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface JourneyMilestone {
  id: string
  title: string
  description: string
  date: string
  type: 'question' | 'achievement' | 'level_up' | 'high_quality' | 'first_response'
  metadata?: {
    questionId?: string
    score?: number
    bloomsLevel?: string
    badgeName?: string
    level?: string
  }
}

interface JourneyStats {
  totalQuestions: number
  highQualityQuestions: number
  averageScore: number
  bloomsDistribution: { level: string; count: number }[]
  topicsExplored: string[]
  streak: number
  bestStreak: number
}

export default function InquiryJourneyTab() {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([])
  const [stats, setStats] = useState<JourneyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchJourneyData = async () => {
      try {
        const [timelineRes, statsRes] = await Promise.all([
          fetch('/api/user/profile/timeline'),
          fetch('/api/user/profile/stats'),
        ])

        if (timelineRes.ok) {
          const timelineData = await timelineRes.json()
          // Transform timeline events to milestones
          const transformedMilestones: JourneyMilestone[] = (timelineData.events || []).slice(0, 20).map((event: {
            id: string
            type: string
            title: string
            description: string
            createdAt: string
            metadata?: {
              questionId?: string
              score?: number
              bloomsLevel?: string
              badgeName?: string
            }
          }) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.createdAt,
            type: event.type as JourneyMilestone['type'],
            metadata: event.metadata,
          }))
          setMilestones(transformedMilestones)
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats({
            totalQuestions: statsData.totalQuestions || 0,
            highQualityQuestions: statsData.highQualityQuestions || 0,
            averageScore: statsData.averageScore || 0,
            bloomsDistribution: statsData.bloomsDistribution || [],
            topicsExplored: statsData.topicsExplored || [],
            streak: statsData.streak || 0,
            bestStreak: statsData.bestStreak || 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch journey data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJourneyData()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'achievement':
        return (
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        )
      case 'level_up':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        )
      case 'high_quality':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-gray-200 rounded-xl"></div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Journey Header */}
      <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Learning Journey</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore your intellectual growth through questions, discoveries, and achievements over time
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-700">{stats.totalQuestions}</div>
            <div className="text-sm text-blue-600">Questions Asked</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-700">{stats.highQualityQuestions}</div>
            <div className="text-sm text-green-600">High Quality (8+)</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-700">{stats.averageScore.toFixed(1)}</div>
            <div className="text-sm text-purple-600">Average Score</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-700">{stats.streak}</div>
            <div className="text-sm text-orange-600">Day Streak</div>
          </div>
        </div>
      )}

      {/* Bloom's Distribution */}
      {stats && stats.bloomsDistribution.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Bloom&apos;s Taxonomy Distribution
          </h3>
          <div className="space-y-3">
            {stats.bloomsDistribution.map((item) => {
              const total = stats.bloomsDistribution.reduce((sum, i) => sum + i.count, 0)
              const percentage = total > 0 ? (item.count / total) * 100 : 0
              const colors: Record<string, string> = {
                remember: 'bg-gray-400',
                understand: 'bg-blue-400',
                apply: 'bg-green-400',
                analyze: 'bg-yellow-400',
                evaluate: 'bg-orange-400',
                create: 'bg-purple-400',
              }
              return (
                <div key={item.level}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium">{item.level}</span>
                    <span className="text-gray-600">{item.count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors[item.level.toLowerCase()] || 'bg-gray-400'} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-6 flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Journey Timeline
        </h3>

        {milestones.length > 0 ? (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative flex gap-4">
                  <div className="relative z-10">
                    {getTypeIcon(milestone.type)}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                        {milestone.metadata?.score && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            Score: {milestone.metadata.score.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {formatDate(milestone.date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Your Journey Awaits</h4>
            <p className="text-gray-600 mb-4">
              Start asking questions to begin tracking your learning journey!
            </p>
            <Link
              href="/groups"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Explore Groups
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
