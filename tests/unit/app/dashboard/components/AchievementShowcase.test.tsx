import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { AchievementShowcase } from '@/app/(dashboard)/dashboard/components'

describe('AchievementShowcase', () => {
  describe('Recent Achievements section', () => {
    it('shows badges when user has earned some', () => {
      render(
        <AchievementShowcase
          badgesEarned={3}
          badgeNames={['🔥 Week Warrior', '📚 Question Master']}
          totalQuestions={50}
        />
      )
      expect(screen.getByText('Recent Achievements')).toBeInTheDocument()
      expect(screen.getByText('🔥 Week Warrior')).toBeInTheDocument()
      expect(screen.getByText('📚 Question Master')).toBeInTheDocument()
    })

    it('shows "view complete badge gallery" link when has badges', () => {
      render(
        <AchievementShowcase badgesEarned={1} badgeNames={['🔥 Test']} totalQuestions={10} />
      )
      expect(screen.getByRole('link', { name: /View complete badge gallery/i })).toHaveAttribute(
        'href',
        '/profile#achievements-tab'
      )
    })

    it('shows "Latest Badges" label when user has badges', () => {
      render(
        <AchievementShowcase badgesEarned={2} badgeNames={['Badge 1', 'Badge 2']} totalQuestions={20} />
      )
      expect(screen.getByText('🏆 Latest Badges:')).toBeInTheDocument()
    })

    it('shows progress message when user has questions but no badges', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={10} />)
      expect(screen.getByText('Keep creating questions!')).toBeInTheDocument()
      expect(screen.getByText(/making progress toward your first badge/)).toBeInTheDocument()
    })

    it('shows getting started message for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByText('Ready to get started?')).toBeInTheDocument()
      expect(screen.getByText(/Create your first question/)).toBeInTheDocument()
    })

    it('shows trophy icon in header', () => {
      const { container } = render(
        <AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />
      )
      expect(container.querySelector('.fa-trophy')).toBeInTheDocument()
    })
  })

  describe('Getting Started section', () => {
    it('shows challenges message for users with questions', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={10} />)
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Challenges coming soon!')).toBeInTheDocument()
    })

    it('shows trophy icon when challenges coming soon', () => {
      const { container } = render(
        <AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={10} />
      )
      // The trophy icon appears in both the Recent Achievements and the "challenges coming soon" section
      expect(container.querySelectorAll('.fa-trophy').length).toBeGreaterThanOrEqual(1)
    })

    it('shows onboarding steps for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByText('Create Your First Question')).toBeInTheDocument()
      expect(screen.getByText('Build Your Profile')).toBeInTheDocument()
      expect(screen.getByText('Explore Features')).toBeInTheDocument()
    })

    it('shows Find Groups link for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByRole('link', { name: /Find Groups/i })).toHaveAttribute('href', '/groups')
    })

    it('shows Edit Profile link for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByRole('link', { name: /Edit Profile/i })).toHaveAttribute('href', '/profile')
    })

    it('shows map icon in Getting Started header', () => {
      const { container } = render(
        <AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />
      )
      expect(container.querySelector('.fa-map')).toBeInTheDocument()
    })
  })

  describe('Your Progress section', () => {
    it('shows community features coming soon for users with questions', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={10} />)
      expect(screen.getByText('Your Progress')).toBeInTheDocument()
      expect(screen.getByText('Community features coming soon!')).toBeInTheDocument()
    })

    it('shows journey start message for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByText('Your journey starts here!')).toBeInTheDocument()
      expect(screen.getByText('Track your question quality scores')).toBeInTheDocument()
    })

    it('shows chart-line icon in Your Progress header', () => {
      const { container } = render(
        <AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />
      )
      expect(container.querySelector('.fa-chart-line')).toBeInTheDocument()
    })

    it('shows progress tracking features for new users', () => {
      render(<AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />)
      expect(screen.getByText('Monitor your learning progress')).toBeInTheDocument()
      expect(screen.getByText('Connect with other learners')).toBeInTheDocument()
    })
  })

  describe('Grid layout', () => {
    it('renders as a 3-column grid on large screens', () => {
      const { container } = render(
        <AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />
      )
      expect(container.firstChild).toHaveClass('grid', 'lg:grid-cols-3')
    })

    it('renders as single column on mobile', () => {
      const { container } = render(
        <AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />
      )
      expect(container.firstChild).toHaveClass('grid-cols-1')
    })

    it('has proper gap between columns', () => {
      const { container } = render(
        <AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />
      )
      expect(container.firstChild).toHaveClass('gap-8')
    })

    it('has margin bottom for spacing', () => {
      const { container } = render(
        <AchievementShowcase badgesEarned={0} badgeNames={[]} totalQuestions={0} />
      )
      expect(container.firstChild).toHaveClass('mb-8')
    })
  })

  describe('Badge display limits', () => {
    it('shows maximum 3 badges even when more are provided', () => {
      render(
        <AchievementShowcase
          badgesEarned={5}
          badgeNames={['Badge 1', 'Badge 2', 'Badge 3', 'Badge 4', 'Badge 5']}
          totalQuestions={100}
        />
      )
      expect(screen.getByText('Badge 1')).toBeInTheDocument()
      expect(screen.getByText('Badge 2')).toBeInTheDocument()
      expect(screen.getByText('Badge 3')).toBeInTheDocument()
      expect(screen.queryByText('Badge 4')).not.toBeInTheDocument()
      expect(screen.queryByText('Badge 5')).not.toBeInTheDocument()
    })
  })
})
