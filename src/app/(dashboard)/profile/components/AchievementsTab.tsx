'use client'

import { useState, useEffect } from 'react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  level: 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
  category: string
}

interface EarnedBadge {
  id: string
  badge: Badge
  earnedAt: Date
  isFeatured: boolean
}

interface UserStats {
  totalPoints: number
  level: number
  currentStreak: number
}

interface BadgeProgress {
  id: string
  name: string
  description: string
  icon: string
  current: number
  target: number
  category: string
}

const BADGE_PROGRESS: BadgeProgress[] = [
  { id: 'momentum-builder', name: 'Momentum Builder', description: 'Ask 25 questions', icon: '🚀', current: 0, target: 25, category: 'Questions' },
  { id: 'analytics-pro', name: 'Analytics Pro', description: 'Create 10 activities', icon: '📈', current: 0, target: 10, category: 'Activities' },
  { id: 'streak-legend', name: 'Streak Legend', description: '30-day question streak', icon: '🔥', current: 7, target: 30, category: 'Engagement' },
  { id: 'community-leader', name: 'Community Leader', description: 'Create 5 groups', icon: '👑', current: 0, target: 5, category: 'Community' },
]

const BADGE_LEVEL_COLORS = {
  bronze: { bg: 'from-amber-400 to-amber-600', text: 'text-amber-800', border: 'border-amber-300' },
  silver: { bg: 'from-gray-300 to-gray-500', text: 'text-gray-700', border: 'border-gray-300' },
  gold: { bg: 'from-yellow-400 to-yellow-600', text: 'text-yellow-800', border: 'border-yellow-400' },
  platinum: { bg: 'from-purple-400 to-indigo-600', text: 'text-purple-900', border: 'border-purple-400' },
}

const CATEGORIES = ['All', 'Questions', 'Responses', 'Exams', 'Community', 'Engagement', 'Certificates', 'Special']

export default function AchievementsTab() {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([])
  const [allBadges, setAllBadges] = useState<Badge[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [profileStats, setProfileStats] = useState<{
    totalQuestions: number
    totalActivities: number
    totalGroups: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedBadge, setSelectedBadge] = useState<EarnedBadge | Badge | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [badgesRes, statsRes] = await Promise.all([
          fetch('/api/user/badges'),
          fetch('/api/user/profile/stats'),
        ])

        if (badgesRes.ok) {
          const data = await badgesRes.json()
          setEarnedBadges(data.earnedBadges || [])
          setAllBadges(data.allBadges || [])
          setUserStats(data.userStats || null)
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setProfileStats({
            totalQuestions: statsData.totalQuestions,
            totalActivities: statsData.totalActivities,
            totalGroups: statsData.totalGroups,
          })
        }
      } catch (error) {
        console.error('Failed to fetch achievements:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const earnedBadgeIds = new Set(earnedBadges.map(eb => eb.id))

  const filteredEarnedBadges = selectedCategory === 'All'
    ? earnedBadges
    : earnedBadges.filter(eb => eb.badge?.category === selectedCategory)

  const filteredLockedBadges = selectedCategory === 'All'
    ? allBadges.filter(b => !earnedBadgeIds.has(b.id))
    : allBadges.filter(b => !earnedBadgeIds.has(b.id) && b.category === selectedCategory)

  // Update badge progress with actual stats
  const badgeProgress = BADGE_PROGRESS.map(bp => ({
    ...bp,
    current: bp.id === 'momentum-builder' ? (profileStats?.totalQuestions || 0) :
             bp.id === 'analytics-pro' ? (profileStats?.totalActivities || 0) :
             bp.id === 'community-leader' ? (profileStats?.totalGroups || 0) :
             bp.current,
  }))

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-[#8C1515] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Badges Earned */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Badges Earned ({earnedBadges.length})
          </h3>

          {filteredEarnedBadges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredEarnedBadges.map((earned) => {
                const colors = BADGE_LEVEL_COLORS[earned.badge?.level || 'bronze']
                return (
                  <button
                    key={earned.id}
                    onClick={() => setSelectedBadge(earned)}
                    className={`bg-gradient-to-br ${colors.bg} p-4 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
                  >
                    <div className="text-3xl mb-2">&#127942;</div>
                    <div className={`font-bold text-sm ${colors.text}`}>
                      {earned.badge?.name}
                    </div>
                    <div className={`text-xs ${colors.text} opacity-80`}>
                      {earned.badge?.description}
                    </div>
                    <div className={`text-xs ${colors.text} opacity-60 mt-2`}>
                      +{earned.badge?.points} pts
                    </div>
                    {earned.isFeatured && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white bg-opacity-30 text-white">
                          ⭐ Featured
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <div className="text-6xl mb-4">&#127942;</div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">
                {selectedCategory === 'All' ? 'No badges yet!' : `No ${selectedCategory} badges yet!`}
              </h4>
              <p className="text-gray-600 mb-4">Start creating questions to earn your first badge.</p>
              <a
                href="/groups"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Question
              </a>
            </div>
          )}
        </div>

        {/* Badges in Progress */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Badges in Progress ({badgeProgress.length})
          </h3>

          <div className="space-y-4">
            {badgeProgress.map((badge) => {
              const progress = Math.min((badge.current / badge.target) * 100, 100)
              const colors = ['blue', 'green', 'orange', 'purple']
              const color = colors[badgeProgress.indexOf(badge) % colors.length]

              return (
                <div key={badge.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{badge.icon}</div>
                      <div>
                        <div className="font-medium">{badge.name}</div>
                        <div className="text-sm text-gray-600">{badge.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium text-${color}-600`}>
                        {badge.current}/{badge.target}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Locked Badges */}
      {filteredLockedBadges.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked Badges ({filteredLockedBadges.length})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredLockedBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="bg-gray-100 p-4 rounded-lg text-center opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-2xl mb-2 grayscale">🔒</div>
                <div className="font-medium text-xs text-gray-600">{badge.name}</div>
                <div className="text-xs text-gray-500 mt-1">+{badge.points} pts</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Browse All Badges Button */}
      <div className="text-center mt-8">
        <a
          href="/achievements"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Browse All Available Badges
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <div className="mt-2 text-sm text-gray-600">
          Discover all 52+ badges you can earn across 10 categories
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Badge Details</h3>
              <button
                onClick={() => setSelectedBadge(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">
                {'badge' in selectedBadge ? '🏆' : '🔒'}
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {'badge' in selectedBadge ? selectedBadge.badge.name : selectedBadge.name}
              </h4>
              <p className="text-gray-600 mb-4">
                {'badge' in selectedBadge ? selectedBadge.badge.description : selectedBadge.description}
              </p>

              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-blue-700 font-medium">
                    +{'badge' in selectedBadge ? selectedBadge.badge.points : selectedBadge.points} pts
                  </span>
                </div>
                <div className="bg-gray-50 px-3 py-1 rounded-full">
                  <span className="text-gray-700">
                    {'badge' in selectedBadge ? selectedBadge.badge.category : selectedBadge.category}
                  </span>
                </div>
              </div>

              {'badge' in selectedBadge && (
                <div className="mt-4 text-sm text-gray-500">
                  Earned: {new Date(selectedBadge.earnedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedBadge(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
