/**
 * Tests for LeaderboardStats Component
 */

import { render, screen } from '@testing-library/react'
import { LeaderboardStats } from '@/features/inquiry-mode/components/LeaderboardStats'
import type { InquiryStats } from '@/features/inquiry-mode'

const defaultLabels = {
  totalAttempts: 'Total Attempts',
  participants: 'Participants',
  averageScore: 'Average Score',
  passRate: 'Pass Rate',
}

const defaultStats: InquiryStats = {
  totalAttempts: 25,
  uniqueStudents: 15,
  averageScore: 72.5,
  passRate: 68.0,
}

describe('LeaderboardStats', () => {
  describe('Rendering', () => {
    it('should render all stat labels', () => {
      render(<LeaderboardStats stats={defaultStats} labels={defaultLabels} />)
      expect(screen.getByText('Total Attempts')).toBeInTheDocument()
      expect(screen.getByText('Participants')).toBeInTheDocument()
      expect(screen.getByText('Average Score')).toBeInTheDocument()
      expect(screen.getByText('Pass Rate')).toBeInTheDocument()
    })

    it('should render total attempts value', () => {
      render(<LeaderboardStats stats={defaultStats} labels={defaultLabels} />)
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('should render unique students value', () => {
      render(<LeaderboardStats stats={defaultStats} labels={defaultLabels} />)
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('should render average score with percentage', () => {
      render(<LeaderboardStats stats={defaultStats} labels={defaultLabels} />)
      expect(screen.getByText('72.5%')).toBeInTheDocument()
    })

    it('should render pass rate with percentage', () => {
      render(<LeaderboardStats stats={defaultStats} labels={defaultLabels} />)
      expect(screen.getByText('68.0%')).toBeInTheDocument()
    })
  })

  describe('Value Formatting', () => {
    it('should format decimal scores to one decimal place', () => {
      const stats: InquiryStats = {
        ...defaultStats,
        averageScore: 72.333,
        passRate: 68.999,
      }
      render(<LeaderboardStats stats={stats} labels={defaultLabels} />)
      expect(screen.getByText('72.3%')).toBeInTheDocument()
      expect(screen.getByText('69.0%')).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const stats: InquiryStats = {
        totalAttempts: 0,
        uniqueStudents: 0,
        averageScore: 0,
        passRate: 0,
      }
      render(<LeaderboardStats stats={stats} labels={defaultLabels} />)
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
      // Both averageScore and passRate display as 0.0%
      expect(screen.getAllByText('0.0%').length).toBe(2)
    })

    it('should handle 100% values', () => {
      const stats: InquiryStats = {
        ...defaultStats,
        averageScore: 100,
        passRate: 100,
      }
      render(<LeaderboardStats stats={stats} labels={defaultLabels} />)
      expect(screen.getAllByText('100.0%').length).toBe(2)
    })
  })

  describe('Grid Layout', () => {
    it('should render four stat cards', () => {
      const { container } = render(
        <LeaderboardStats stats={defaultStats} labels={defaultLabels} />
      )
      const cards = container.querySelectorAll('.bg-white')
      expect(cards.length).toBe(4)
    })
  })

  describe('Color Coding', () => {
    it('should display stats with correct colors', () => {
      const { container } = render(
        <LeaderboardStats stats={defaultStats} labels={defaultLabels} />
      )
      expect(container.querySelector('.text-blue-600')).toBeInTheDocument()
      expect(container.querySelector('.text-green-600')).toBeInTheDocument()
      expect(container.querySelector('.text-yellow-600')).toBeInTheDocument()
      expect(container.querySelector('.text-purple-600')).toBeInTheDocument()
    })
  })
})
