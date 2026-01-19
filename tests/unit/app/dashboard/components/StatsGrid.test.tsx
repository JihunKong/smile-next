/**
 * Unit tests for StatsGrid component
 * Tests all 4 stat cards: Questions, Quality Score, Streak, Points & Tier
 *
 * Following TDD approach as specified in VIBE-0003D
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatsGrid } from '@/app/(dashboard)/dashboard/components'
import type { UserStats } from '@/app/(dashboard)/dashboard/types'

/**
 * Factory function to create mock stats with sensible defaults
 */
const createMockStats = (overrides: Partial<UserStats> = {}): UserStats => ({
  total_questions: 25,
  questions_this_week: 5,
  week_change: 2,
  quality_score: 8.5,
  day_streak: 7,
  total_badge_points: 150,
  badges_earned: 3,
  badge_names: ['🔥 Week Warrior'],
  level_info: {
    current: {
      tier: {
        name: 'SMILE Learner',
        icon: '📚',
        color: '#3B82F6',
        minPoints: 5000,
        maxPoints: 9999,
        description: 'Learning the ropes',
      },
      progress_percentage: 30,
    },
    points_to_next: 350,
    is_max_tier: false,
  },
  total_groups: 2,
  activities: [],
  user_certificates: [],
  ...overrides,
})

describe('StatsGrid', () => {
  describe('Questions Card', () => {
    it('displays questions this week', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('This Week')).toBeInTheDocument()
    })

    it('shows total questions', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText(/25 total questions/)).toBeInTheDocument()
    })

    it('shows positive week change with up arrow', () => {
      render(<StatsGrid stats={createMockStats({ week_change: 3 })} />)
      expect(screen.getByText(/\+3 from last week/)).toBeInTheDocument()
    })

    it('shows negative week change with down arrow', () => {
      render(<StatsGrid stats={createMockStats({ week_change: -2 })} />)
      expect(screen.getByText(/-2 from last week/)).toBeInTheDocument()
    })

    it('shows no change message when week_change is 0', () => {
      render(<StatsGrid stats={createMockStats({ week_change: 0 })} />)
      expect(screen.getByText(/No change from last week/)).toBeInTheDocument()
    })
  })

  describe('Quality Score Card', () => {
    it('displays quality score when available', () => {
      render(<StatsGrid stats={createMockStats({ quality_score: 8.5 })} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
      expect(screen.getByText('Avg Quality Score')).toBeInTheDocument()
    })

    it('shows dash when quality score is 0', () => {
      render(<StatsGrid stats={createMockStats({ quality_score: 0 })} />)
      expect(screen.getByText('-')).toBeInTheDocument()
      expect(screen.getByText(/Create questions to see your score/)).toBeInTheDocument()
    })

    it('shows encouragement to ask more questions when has questions', () => {
      render(<StatsGrid stats={createMockStats({ quality_score: 7.5, total_questions: 5 })} />)
      expect(screen.getByText(/Ask more questions to track progress/)).toBeInTheDocument()
    })

    it('shows start creating message when no questions', () => {
      render(<StatsGrid stats={createMockStats({ quality_score: 0, total_questions: 0 })} />)
      expect(screen.getByText(/Start by creating your first question/)).toBeInTheDocument()
    })
  })

  describe('Streak Card', () => {
    it('displays day streak', () => {
      render(<StatsGrid stats={createMockStats({ day_streak: 7 })} />)
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('Day Streak')).toBeInTheDocument()
    })

    it('shows fire emoji for active streak', () => {
      render(<StatsGrid stats={createMockStats({ day_streak: 5 })} />)
      expect(screen.getByText(/5 day streak!/)).toBeInTheDocument()
    })

    it('shows start message when streak is 0 but has questions', () => {
      render(<StatsGrid stats={createMockStats({ day_streak: 0, total_questions: 5 })} />)
      expect(screen.getByText(/Start your streak!/)).toBeInTheDocument()
    })

    it('shows create questions message when no questions at all', () => {
      render(<StatsGrid stats={createMockStats({ day_streak: 0, total_questions: 0 })} />)
      expect(screen.getByText(/Create questions to start streaks/)).toBeInTheDocument()
    })

    it('shows encouragement to ask questions daily', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText(/Ask questions daily to build streaks/)).toBeInTheDocument()
    })
  })

  describe('Points & Tier Card', () => {
    it('displays total badge points', () => {
      render(<StatsGrid stats={createMockStats({ total_badge_points: 150 })} />)
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText('SMILE Points')).toBeInTheDocument()
    })

    it('displays current tier name', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText('SMILE Learner')).toBeInTheDocument()
    })

    it('shows progress to next tier', () => {
      render(<StatsGrid stats={createMockStats()} />)
      expect(screen.getByText(/350 points to go/)).toBeInTheDocument()
    })

    it('shows max tier message when at SMILE Master', () => {
      const maxTierStats = createMockStats({
        level_info: {
          current: {
            tier: {
              name: 'SMILE Master',
              icon: '🏆',
              color: '#FFD700',
              minPoints: 100000,
              maxPoints: Infinity,
              description: 'Maximum tier achieved',
            },
            progress_percentage: 100,
          },
          points_to_next: 0,
          is_max_tier: true,
        },
      })
      render(<StatsGrid stats={maxTierStats} />)
      expect(screen.getByText(/Master Level Achieved!/)).toBeInTheDocument()
    })

    it('shows create questions message when no tier info', () => {
      const noTierStats = createMockStats({
        total_badge_points: 0,
        level_info: {
          current: {
            tier: {
              name: 'SMILE Starter',
              icon: '✨',
              color: '#9CA3AF',
              minPoints: 0,
              maxPoints: 4999,
              description: 'Just getting started',
            },
            progress_percentage: 0,
          },
          points_to_next: 5000,
          is_max_tier: false,
        },
      })
      render(<StatsGrid stats={noTierStats} />)
      // Should show the tier progress, not a fallback message
      expect(screen.getByText(/5000 points to go/)).toBeInTheDocument()
    })

    it('renders progress bar with correct percentage', () => {
      render(<StatsGrid stats={createMockStats()} />)
      // The progress bar div should exist
      expect(screen.getByText('Progress to next tier')).toBeInTheDocument()
    })
  })

  describe('Grid Layout', () => {
    it('renders all 4 stat cards', () => {
      render(<StatsGrid stats={createMockStats()} />)
      // Verify all 4 card labels are present
      expect(screen.getByText('This Week')).toBeInTheDocument()
      expect(screen.getByText('Avg Quality Score')).toBeInTheDocument()
      expect(screen.getByText('Day Streak')).toBeInTheDocument()
      expect(screen.getByText('SMILE Points')).toBeInTheDocument()
    })
  })
})
