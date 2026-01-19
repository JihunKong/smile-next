/**
 * AchievementShowcase Component
 *
 * 3-column achievements grid showing:
 * - Recent Achievements: Badge display or progress message
 * - Getting Started: Onboarding steps for new users or challenges
 * - Your Progress: Progress summary or journey start message
 *
 * Extracted as part of VIBE-0003F refactoring.
 */

import Link from 'next/link'

// ============================================================================
// Types
// ============================================================================

interface AchievementShowcaseProps {
  badgesEarned: number
  badgeNames: string[]
  totalQuestions: number
}

// ============================================================================
// Main Component
// ============================================================================

export function AchievementShowcase({
  badgesEarned,
  badgeNames,
  totalQuestions,
}: AchievementShowcaseProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <RecentAchievements
        badgesEarned={badgesEarned}
        badgeNames={badgeNames}
        totalQuestions={totalQuestions}
      />
      <GettingStarted totalQuestions={totalQuestions} />
      <YourProgress totalQuestions={totalQuestions} />
    </div>
  )
}

// ============================================================================
// Recent Achievements Section
// ============================================================================

interface RecentAchievementsProps {
  badgesEarned: number
  badgeNames: string[]
  totalQuestions: number
}

function RecentAchievements({ badgesEarned, badgeNames, totalQuestions }: RecentAchievementsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-trophy text-yellow-500 mr-2"></i>Recent Achievements
      </h3>
      {badgesEarned > 0 ? (
        <BadgeList badgeNames={badgeNames} />
      ) : totalQuestions > 0 ? (
        <ProgressMessage />
      ) : (
        <NewUserMessage />
      )}
    </div>
  )
}

function BadgeList({ badgeNames }: { badgeNames: string[] }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-3">🏆 Latest Badges:</div>
      {badgeNames.slice(0, 3).map((badgeName, index) => (
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
  )
}

function ProgressMessage() {
  return (
    <div className="space-y-3">
      <div className="text-center py-6 text-gray-500">
        <i className="fas fa-chart-line text-3xl mb-2"></i>
        <p className="text-sm">Keep creating questions!</p>
        <p className="text-xs">You&apos;re making progress toward your first badge</p>
      </div>
    </div>
  )
}

function NewUserMessage() {
  return (
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
  )
}

// ============================================================================
// Getting Started Section
// ============================================================================

function GettingStarted({ totalQuestions }: { totalQuestions: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-map text-blue-500 mr-2"></i>Getting Started
      </h3>
      {totalQuestions > 0 ? <ChallengesComingSoon /> : <OnboardingSteps />}
    </div>
  )
}

function ChallengesComingSoon() {
  return (
    <div className="space-y-4">
      <div className="text-center py-6 text-gray-500">
        <i className="fas fa-trophy text-3xl mb-2"></i>
        <p className="text-sm">Challenges coming soon!</p>
        <p className="text-xs">Keep creating to unlock new challenges</p>
      </div>
    </div>
  )
}

function OnboardingSteps() {
  return (
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
  )
}

// ============================================================================
// Your Progress Section
// ============================================================================

function YourProgress({ totalQuestions }: { totalQuestions: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-chart-line text-green-500 mr-2"></i>Your Progress
      </h3>
      {totalQuestions > 0 ? <CommunityComingSoon /> : <JourneyStart />}
    </div>
  )
}

function CommunityComingSoon() {
  return (
    <div className="space-y-3">
      <div className="text-center py-6 text-gray-500">
        <i className="fas fa-user-friends text-3xl mb-2"></i>
        <p className="text-sm">Community features coming soon!</p>
        <p className="text-xs">Keep creating to see your progress</p>
      </div>
    </div>
  )
}

function JourneyStart() {
  return (
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
  )
}
