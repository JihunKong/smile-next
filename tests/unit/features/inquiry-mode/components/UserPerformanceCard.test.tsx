/**
 * Tests for UserPerformanceCard Component
 */

import { render, screen } from '@testing-library/react'
import { UserPerformanceCard } from '@/features/inquiry-mode/components/UserPerformanceCard'
import type { UserSummary } from '@/features/inquiry-mode'

const defaultLabels = {
  title: 'Your Performance',
  bestScore: 'Your Best Score',
  rank: 'Your Rank',
  totalAttempts: 'Total Attempts',
  passRate: 'Your Pass Rate',
}

const defaultSummary: UserSummary = {
  bestScore: 85.5,
  rank: 3,
  totalAttempts: 5,
  passRate: 80.0,
}

describe('UserPerformanceCard', () => {
  describe('Rendering', () => {
    it('should render title', () => {
      render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Your Performance')).toBeInTheDocument()
    })

    it('should render all stat labels', () => {
      render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Your Best Score')).toBeInTheDocument()
      expect(screen.getByText('Your Rank')).toBeInTheDocument()
      expect(screen.getByText('Total Attempts')).toBeInTheDocument()
      expect(screen.getByText('Your Pass Rate')).toBeInTheDocument()
    })
  })

  describe('Values Display', () => {
    it('should display best score with percentage', () => {
      render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('85.5%')).toBeInTheDocument()
    })

    it('should display rank with # prefix', () => {
      render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('#3')).toBeInTheDocument()
    })

    it('should display total attempts', () => {
      render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should display pass rate with percentage', () => {
      render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('80.0%')).toBeInTheDocument()
    })
  })

  describe('Value Formatting', () => {
    it('should format decimal values to one decimal place', () => {
      const summary: UserSummary = {
        ...defaultSummary,
        bestScore: 75.333,
        passRate: 66.666,
      }
      render(
        <UserPerformanceCard
          summary={summary}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('75.3%')).toBeInTheDocument()
      expect(screen.getByText('66.7%')).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const summary: UserSummary = {
        bestScore: 0,
        rank: 1,
        totalAttempts: 0,
        passRate: 0,
      }
      render(
        <UserPerformanceCard
          summary={summary}
          labels={defaultLabels}
        />
      )
      // Both bestScore and passRate display as 0.0%
      expect(screen.getAllByText('0.0%').length).toBe(2)
      expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
    })

    it('should handle perfect scores', () => {
      const summary: UserSummary = {
        bestScore: 100,
        rank: 1,
        totalAttempts: 10,
        passRate: 100,
      }
      render(
        <UserPerformanceCard
          summary={summary}
          labels={defaultLabels}
        />
      )
      expect(screen.getAllByText('100.0%').length).toBe(2)
    })
  })

  describe('Styling', () => {
    it('should have gradient background', () => {
      const { container } = render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('bg-gradient')
    })

    it('should have white text color', () => {
      const { container } = render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('text-white')
    })
  })

  describe('Grid Layout', () => {
    it('should render four stat sections', () => {
      const { container } = render(
        <UserPerformanceCard
          summary={defaultSummary}
          labels={defaultLabels}
        />
      )
      const grid = container.querySelector('.grid')
      expect(grid?.children.length).toBe(4)
    })
  })
})
