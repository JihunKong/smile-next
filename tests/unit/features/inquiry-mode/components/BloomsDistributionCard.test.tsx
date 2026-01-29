/**
 * Tests for BloomsDistributionCard Component
 */

import { render, screen } from '@testing-library/react'
import { BloomsDistributionCard } from '@/features/inquiry-mode/components/BloomsDistributionCard'
import type { BloomsDistribution } from '@/features/inquiry-mode'

describe('BloomsDistributionCard', () => {
  describe('Rendering', () => {
    it('should render title', () => {
      const distribution: BloomsDistribution = { remember: 2, understand: 3 }
      render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Bloom's Taxonomy Levels"
        />
      )
      expect(screen.getByText("Bloom's Taxonomy Levels")).toBeInTheDocument()
    })

    it('should render all distribution levels', () => {
      const distribution: BloomsDistribution = {
        remember: 2,
        understand: 3,
        apply: 1,
      }
      render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      expect(screen.getByText(/remember: 2/i)).toBeInTheDocument()
      expect(screen.getByText(/understand: 3/i)).toBeInTheDocument()
      expect(screen.getByText(/apply: 1/i)).toBeInTheDocument()
    })

    it('should return null when distribution is empty', () => {
      const { container } = render(
        <BloomsDistributionCard
          distribution={{}}
          title="Distribution"
        />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Level Display', () => {
    it('should display count for each level', () => {
      const distribution: BloomsDistribution = {
        analyze: 4,
        evaluate: 2,
        create: 1,
      }
      render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      expect(screen.getByText(/analyze: 4/i)).toBeInTheDocument()
      expect(screen.getByText(/evaluate: 2/i)).toBeInTheDocument()
      expect(screen.getByText(/create: 1/i)).toBeInTheDocument()
    })

    it('should handle single level', () => {
      const distribution: BloomsDistribution = { understand: 5 }
      render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      expect(screen.getByText(/understand: 5/i)).toBeInTheDocument()
    })

    it('should handle all levels', () => {
      const distribution: BloomsDistribution = {
        remember: 1,
        understand: 2,
        apply: 3,
        analyze: 4,
        evaluate: 5,
        create: 6,
      }
      render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      expect(screen.getByText(/remember: 1/i)).toBeInTheDocument()
      expect(screen.getByText(/understand: 2/i)).toBeInTheDocument()
      expect(screen.getByText(/apply: 3/i)).toBeInTheDocument()
      expect(screen.getByText(/analyze: 4/i)).toBeInTheDocument()
      expect(screen.getByText(/evaluate: 5/i)).toBeInTheDocument()
      expect(screen.getByText(/create: 6/i)).toBeInTheDocument()
    })
  })

  describe('Badge Styling', () => {
    it('should render badges with rounded styling', () => {
      const distribution: BloomsDistribution = { remember: 2 }
      const { container } = render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      const badge = container.querySelector('.rounded-full')
      expect(badge).toBeInTheDocument()
    })

    it('should apply level-specific colors', () => {
      const distribution: BloomsDistribution = {
        remember: 1,
        create: 1,
      }
      const { container } = render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      // Remember should have gray colors
      expect(container.querySelector('.bg-gray-100')).toBeInTheDocument()
      // Create should have purple colors
      expect(container.querySelector('.bg-purple-100')).toBeInTheDocument()
    })
  })

  describe('Unknown Levels', () => {
    it('should handle unknown level', () => {
      const distribution: BloomsDistribution = { unknown: 3 }
      render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      expect(screen.getByText(/unknown: 3/i)).toBeInTheDocument()
    })
  })

  describe('Card Styling', () => {
    it('should have white background', () => {
      const distribution: BloomsDistribution = { remember: 1 }
      const { container } = render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('bg-white')
    })

    it('should have shadow styling', () => {
      const distribution: BloomsDistribution = { remember: 1 }
      const { container } = render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('shadow')
    })
  })

  describe('Flex Layout', () => {
    it('should render badges in flex container', () => {
      const distribution: BloomsDistribution = {
        remember: 1,
        understand: 2,
        apply: 3,
      }
      const { container } = render(
        <BloomsDistributionCard
          distribution={distribution}
          title="Distribution"
        />
      )
      const flexContainer = container.querySelector('.flex.flex-wrap')
      expect(flexContainer).toBeInTheDocument()
    })
  })
})
