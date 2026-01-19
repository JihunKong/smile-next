/**
 * StatsGrid Component
 *
 * Displays the 4-card statistics grid on the dashboard:
 * - Questions This Week
 * - Avg Quality Score
 * - Day Streak
 * - SMILE Points & Tier
 *
 * Extracted as part of VIBE-0003D refactoring.
 */

import type { UserStats, LevelInfo } from '../types'

// ============================================================================
// Types
// ============================================================================

interface StatsGridProps {
  stats: UserStats
}

interface QuestionsCardProps {
  thisWeek: number
  total: number
  weekChange: number
}

interface QualityCardProps {
  score: number
  totalQuestions: number
}

interface StreakCardProps {
  streak: number
  totalQuestions: number
}

interface PointsCardProps {
  points: number
  levelInfo: LevelInfo
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Questions This Week Card
 */
function QuestionsCard({ thisWeek, total, weekChange }: QuestionsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{thisWeek}</div>
          <div className="text-sm text-gray-500">This Week</div>
          <div className="text-xs text-blue-600 mt-1">🎯 {total} total questions</div>
        </div>
        <div className="text-blue-500">
          <i className="fas fa-question-circle text-3xl"></i>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center text-sm">
          {weekChange > 0 ? (
            <>
              <span className="text-green-600">↗</span>
              <span className="text-green-600 ml-1">+{weekChange} from last week</span>
            </>
          ) : weekChange < 0 ? (
            <>
              <span className="text-red-600">↘</span>
              <span className="text-red-600 ml-1">{weekChange} from last week</span>
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
  )
}

/**
 * Average Quality Score Card
 */
function QualityCard({ score, totalQuestions }: QualityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
      <div className="flex items-center justify-between">
        <div>
          {score > 0 ? (
            <>
              <div className="text-2xl font-bold text-gray-900">{score}</div>
              <div className="text-sm text-gray-500">Avg Quality Score</div>
              <div className="text-xs text-green-600 mt-1">⭐ Based on {totalQuestions} questions</div>
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
          {totalQuestions > 0 ? (
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
  )
}

/**
 * Day Streak Card
 */
function StreakCard({ streak, totalQuestions }: StreakCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{streak}</div>
          <div className="text-sm text-gray-500">Day Streak</div>
          {streak > 0 ? (
            <div className="text-xs text-purple-600 mt-1">🔥 {streak} day streak!</div>
          ) : totalQuestions > 0 ? (
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
  )
}

/**
 * SMILE Points & Tier Card
 */
function PointsCard({ points, levelInfo }: PointsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{points}</div>
          <div className="text-sm text-gray-500">SMILE Points</div>
          {levelInfo?.current ? (
            <div className="text-xs mt-1 flex items-center">
              <span style={{ color: levelInfo.current.tier.color }}>
                {levelInfo.current.tier.icon}
              </span>
              <span className="ml-1 text-gray-600">{levelInfo.current.tier.name}</span>
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
        {levelInfo && levelInfo.points_to_next > 0 ? (
          <>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
              <span>Progress to next tier</span>
              <span>{levelInfo.points_to_next} points to go</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
                style={{ width: `${levelInfo.current?.progress_percentage || 0}%` }}
              ></div>
            </div>
          </>
        ) : levelInfo?.is_max_tier ? (
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
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * StatsGrid - Displays the 4-card statistics grid on the dashboard
 */
export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <QuestionsCard
        thisWeek={stats.questions_this_week}
        total={stats.total_questions}
        weekChange={stats.week_change}
      />
      <QualityCard
        score={stats.quality_score}
        totalQuestions={stats.total_questions}
      />
      <StreakCard
        streak={stats.day_streak}
        totalQuestions={stats.total_questions}
      />
      <PointsCard
        points={stats.total_badge_points}
        levelInfo={stats.level_info}
      />
    </div>
  )
}
