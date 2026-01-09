'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface BadgeDefinition {
  id: string
  name: string
  description: string
  points: number
  category: 'participation' | 'milestone' | 'quality' | 'special'
  requirement: string
}

interface BadgeStats {
  totalEarned: number
  totalAvailable: number
  totalPoints: number
  totalPossiblePoints: number
  earnedBadges: string[]
  levelInfo: {
    current: {
      tier: {
        name: string
        icon: string
        color: string
      }
    } | null
    pointsToNext: number
    isMaxTier: boolean
  }
}

// Badge definitions - these would come from config/database in production
const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Participation badges
  { id: 'first_question', name: 'First Question', description: 'Create your first question', points: 10, category: 'participation', requirement: 'Create 1 question' },
  { id: 'first_response', name: 'First Response', description: 'Submit your first response', points: 10, category: 'participation', requirement: 'Submit 1 response' },
  { id: 'group_joiner', name: 'Group Joiner', description: 'Join your first group', points: 15, category: 'participation', requirement: 'Join 1 group' },
  { id: 'active_participant', name: 'Active Participant', description: 'Submit 10 responses', points: 25, category: 'participation', requirement: 'Submit 10 responses' },

  // Milestone badges
  { id: 'question_creator_10', name: 'Question Creator', description: 'Create 10 questions', points: 30, category: 'milestone', requirement: 'Create 10 questions' },
  { id: 'question_master_50', name: 'Question Master', description: 'Create 50 questions', points: 50, category: 'milestone', requirement: 'Create 50 questions' },
  { id: 'century_questions', name: 'Century Club', description: 'Create 100 questions', points: 100, category: 'milestone', requirement: 'Create 100 questions' },
  { id: 'response_pro', name: 'Response Pro', description: 'Submit 50 responses', points: 50, category: 'milestone', requirement: 'Submit 50 responses' },

  // Quality badges
  { id: 'quality_first', name: 'Quality First', description: 'Get your first 4+ star rating', points: 20, category: 'quality', requirement: 'Receive a 4+ star rating' },
  { id: 'excellence', name: 'Excellence', description: 'Get 5 questions with 4+ star ratings', points: 40, category: 'quality', requirement: 'Get 5 high-quality questions' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Get a perfect 5-star rating', points: 60, category: 'quality', requirement: 'Receive a perfect rating' },
  { id: 'consistent_quality', name: 'Consistent Quality', description: 'Maintain 4+ avg rating over 10 questions', points: 80, category: 'quality', requirement: 'Average 4+ stars over 10 questions' },

  // Special badges
  { id: 'exam_ace', name: 'Exam Ace', description: 'Pass an exam with 90%+ score', points: 40, category: 'special', requirement: 'Score 90%+ on an exam' },
  { id: 'certificate_holder', name: 'Certificate Holder', description: 'Complete a certificate program', points: 100, category: 'special', requirement: 'Complete a certificate' },
  { id: 'streak_master', name: 'Streak Master', description: 'Maintain a 7-day activity streak', points: 50, category: 'special', requirement: 'Activity for 7 consecutive days' },
  { id: 'early_adopter', name: 'Early Adopter', description: 'Join SMILE in the first year', points: 200, category: 'special', requirement: 'Account created before 2026' },
]

const categoryIcons: Record<string, string> = {
  participation: 'fa-bullseye',
  milestone: 'fa-chart-line',
  quality: 'fa-star',
  special: 'fa-gift',
}

const categoryLabels: Record<string, string> = {
  participation: 'Participation Badges',
  milestone: 'Milestone Badges',
  quality: 'Quality Badges',
  special: 'Special Badges',
}

export default function AchievementsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BadgeStats>({
    totalEarned: 0,
    totalAvailable: BADGE_DEFINITIONS.length,
    totalPoints: 0,
    totalPossiblePoints: BADGE_DEFINITIONS.reduce((sum, b) => sum + b.points, 0),
    earnedBadges: [],
    levelInfo: {
      current: null,
      pointsToNext: 0,
      isMaxTier: false,
    },
  })

  useEffect(() => {
    if (status === 'authenticated') {
      loadBadgeStats()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  async function loadBadgeStats() {
    try {
      setLoading(true)
      // TODO: Fetch actual badge data from API when Badge model is implemented
      // For now, use placeholder data

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Placeholder stats - in production, fetch from /api/user/badges
      setStats({
        totalEarned: 0,
        totalAvailable: BADGE_DEFINITIONS.length,
        totalPoints: 0,
        totalPossiblePoints: BADGE_DEFINITIONS.reduce((sum, b) => sum + b.points, 0),
        earnedBadges: [],
        levelInfo: {
          current: {
            tier: {
              name: 'Newcomer',
              icon: '🌱',
              color: '#6b7280',
            },
          },
          pointsToNext: 100,
          isMaxTier: false,
        },
      })
    } catch (error) {
      console.error('Failed to load badge stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const badgesByCategory = BADGE_DEFINITIONS.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = []
    acc[badge.category].push(badge)
    return acc
  }, {} as Record<string, BadgeDefinition[]>)

  const progressPercentage = stats.totalAvailable > 0
    ? Math.round((stats.totalEarned / stats.totalAvailable) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">SMILE Badge Library</h1>
              <p className="text-blue-100">Discover all available badges and track your progress</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.totalEarned}/{stats.totalAvailable}</div>
              <div className="text-sm text-blue-100">Badges Earned</div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-yellow-500 mr-4">
                <i className="fas fa-trophy"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalEarned}</div>
                <div className="text-sm text-gray-500">Badges Earned</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-blue-500 mr-4">
                <i className="fas fa-star"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalPoints}</div>
                <div className="text-sm text-gray-500">SMILE Points</div>
                {stats.levelInfo.current && (
                  <div className="text-xs mt-1 flex items-center">
                    <span style={{ color: stats.levelInfo.current.tier.color }}>
                      {stats.levelInfo.current.tier.icon}
                    </span>
                    <span className="ml-1 text-gray-600">
                      {stats.levelInfo.current.tier.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-green-500 mr-4">
                <i className="fas fa-chart-pie"></i>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{progressPercentage}%</div>
                <div className="text-sm text-gray-500">Badge Progress</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-purple-500 mr-4">
                <i className="fas fa-bullseye"></i>
              </div>
              <div>
                {stats.levelInfo.pointsToNext > 0 && !stats.levelInfo.isMaxTier ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats.levelInfo.pointsToNext}</div>
                    <div className="text-sm text-gray-500">To Next Tier</div>
                  </>
                ) : stats.levelInfo.isMaxTier ? (
                  <>
                    <div className="text-2xl font-bold text-yellow-600">
                      <i className="fas fa-crown"></i>
                    </div>
                    <div className="text-sm text-gray-500">Max Tier</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">-</div>
                    <div className="text-sm text-gray-500">Tier Progress</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Badge Categories */}
        {Object.entries(badgesByCategory).map(([category, badges]) => (
          <div key={category} className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 capitalize flex items-center">
                <i className={`fas ${categoryIcons[category]} mr-2 text-indigo-600`}></i>
                {categoryLabels[category]}
                <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {badges.length} badges
                </span>
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {badges.map(badge => {
                  const isEarned = stats.earnedBadges.includes(badge.id)
                  return (
                    <div
                      key={badge.id}
                      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                        isEarned
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-2xl">
                          {isEarned ? (
                            <span className="text-green-600">
                              <i className="fas fa-check-circle"></i>
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              <i className="fas fa-lock"></i>
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${isEarned ? 'text-green-700' : 'text-gray-600'}`}>
                            {badge.points}
                          </div>
                          <div className="text-xs text-gray-500">points</div>
                        </div>
                      </div>

                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{badge.name}</h3>
                      </div>

                      <p className="text-xs text-gray-600 mb-3">{badge.description}</p>

                      {isEarned ? (
                        <div className="flex items-center text-xs text-green-600">
                          <i className="fas fa-check-circle mr-1"></i>
                          <span>Earned!</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-500">
                          <i className="fas fa-lock mr-1"></i>
                          <span>Not earned yet</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Summary Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            <i className="fas fa-chart-bar mr-2 text-indigo-600"></i>
            Badge Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Points Distribution</h3>
              <div className="space-y-2">
                {[
                  { range: '10-25 points', min: 10, max: 25, color: 'gray' },
                  { range: '30-50 points', min: 30, max: 50, color: 'blue' },
                  { range: '60-100 points', min: 60, max: 100, color: 'green' },
                  { range: '120-200 points', min: 120, max: 200, color: 'purple' },
                ].map(({ range, min, max, color }) => {
                  const count = BADGE_DEFINITIONS.filter(
                    b => b.points >= min && b.points <= max
                  ).length
                  return (
                    <div key={range} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{range}</span>
                      <span className={`text-sm font-medium text-${color}-600`}>
                        {count} badges
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Your Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total badges available:</span>
                  <span className="text-sm font-medium">{stats.totalAvailable}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Badges you&apos;ve earned:</span>
                  <span className="text-sm font-medium text-green-600">{stats.totalEarned}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your SMILE points:</span>
                  <span className="text-sm font-medium text-blue-600">{stats.totalPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Maximum possible points:</span>
                  <span className="text-sm font-medium">{stats.totalPossiblePoints}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-medium">{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white rounded-md hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#4f46e5' }}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
