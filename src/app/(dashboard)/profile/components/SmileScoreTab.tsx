'use client'

import { useState, useEffect } from 'react'

interface LevelTier {
  name: string
  icon: string
  minPoints: number
  maxPoints: number | null
  color: string
  description: string
}

interface LevelInfo {
  current: {
    tier: LevelTier
    points: number
  }
  next: LevelTier | null
  pointsToNext: number
  progressPercent: number
  allTiers: LevelTier[]
}

interface PointsBreakdown {
  questions: number
  highQuality: number
  responses: number
  exams: number
  certificates: number
  badges: number
  total: number
}

interface GroupRanking {
  groupId: string
  groupName: string
  rank: number
  totalMembers: number
  questionsInGroup: number
  groupPoints: number
}

interface ProfileStats {
  totalPoints: number
  pointsBreakdown: PointsBreakdown
  levelInfo: LevelInfo
}

interface RankingData {
  globalRank: number
  totalUsers: number
  percentile: number
  groupRankings: GroupRanking[]
}

export default function SmileScoreTab() {
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, rankingRes] = await Promise.all([
          fetch('/api/user/profile/stats'),
          fetch('/api/user/profile/ranking'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (rankingRes.ok) {
          const rankingData = await rankingRes.json()
          setRanking(rankingData)
        }
      } catch (error) {
        console.error('Failed to fetch SMILE score data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load SMILE score data.</p>
      </div>
    )
  }

  const { totalPoints, pointsBreakdown, levelInfo } = stats
  const currentTier = levelInfo?.current?.tier
  const nextTier = levelInfo?.next

  return (
    <div className="space-y-12">
      {/* Global SMILE Score */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Global SMILE Score
        </h3>

        {/* Main Score Display */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-2">Total SMILE Points</div>
              <div className="text-6xl font-bold mb-2">{totalPoints.toLocaleString()}</div>

              {currentTier && (
                <>
                  <div className="text-xl font-semibold">
                    {currentTier.icon} {currentTier.name}
                  </div>
                  <div className="text-sm opacity-90">{currentTier.description}</div>

                  {nextTier ? (
                    <div className="text-xs opacity-75 mt-1">
                      {levelInfo.pointsToNext.toLocaleString()} points to {nextTier.icon} {nextTier.name.split(' ')[1]}
                    </div>
                  ) : (
                    <div className="text-xs opacity-75 mt-1">Maximum Level Achieved!</div>
                  )}
                </>
              )}
            </div>
            <div className="text-right">
              <div className="text-8xl opacity-90">{currentTier?.icon || '✨'}</div>
            </div>
          </div>

          {ranking && (
            <div className="mt-6 pt-6 border-t border-white border-opacity-30">
              <div className="flex items-center justify-between text-sm">
                <div>
                  Global Rank: <span className="font-semibold">#{ranking.globalRank.toLocaleString()}</span> out of {ranking.totalUsers.toLocaleString()} users
                </div>
                <div>Top {ranking.percentile}% worldwide</div>
              </div>
            </div>
          )}
        </div>

        {/* Points Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              SMILE Points Breakdown
            </h4>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Points are earned through milestone achievements and quality contributions.
            </div>

            {/* Total Points Display */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">Total SMILE Points</div>
                <div className="text-3xl font-bold text-blue-600">{totalPoints.toLocaleString()}</div>
              </div>
            </div>

            {/* Points Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Questions</div>
                  <div className="text-sm font-bold text-blue-600">+{pointsBreakdown.questions}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">5 pts per question</div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">High Quality</div>
                  <div className="text-sm font-bold text-yellow-600">+{pointsBreakdown.highQuality}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">30 pts per 8+ score question</div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Responses</div>
                  <div className="text-sm font-bold text-green-600">+{pointsBreakdown.responses}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">2 pts per response</div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Exams</div>
                  <div className="text-sm font-bold text-purple-600">+{pointsBreakdown.exams}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">10-50 pts per exam</div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Certificates</div>
                  <div className="text-sm font-bold text-indigo-600">+{pointsBreakdown.certificates}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">100 pts per certificate</div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Badges</div>
                  <div className="text-sm font-bold text-orange-600">+{pointsBreakdown.badges}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">10-1000 pts per badge</div>
              </div>
            </div>

            {/* How to Earn Points */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h5 className="font-semibold text-gray-900 mb-2">How to Earn Points:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                <div>- First Question: +10 pts</div>
                <div>- 10 Questions: +25 pts</div>
                <div>- High Quality Questions: +30-100 pts</div>
                <div>- First Response: +10 pts</div>
                <div>- Active Participation: +25 pts</div>
                <div>- Level Milestones: +100 pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress to Next Level */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Progress to Next Level
          </h4>

          {nextTier ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {totalPoints.toLocaleString()} / {nextTier.minPoints.toLocaleString()} points
                </span>
                <span className="text-sm text-gray-600">
                  {levelInfo.pointsToNext.toLocaleString()} points to go
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                ></div>
              </div>
              <div className="text-center mt-3 text-sm text-gray-600">
                Next: {nextTier.icon} {nextTier.name}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">&#127942;</div>
              <div className="font-semibold text-gray-900">Maximum Level Achieved!</div>
              <div className="text-sm text-gray-600">You&apos;ve reached the highest SMILE rank</div>
            </div>
          )}
        </div>
      </div>

      {/* Level Progression Chart */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-8 h-8 text-purple-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Level Progression System
        </h3>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="space-y-4">
            {levelInfo?.allTiers?.map((level, index) => {
              const isCurrent = totalPoints >= level.minPoints &&
                (level.maxPoints === null || totalPoints <= level.maxPoints)
              const isAchieved = level.maxPoints !== null && totalPoints > level.maxPoints
              const pointsNeeded = level.minPoints - totalPoints

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrent
                      ? 'border-2'
                      : 'border bg-gray-50'
                  }`}
                  style={{
                    borderColor: isCurrent ? level.color : undefined,
                    backgroundColor: isCurrent ? `${level.color}10` : undefined,
                  }}
                >
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">
                      {isCurrent ? '&#128100;' : isAchieved ? '✅' : '🔒'}
                    </div>
                    <div>
                      <div className={`font-semibold ${isCurrent ? 'text-gray-900' : 'text-gray-700'}`}>
                        {level.icon} {level.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {level.minPoints.toLocaleString()}
                        {level.maxPoints ? ` - ${level.maxPoints.toLocaleString()}` : '+'} points
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {isCurrent ? (
                      <div className="text-sm font-medium" style={{ color: level.color }}>
                        ← You are here
                      </div>
                    ) : totalPoints < level.minPoints ? (
                      <div className="text-sm text-gray-500">
                        {pointsNeeded.toLocaleString()} points to unlock
                      </div>
                    ) : (
                      <div className="text-sm text-green-600">✅ Achieved</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">How to Earn Points:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>- First Question: 10 points</li>
              <li>- Curious Mind 10: 25 points</li>
              <li>- Quality questions (8+ score): 30-150 points</li>
              <li>- Helping others: 10-150 points</li>
              <li>- Daily streaks: 20-200 points</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Group SMILE Scores */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-8 h-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Group SMILE Scores
        </h3>

        <div className="space-y-4">
          {ranking?.groupRankings && ranking.groupRankings.length > 0 ? (
            <>
              {ranking.groupRankings.map((group, index) => {
                const colors = ['blue', 'green', 'purple', 'orange', 'pink']
                const color = colors[index % colors.length]

                return (
                  <div key={group.groupId} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 bg-gradient-to-br from-${color}-400 to-${color}-600 rounded-lg flex items-center justify-center text-white font-bold mr-4`}>
                          {group.groupName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{group.groupName}</div>
                          <div className="text-sm text-gray-600">
                            {group.totalMembers} members
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold text-${color}-600`}>
                          {group.groupPoints}
                        </div>
                        <div className="text-sm text-gray-600">Group Points</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
                          #{group.rank} / {group.totalMembers}
                        </span>
                        <span className="ml-2 text-gray-600">Group Ranking</span>
                      </div>
                      <div className="text-gray-600">
                        {group.questionsInGroup} questions in this group
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Group Scores Yet</h4>
              <p className="text-gray-600 mb-4">
                Join groups and start asking questions to see your group rankings!
              </p>
              <a
                href="/groups"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Join Groups
              </a>
            </div>
          )}
        </div>

        {/* Group Score Legend */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How Group Scores Work
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-medium text-gray-900 mb-2">Points Calculation:</div>
              <ul className="space-y-1 text-gray-600">
                <li>- Questions in group: Up to 50 points each</li>
                <li>- Responses to group questions: Up to 10 points each</li>
                <li>- Peer ratings given: 2 points each</li>
                <li>- Group activity bonus: 1 point per active day</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-2">Ranking Benefits:</div>
              <ul className="space-y-1 text-gray-600">
                <li>- Higher visibility for your questions</li>
                <li>- Group leadership opportunities</li>
                <li>- Special group badges and recognition</li>
                <li>- Access to group-exclusive features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
