'use client'

import { useState, useEffect } from 'react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  level: 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
  category: string
}

interface UserBadge {
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

interface BadgeDisplayProps {
  userId?: string
  showStats?: boolean
  showFeatured?: boolean
  maxRecent?: number
}

const levelColors: Record<string, string> = {
  bronze: 'linear-gradient(135deg, #CD7F32, #B87333)',
  silver: 'linear-gradient(135deg, #C0C0C0, #B8B8B8)',
  gold: 'linear-gradient(135deg, #FFD700, #FFA500)',
  platinum: 'linear-gradient(135deg, #E5E4E2, #D3D3D3)',
}

export default function BadgeDisplay({
  showStats = true,
  showFeatured = true,
  maxRecent = 8,
}: BadgeDisplayProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [stats, setStats] = useState<UserStats>({ totalPoints: 0, level: 1, currentStreak: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadUserBadges()
  }, [])

  async function loadUserBadges() {
    try {
      setLoading(true)
      const res = await fetch('/api/user/badges')
      if (res.ok) {
        const data = await res.json()
        setUserBadges(data.earnedBadges || [])
        if (data.userStats) {
          setStats(data.userStats)
        }
      }
    } catch (error) {
      console.error('Failed to load badges:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateLevelProgress(totalPoints: number, currentLevel: number) {
    let pointsForCurrent = 0
    for (let i = 1; i < currentLevel; i++) {
      pointsForCurrent += 100 + 50 * (i - 1)
    }

    const pointsForNext = pointsForCurrent + (100 + 50 * (currentLevel - 1))
    const currentProgress = totalPoints - pointsForCurrent
    const neededProgress = pointsForNext - pointsForCurrent

    return {
      current: currentProgress,
      needed: neededProgress,
      percentage: (currentProgress / neededProgress) * 100,
    }
  }

  function showBadgeModal(badge: Badge) {
    setSelectedBadge(badge)
    setModalOpen(true)
  }

  function closeBadgeModal() {
    setModalOpen(false)
    setSelectedBadge(null)
  }

  function isNewBadge(earnedAt: Date): boolean {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return new Date(earnedAt) > oneDayAgo
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-5 mb-5 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="flex gap-8 mb-5 p-4 bg-gray-100 rounded-lg">
          <div className="h-12 bg-gray-200 rounded w-20" />
          <div className="h-12 bg-gray-200 rounded w-20" />
          <div className="h-12 bg-gray-200 rounded w-20" />
        </div>
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  const levelProgress = calculateLevelProgress(stats.totalPoints, stats.level)
  const featuredBadges = userBadges.filter((b) => b.isFeatured).slice(0, 3)
  const recentBadges = userBadges.slice(0, maxRecent)

  return (
    <>
      <div className="bg-white rounded-lg shadow p-5 mb-5">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold">
            <i className="fas fa-trophy text-yellow-500 mr-2" /> Achievements
          </h3>
          <a href="/achievements" className="text-sm text-indigo-600 hover:text-indigo-800">
            View All Badges
          </a>
        </div>

        {/* User Stats */}
        {showStats && (
          <div className="flex gap-8 mb-5 p-4 bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalPoints}</div>
              <div className="text-xs text-gray-500 mt-1">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userBadges.length}</div>
              <div className="text-xs text-gray-500 mt-1">Badges Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.currentStreak}</div>
              <div className="text-xs text-gray-500 mt-1">Day Streak</div>
            </div>
            <div className="flex-1 flex items-center gap-2.5">
              <span
                className="px-4 py-1 rounded-full font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
              >
                Level {stats.level}
              </span>
              <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${levelProgress.percentage}%`,
                    background: 'linear-gradient(90deg, #10B981, #059669)',
                  }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {levelProgress.current}/{levelProgress.needed} XP
              </span>
            </div>
          </div>
        )}

        {/* Featured Badges */}
        {showFeatured && (
          <div
            className="flex gap-4 p-4 rounded-lg mb-5"
            style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}
          >
            {[0, 1, 2].map((index) => {
              const featured = featuredBadges[index]
              return featured ? (
                <div
                  key={featured.id}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl cursor-pointer hover:scale-110 transition-transform"
                  style={{ background: featured.badge.color || levelColors[featured.badge.level] }}
                  onClick={() => showBadgeModal(featured.badge)}
                  title={featured.badge.name}
                >
                  <i className={featured.badge.icon} />
                </div>
              ) : (
                <div
                  key={`empty-${index}`}
                  className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center text-amber-400"
                >
                  <i className="fas fa-plus" />
                </div>
              )
            })}
            <div className="text-sm text-gray-700 self-center ml-2.5">Featured Badges</div>
          </div>
        )}

        {/* Recent Badges */}
        <h4 className="mb-3 font-medium">Recent Badges</h4>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-5">
          {recentBadges.length > 0 ? (
            recentBadges.map((userBadge) => (
              <div
                key={userBadge.id}
                className={`text-center cursor-pointer transition-transform hover:scale-110 ${
                  isNewBadge(userBadge.earnedAt) ? 'animate-pulse' : ''
                }`}
                onClick={() => showBadgeModal(userBadge.badge)}
              >
                <div
                  className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white text-xl shadow-md relative"
                  style={{
                    background: userBadge.badge.color || levelColors[userBadge.badge.level],
                  }}
                >
                  <i className={userBadge.badge.icon} />
                  {isNewBadge(userBadge.earnedAt) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="mt-1 text-xs font-semibold truncate max-w-[80px] mx-auto">
                  {userBadge.badge.name}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              <i className="fas fa-award text-4xl text-gray-300 mb-2" />
              <p>No badges earned yet. Start participating to earn badges!</p>
            </div>
          )}
        </div>
      </div>

      {/* Badge Modal */}
      {modalOpen && selectedBadge && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeBadgeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div
                className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white text-4xl shadow-lg mb-4"
                style={{ background: selectedBadge.color || levelColors[selectedBadge.level] }}
              >
                <i className={selectedBadge.icon} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedBadge.name}</h3>
              <p className="text-gray-600 mb-4">{selectedBadge.description}</p>
              <div className="flex justify-center gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {selectedBadge.points} Points
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium uppercase">
                  {selectedBadge.level}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {selectedBadge.category}
                </span>
              </div>
              {userBadges.some((ub) => ub.badge.id === selectedBadge.id) && (
                <div className="text-green-600 font-medium">
                  <i className="fas fa-check-circle mr-1" /> You have earned this badge!
                </div>
              )}
            </div>
            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={closeBadgeModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
