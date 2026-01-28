'use client'

import type { UserProfile, UserStats } from '../../types'

interface ProfileHeaderProps {
  profile: UserProfile | null
  stats: UserStats
  initials: string
  memberSinceFormatted: string
  badgeCount: number
  isLoading: boolean
}

/**
 * Profile header component with avatar, name, and stats grid
 *
 * Displays the hero section of the profile page.
 */
export function ProfileHeader({
  profile,
  stats,
  initials,
  memberSinceFormatted,
  badgeCount,
  isLoading,
}: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 mb-8">
      {/* Header with Profile Completion */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">Profile Overview</h2>
          <div className="flex items-center space-x-3">
            <span className="text-white text-sm">Profile Strength:</span>
            <div className="flex items-center">
              <div className="w-16 bg-white bg-opacity-30 rounded-full h-2 mr-2">
                <div
                  className="bg-yellow-300 h-2 rounded-full"
                  style={{ width: '85%' }}
                ></div>
              </div>
              <span className="text-yellow-300 font-bold">85%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              {stats.levelInfo?.current?.tier && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md">
                  {stats.levelInfo.current.tier.icon}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.firstName || ''} {profile?.lastName || ''}
              </h1>
              <p className="text-gray-600 text-sm">{profile?.email}</p>
              <p className="text-gray-500 text-xs mt-1 flex items-center">
                {stats.levelInfo?.current?.tier ? (
                  <>
                    <span className="mr-1">
                      {stats.levelInfo.current.tier.icon}
                    </span>
                    {stats.levelInfo.current.tier.name} - Member since{' '}
                    {memberSinceFormatted}
                  </>
                ) : (
                  <>
                    <span className="text-yellow-500 mr-1">✨</span>
                    SMILE Starter - Member since {memberSinceFormatted}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                value={isLoading ? '...' : stats.totalPoints.toLocaleString()}
                label="SMILE Points"
                colorScheme="blue"
              />
              <StatCard
                value={isLoading ? '...' : stats.totalQuestions.toString()}
                label="Questions"
                colorScheme="green"
              />
              <StatCard
                value={isLoading ? '...' : stats.totalActivities.toString()}
                label="Activities"
                colorScheme="purple"
              />
              <StatCard
                value={isLoading ? '...' : badgeCount.toString()}
                label="Badges"
                colorScheme="orange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  value: string
  label: string
  colorScheme: 'blue' | 'green' | 'purple' | 'orange'
}

const colorClasses = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    border: 'border-blue-200',
    value: 'text-blue-700',
    label: 'text-blue-600',
  },
  green: {
    bg: 'bg-gradient-to-br from-green-50 to-green-100',
    border: 'border-green-200',
    value: 'text-green-700',
    label: 'text-green-600',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    border: 'border-purple-200',
    value: 'text-purple-700',
    label: 'text-purple-600',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    border: 'border-orange-200',
    value: 'text-orange-700',
    label: 'text-orange-600',
  },
}

function StatCard({ value, label, colorScheme }: StatCardProps) {
  const colors = colorClasses[colorScheme]

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-lg p-4 text-center`}
    >
      <div className={`text-2xl font-bold ${colors.value}`}>{value}</div>
      <div className={`text-xs ${colors.label} font-medium`}>{label}</div>
    </div>
  )
}
