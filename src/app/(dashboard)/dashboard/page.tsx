import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

// Tier system matching Flask
const TIERS = [
  { name: 'SMILE Starter', minPoints: 0, color: '#6B7280', icon: '✨' },
  { name: 'Rising Star', minPoints: 100, color: '#3B82F6', icon: '⭐' },
  { name: 'Knowledge Seeker', minPoints: 500, color: '#10B981', icon: '📚' },
  { name: 'Expert Questioner', minPoints: 1500, color: '#8B5CF6', icon: '🎓' },
  { name: 'Master Educator', minPoints: 5000, color: '#F59E0B', icon: '👑' },
]

function getTierInfo(points: number) {
  let currentTier = TIERS[0]
  let nextTier = TIERS[1]

  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) {
      currentTier = TIERS[i]
      nextTier = TIERS[i + 1] || null
      break
    }
  }

  const isMaxTier = !nextTier
  const pointsToNext = nextTier ? nextTier.minPoints - points : 0
  const progressPercentage = nextTier
    ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100

  return {
    current: { tier: currentTier, progress_percentage: progressPercentage },
    points_to_next: pointsToNext,
    is_max_tier: isMaxTier,
  }
}

async function getUserStats(userId: string) {
  try {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [
      totalQuestions,
      questionsThisWeek,
      questionsLastWeek,
      totalGroups,
      qualityScores,
      dayStreak,
      recentActivities,
      userCertificates,
    ] = await Promise.all([
      // Total questions
      prisma.question.count({
        where: { creatorId: userId, isDeleted: false },
      }),
      // Questions this week
      prisma.question.count({
        where: {
          creatorId: userId,
          isDeleted: false,
          createdAt: { gte: oneWeekAgo },
        },
      }),
      // Questions last week (for comparison)
      prisma.question.count({
        where: {
          creatorId: userId,
          isDeleted: false,
          createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
        },
      }),
      // Total groups
      prisma.groupUser.count({
        where: { userId, group: { isDeleted: false } },
      }),
      // Average quality score from questions
      prisma.question.aggregate({
        where: {
          creatorId: userId,
          isDeleted: false,
          questionEvaluationScore: { not: null }
        },
        _avg: { questionEvaluationScore: true },
      }),
      // Calculate day streak (simplified - based on consecutive days with questions)
      prisma.question.findMany({
        where: { creatorId: userId, isDeleted: false },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      // Recent activity feed
      prisma.question.findMany({
        where: {
          creatorId: userId,
          isDeleted: false,
          activity: { isDeleted: false },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          questionEvaluationScore: true,
          activity: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // User certificates with progress
      prisma.studentCertificate.findMany({
        where: { studentId: userId },
        include: {
          certificate: {
            include: {
              activities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },
        orderBy: { enrollmentDate: 'desc' },
        take: 3,
      }),
    ])

    // Calculate week change
    const weekChange = questionsThisWeek - questionsLastWeek

    // Calculate day streak
    let streak = 0
    if (dayStreak.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const uniqueDays = new Set<string>()
      dayStreak.forEach(q => {
        const date = new Date(q.createdAt)
        date.setHours(0, 0, 0, 0)
        uniqueDays.add(date.toISOString())
      })

      const sortedDays = Array.from(uniqueDays).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
      )

      for (let i = 0; i < sortedDays.length; i++) {
        const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        expectedDate.setHours(0, 0, 0, 0)

        if (sortedDays[i] === expectedDate.toISOString()) {
          streak++
        } else {
          break
        }
      }
    }

    // Badge system placeholder (TODO: Add Badge model to schema)
    const totalBadgePoints = 0
    const badgesEarned = 0
    const badgeNames: string[] = []

    // Get tier info
    const levelInfo = getTierInfo(totalBadgePoints)

    // Process certificates with activity status
    const processedCertificates = userCertificates.map(uc => {
      const totalActivities = uc.certificate.activities.length
      // For now, simplified progress calculation
      const completedActivities = 0 // Would need to check actual completion status
      const progressPercentage = totalActivities > 0
        ? (completedActivities / totalActivities) * 100
        : 0

      return {
        id: uc.id,
        name: uc.certificate.name,
        status: uc.completionDate ? 'completed' : 'in_progress',
        enrollment_date: uc.enrollmentDate,
        completion_date: uc.completionDate,
        progress_percentage: progressPercentage,
        activities: uc.certificate.activities.map(ca => ({
          activity_id: ca.activityId,
          activity_name: ca.activity.name,
          required: ca.required,
          status: 'not_started' as 'not_started' | 'in_progress' | 'passed' | 'failed', // Would need actual status check
        })),
      }
    })

    // Process recent activities for feed
    const processedActivities = recentActivities
      .filter(q => q.activity)
      .map(q => ({
        id: q.id,
        title: `Created question in ${q.activity!.name}`,
        subtitle: q.content.substring(0, 50) + (q.content.length > 50 ? '...' : ''),
        timestamp: q.createdAt,
        icon: 'fa-question-circle',
        color: 'blue',
        badge_progress: q.questionEvaluationScore && q.questionEvaluationScore >= 8,
      }))

    return {
      total_questions: totalQuestions,
      questions_this_week: questionsThisWeek,
      week_change: weekChange,
      quality_score: qualityScores._avg.questionEvaluationScore
        ? Math.round(qualityScores._avg.questionEvaluationScore * 10) / 10
        : 0,
      day_streak: streak,
      total_badge_points: totalBadgePoints,
      badges_earned: badgesEarned,
      badge_names: badgeNames,
      level_info: levelInfo,
      total_groups: totalGroups,
      activities: processedActivities,
      user_certificates: processedCertificates,
    }
  } catch (error) {
    console.error('Failed to get user stats:', error)
    return {
      total_questions: 0,
      questions_this_week: 0,
      week_change: 0,
      quality_score: 0,
      day_streak: 0,
      total_badge_points: 0,
      badges_earned: 0,
      badge_names: [],
      level_info: getTierInfo(0),
      total_groups: 0,
      activities: [],
      user_certificates: [],
    }
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-user-slash text-yellow-600 text-2xl"></i>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Session Error</h1>
          <p className="text-gray-600 mb-6">
            Your session appears to be invalid. This can happen if your session expired
            or there was an issue during login.
          </p>
          <a
            href="/auth/login"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Log in again
          </a>
        </div>
      </div>
    )
  }

  const stats = await getUserStats(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header - Flask style */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center">
            <i className="fas fa-user-circle text-4xl mr-4"></i>
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'User'}!</h1>
              <p className="text-blue-100 mt-1">Ready to create impactful questions and engage learners?</p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Flask style */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/groups/create" className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <i className="fas fa-plus-circle text-2xl text-blue-600 mr-3"></i>
              <div>
                <div className="font-medium text-gray-900">Create Group</div>
                <div className="text-sm text-gray-500">Start a new learning group</div>
              </div>
            </Link>

            <Link href="/groups" className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
              <i className="fas fa-users text-2xl text-green-600 mr-3"></i>
              <div>
                <div className="font-medium text-gray-900">My Groups</div>
                <div className="text-sm text-gray-500">Manage your groups</div>
              </div>
            </Link>

            <Link href="/activities" className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <i className="fas fa-clipboard-list text-2xl text-purple-600 mr-3"></i>
              <div>
                <div className="font-medium text-gray-900">Activities</div>
                <div className="text-sm text-gray-500">Create & manage activities</div>
              </div>
            </Link>

            <Link href="/profile" className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
              <i className="fas fa-user-cog text-2xl text-yellow-600 mr-3"></i>
              <div>
                <div className="font-medium text-gray-900">Profile</div>
                <div className="text-sm text-gray-500">Update your settings</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats with Progress - Flask style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Questions This Week */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.questions_this_week}</div>
                <div className="text-sm text-gray-500">This Week</div>
                <div className="text-xs text-blue-600 mt-1">🎯 {stats.total_questions} total questions</div>
              </div>
              <div className="text-blue-500">
                <i className="fas fa-question-circle text-3xl"></i>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center text-sm">
                {stats.week_change > 0 ? (
                  <>
                    <span className="text-green-600">↗</span>
                    <span className="text-green-600 ml-1">+{stats.week_change} from last week</span>
                  </>
                ) : stats.week_change < 0 ? (
                  <>
                    <span className="text-red-600">↘</span>
                    <span className="text-red-600 ml-1">{stats.week_change} from last week</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-600">-</span>
                    <span className="text-gray-600 ml-1">No change from last week</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Avg Quality Score */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                {stats.quality_score > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{stats.quality_score}</div>
                    <div className="text-sm text-gray-500">Avg Quality Score</div>
                    <div className="text-xs text-green-600 mt-1">⭐ Based on {stats.total_questions} questions</div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">-</div>
                    <div className="text-sm text-gray-500">Avg Quality Score</div>
                    <div className="text-xs text-gray-600 mt-1">⏳ Create questions to see your score</div>
                  </>
                )}
              </div>
              <div className="text-green-500">
                <i className="fas fa-star text-3xl"></i>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center text-sm">
                {stats.total_questions > 0 ? (
                  <>
                    <span className="text-green-600">🎯</span>
                    <span className="text-gray-600 ml-1">Ask more questions to track progress</span>
                  </>
                ) : (
                  <>
                    <span className="text-blue-600">💡</span>
                    <span className="text-gray-600 ml-1">Start by creating your first question</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Day Streak */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.day_streak}</div>
                <div className="text-sm text-gray-500">Day Streak</div>
                {stats.day_streak > 0 ? (
                  <div className="text-xs text-purple-600 mt-1">🔥 {stats.day_streak} day streak!</div>
                ) : stats.total_questions > 0 ? (
                  <div className="text-xs text-purple-600 mt-1">🔥 Start your streak!</div>
                ) : (
                  <div className="text-xs text-gray-600 mt-1">💫 Create questions to start streaks</div>
                )}
              </div>
              <div className="text-purple-500">
                <i className="fas fa-fire text-3xl"></i>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center text-sm">
                <span className="text-purple-600">🎯</span>
                <span className="text-gray-600 ml-1">Ask questions daily to build streaks</span>
              </div>
            </div>
          </div>

          {/* SMILE Points & Tier */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total_badge_points}</div>
                <div className="text-sm text-gray-500">SMILE Points</div>
                {stats.level_info?.current ? (
                  <div className="text-xs mt-1 flex items-center">
                    <span style={{ color: stats.level_info.current.tier.color }}>
                      {stats.level_info.current.tier.icon}
                    </span>
                    <span className="ml-1 text-gray-600">{stats.level_info.current.tier.name}</span>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 mt-1">✨ SMILE Starter</div>
                )}
              </div>
              <div className="text-yellow-500">
                <i className="fas fa-trophy text-3xl"></i>
              </div>
            </div>
            <div className="mt-3">
              {stats.level_info && stats.level_info.points_to_next > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Progress to next tier</span>
                    <span>{stats.level_info.points_to_next} points to go</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
                      style={{ width: `${stats.level_info.current?.progress_percentage || 0}%` }}
                    ></div>
                  </div>
                </>
              ) : stats.level_info?.is_max_tier ? (
                <div className="flex items-center text-sm">
                  <span className="text-yellow-600">👑</span>
                  <span className="text-yellow-600 ml-1">Master Level Achieved!</span>
                </div>
              ) : (
                <div className="flex items-center text-sm">
                  <span className="text-yellow-600">💫</span>
                  <span className="text-gray-600 ml-1">Create questions to unlock achievements</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Progress Section - Flask style */}
        {stats.user_certificates && stats.user_certificates.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-certificate text-purple-500 mr-2"></i>
                My Certificates
              </h2>
              <Link href="/my-certificates" className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
                View All
                <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>

            <div className="space-y-6">
              {stats.user_certificates.map((cert) => (
                <div key={cert.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  {/* Certificate Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {cert.status === 'completed' ? (
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-certificate text-purple-600 text-2xl"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <Link href={`/my-certificates/${cert.id}/progress`} className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                          {cert.name}
                        </Link>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>Enrolled {new Date(cert.enrollment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {cert.status === 'completed' && cert.completion_date && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">
                                Completed {new Date(cert.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {cert.status === 'completed' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <i className="fas fa-check mr-1"></i>Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <i className="fas fa-spinner mr-1"></i>In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">Overall Progress</span>
                      <span className="font-semibold">{Math.round(cert.progress_percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          cert.progress_percentage === 100
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : 'bg-gradient-to-r from-purple-400 to-purple-600'
                        }`}
                        style={{ width: `${cert.progress_percentage}%` }}
                      ></div>
                    </div>
                    {cert.progress_percentage < 100 ? (
                      <p className="text-xs text-gray-500 mt-2">
                        <i className="fas fa-lightbulb text-yellow-500"></i>
                        {' '}Keep going! You&apos;re {Math.round(100 - cert.progress_percentage)}% away from completion.
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 mt-2">
                        <i className="fas fa-trophy text-yellow-500"></i>
                        {' '}Congratulations! You&apos;ve completed all required activities.
                      </p>
                    )}
                  </div>

                  {/* Activity List */}
                  {cert.activities && cert.activities.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Activities ({cert.activities.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {cert.activities.map((activity) => (
                          <div key={activity.activity_id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {/* Status Icon */}
                              <div className="flex-shrink-0">
                                {activity.status === 'passed' ? (
                                  <i className="fas fa-check-circle text-green-500" title="Passed"></i>
                                ) : activity.status === 'failed' ? (
                                  <i className="fas fa-times-circle text-red-500" title="Failed"></i>
                                ) : activity.status === 'in_progress' ? (
                                  <i className="fas fa-circle-notch text-blue-500" title="In Progress"></i>
                                ) : (
                                  <i className="far fa-circle text-gray-400" title="Not Started"></i>
                                )}
                              </div>

                              {/* Activity Name */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {activity.activity_name}
                                </p>
                                {activity.required ? (
                                  <span className="text-xs text-red-600">Required</span>
                                ) : (
                                  <span className="text-xs text-gray-500">Optional</span>
                                )}
                              </div>

                              {/* Activity Details */}
                              <div className="flex-shrink-0 text-right">
                                {activity.status === 'passed' ? (
                                  <span className="text-xs text-green-600">✓ Passed</span>
                                ) : activity.status === 'failed' ? (
                                  <span className="text-xs text-red-600">Try Again</span>
                                ) : activity.status === 'in_progress' ? (
                                  <span className="text-xs text-blue-600">Continue</span>
                                ) : (
                                  <Link href={`/activities/${activity.activity_id}`} className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                                    Start →
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Certificate Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link href={`/my-certificates/${cert.id}/progress`} className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm font-medium">
                      <i className="fas fa-chart-line mr-2"></i>
                      View Detailed Progress
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Encouraging Message */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <i className="fas fa-graduation-cap text-purple-600 text-xl mt-1"></i>
                <div>
                  <p className="text-sm font-medium text-gray-900">Keep Learning!</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete certificate activities to unlock achievements and demonstrate your expertise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Activity & Personal Timeline - Flask style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Your Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-user-clock text-blue-500 mr-2"></i>Your Activity
              </h2>
              <Link href="/my-events" className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</Link>
            </div>

            <div className="space-y-4">
              {stats.activities && stats.activities.length > 0 ? (
                stats.activities.map((activity) => (
                  <div key={activity.id} className={`flex items-start space-x-3 p-3 bg-${activity.color}-50 rounded-lg hover:bg-${activity.color}-100 transition-colors`}>
                    <div className={`text-${activity.color}-600 mt-1`}>
                      <i className={`fas ${activity.icon}`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{activity.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {activity.subtitle && ` • ${activity.subtitle}`}
                        {activity.badge_progress && (
                          <span className={`text-${activity.color}-600`}> • High Quality!</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-3">
                    <i className="fas fa-inbox text-4xl"></i>
                  </div>
                  <p className="text-gray-600 text-sm">No recent activity</p>
                  <p className="text-gray-500 text-xs mt-1">Start by joining a group or creating questions!</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-3">🎯 Keep your streak alive!</div>
                <Link href="/activities" className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                  <i className="fas fa-plus mr-2"></i>Ask Today&apos;s Question
                </Link>
              </div>
            </div>
          </div>

          {/* Community Feed - Flask style */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-globe text-green-500 mr-2"></i>Community Buzz
              </h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Live</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                  SC
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900"><strong>Dr. Sarah Chen</strong> earned the <span className="text-yellow-600">🏆 Research Master</span> badge</div>
                  <div className="text-xs text-gray-500 mt-1">15 minutes ago • 10 questions with perfect AI scores</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium">
                  MR
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900"><strong>Marcus Rodriguez</strong> asked <em>&quot;How will quantum computing change cryptography?&quot;</em></div>
                  <div className="text-xs text-gray-500 mt-1">2 hours ago • 7 responses already</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                  EJ
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900"><strong>Emma Johnson</strong> started a {stats.total_questions > 1 ? '25' : '7'}-day learning streak!</div>
                  <div className="text-xs text-gray-500 mt-1">4 hours ago • Corporate Training track</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-medium">
                  AH
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900"><strong>Prof. Ahmed Hassan</strong> shared insights on <em>&quot;Critical thinking in education&quot;</em></div>
                  <div className="text-xs text-gray-500 mt-1">6 hours ago • Philosophy Department • 12 likes</div>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-900 text-center">
                  <span className="text-blue-600 font-semibold">🎯 Weekly Challenge:</span> &quot;Subject Explorer&quot;
                </div>
                <div className="text-xs text-gray-600 text-center mt-1">{stats.total_questions > 0 ? 156 : 89} participants • 3 days left</div>
                <div className="text-center mt-2">
                  <Link href="/dashboard/join-challenge" className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors inline-block">Join Challenge</Link>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <div className="text-sm text-gray-600">
                <span className="text-green-600 font-semibold">847</span> active learners this week
                <div className="text-xs text-gray-500 mt-1">Join the conversation!</div>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Showcase & Progress - Flask style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Achievements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-trophy text-yellow-500 mr-2"></i>Recent Achievements
            </h3>
            {stats.badges_earned > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">🏆 Latest Badges:</div>
                {stats.badge_names.slice(0, 3).map((badgeName, index) => (
                  <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-yellow-600 mr-3">
                      <i className="fas fa-medal"></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{badgeName}</div>
                      <div className="text-xs text-gray-500">Recently earned</div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <Link href="/profile#achievements-tab" className="text-sm text-blue-600 hover:underline flex items-center">
                    View complete badge gallery →
                  </Link>
                </div>
              </div>
            ) : stats.total_questions > 0 ? (
              <div className="space-y-3">
                <div className="text-center py-6 text-gray-500">
                  <i className="fas fa-chart-line text-3xl mb-2"></i>
                  <p className="text-sm">Keep creating questions!</p>
                  <p className="text-xs">You&apos;re making progress toward your first badge</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-6 text-gray-500">
                  <i className="fas fa-rocket text-4xl mb-3 text-blue-400"></i>
                  <h4 className="font-medium text-gray-700 mb-2">Ready to get started?</h4>
                  <p className="text-sm text-gray-600 mb-4">Create your first question to begin earning achievements and tracking your progress!</p>
                  <div className="space-y-2 text-xs text-left">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">🎯</span>
                      <span>Create questions to earn quality scores</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">🔥</span>
                      <span>Build streaks by asking daily</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">🏆</span>
                      <span>Unlock badges for milestones</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Getting Started Guide */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-map text-blue-500 mr-2"></i>Getting Started
            </h3>
            {stats.total_questions > 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6 text-gray-500">
                  <i className="fas fa-trophy text-3xl mb-2"></i>
                  <p className="text-sm">Challenges coming soon!</p>
                  <p className="text-xs">Keep creating to unlock new challenges</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 rounded-lg p-3 bg-blue-50">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">1️⃣</span>
                    <div className="font-medium text-gray-900">Create Your First Question</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Join a group and create your first question to get started</div>
                  <Link href="/groups" className="text-xs text-blue-600 hover:text-blue-800">Find Groups →</Link>
                </div>

                <div className="border-l-4 border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">2️⃣</span>
                    <div className="font-medium text-gray-700">Build Your Profile</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Complete your profile and start tracking progress</div>
                  <Link href="/profile" className="text-xs text-gray-600 hover:text-gray-800">Edit Profile →</Link>
                </div>

                <div className="border-l-4 border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">3️⃣</span>
                    <div className="font-medium text-gray-700">Explore Features</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Discover AI scoring, peer ratings, and more</div>
                  <span className="text-xs text-gray-500">Coming after your first question!</span>
                </div>
              </div>
            )}
          </div>

          {/* Your Progress */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-chart-line text-green-500 mr-2"></i>Your Progress
            </h3>
            {stats.total_questions > 0 ? (
              <div className="space-y-3">
                <div className="text-center py-6 text-gray-500">
                  <i className="fas fa-user-friends text-3xl mb-2"></i>
                  <p className="text-sm">Community features coming soon!</p>
                  <p className="text-xs">Keep creating to see your progress</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-6 text-gray-500">
                  <i className="fas fa-seedling text-4xl mb-3 text-green-400"></i>
                  <h4 className="font-medium text-gray-700 mb-2">Your journey starts here!</h4>
                  <p className="text-sm text-gray-600 mb-4">Once you start creating questions, you&apos;ll see your progress and stats here.</p>
                  <div className="bg-gray-50 rounded-lg p-3 text-left">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <span className="mr-2">📊</span>
                        <span>Track your question quality scores</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📈</span>
                        <span>Monitor your learning progress</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🤝</span>
                        <span>Connect with other learners</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
