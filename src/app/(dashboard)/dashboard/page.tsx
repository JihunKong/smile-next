import { auth } from '@/lib/auth/config'
import { getDashboardData } from './lib/getDashboardData'
import { ErrorBanner, WelcomeHeader, QuickActions, StatsGrid, AchievementShowcase, CertificateProgress, ActivityFeed, CommunityFeed } from './components'

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

  const stats = await getDashboardData(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner if stats failed to load */}
        <ErrorBanner error={'error' in stats ? stats.error : undefined} />

        {/* Welcome Header */}
        <WelcomeHeader userName={user?.name} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Certificate Progress Section */}
        <CertificateProgress certificates={stats.user_certificates} />

        {/* Community Activity & Personal Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ActivityFeed activities={stats.activities || []} />
          <CommunityFeed totalQuestions={stats.total_questions} />
        </div>

        {/* Achievement Showcase & Progress */}
        <AchievementShowcase
          badgesEarned={stats.badges_earned}
          badgeNames={stats.badge_names}
          totalQuestions={stats.total_questions}
        />
      </div>
    </div>
  )
}
