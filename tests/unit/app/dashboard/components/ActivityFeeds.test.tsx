import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// Components will be imported after creation
import { ActivityFeed, CommunityFeed } from '@/app/(dashboard)/dashboard/components'
import type { ProcessedActivity } from '@/app/(dashboard)/dashboard/types'

const mockActivity: ProcessedActivity = {
  id: '1',
  title: 'Created question in Math 101',
  subtitle: 'What is the derivative of...',
  timestamp: new Date('2026-01-18'),
  icon: 'fa-question-circle',
  color: 'blue',
  badge_progress: true,
}

const mockActivities: ProcessedActivity[] = [
  mockActivity,
  {
    id: '2',
    title: 'Joined Biology Study Group',
    subtitle: 'Welcome to the group!',
    timestamp: new Date('2026-01-17'),
    icon: 'fa-users',
    color: 'green',
    badge_progress: false,
  },
]

describe('ActivityFeed', () => {
  describe('empty state', () => {
    it('shows empty state when no activities', () => {
      render(<ActivityFeed activities={[]} />)
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })

    it('shows getting started hint', () => {
      render(<ActivityFeed activities={[]} />)
      expect(screen.getByText(/Start by joining a group or creating questions/)).toBeInTheDocument()
    })

    it('shows inbox icon in empty state', () => {
      const { container } = render(<ActivityFeed activities={[]} />)
      expect(container.querySelector('.fa-inbox')).toBeInTheDocument()
    })
  })

  describe('with activities', () => {
    it('renders activity items', () => {
      render(<ActivityFeed activities={mockActivities} />)
      expect(screen.getByText('Created question in Math 101')).toBeInTheDocument()
      expect(screen.getByText('Joined Biology Study Group')).toBeInTheDocument()
    })

    it('shows activity subtitle', () => {
      render(<ActivityFeed activities={[mockActivity]} />)
      expect(screen.getByText(/What is the derivative of/)).toBeInTheDocument()
    })

    it('shows High Quality badge when badge_progress is true', () => {
      render(<ActivityFeed activities={[mockActivity]} />)
      expect(screen.getByText(/High Quality!/)).toBeInTheDocument()
    })

    it('does not show High Quality badge when badge_progress is false', () => {
      const activityWithoutBadge = { ...mockActivity, badge_progress: false }
      render(<ActivityFeed activities={[activityWithoutBadge]} />)
      expect(screen.queryByText(/High Quality!/)).not.toBeInTheDocument()
    })

    it('formats timestamp correctly', () => {
      render(<ActivityFeed activities={[mockActivity]} />)
      // Using regex to handle timezone differences (UTC midnight shows as previous day in some timezones)
      expect(screen.getByText(/Jan 1[78], 2026/)).toBeInTheDocument()
    })
  })

  describe('header and actions', () => {
    it('shows Your Activity heading', () => {
      render(<ActivityFeed activities={[]} />)
      expect(screen.getByText('Your Activity')).toBeInTheDocument()
    })

    it('shows user-clock icon in header', () => {
      const { container } = render(<ActivityFeed activities={[]} />)
      expect(container.querySelector('.fa-user-clock')).toBeInTheDocument()
    })

    it('has View All link to /my-events', () => {
      render(<ActivityFeed activities={[]} />)
      expect(screen.getByRole('link', { name: /View All/i })).toHaveAttribute('href', '/my-events')
    })

    it('shows streak motivation text', () => {
      render(<ActivityFeed activities={[]} />)
      expect(screen.getByText(/Keep your streak alive!/)).toBeInTheDocument()
    })

    it('has Ask Today\'s Question button linking to /activities', () => {
      render(<ActivityFeed activities={[]} />)
      expect(screen.getByRole('link', { name: /Ask Today's Question/i })).toHaveAttribute('href', '/activities')
    })
  })

  describe('styling', () => {
    it('has white background with shadow', () => {
      const { container } = render(<ActivityFeed activities={[]} />)
      expect(container.firstChild).toHaveClass('bg-white', 'shadow')
    })
  })
})

describe('CommunityFeed', () => {
  describe('header', () => {
    it('renders Community Buzz heading', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText('Community Buzz')).toBeInTheDocument()
    })

    it('shows globe icon in header', () => {
      const { container } = render(<CommunityFeed totalQuestions={0} />)
      expect(container.querySelector('.fa-globe')).toBeInTheDocument()
    })

    it('shows Live badge', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  describe('community members', () => {
    it('shows Dr. Sarah Chen activity', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText(/Dr. Sarah Chen/)).toBeInTheDocument()
      expect(screen.getByText(/Research Master/)).toBeInTheDocument()
    })

    it('shows Marcus Rodriguez activity', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText(/Marcus Rodriguez/)).toBeInTheDocument()
      expect(screen.getByText(/quantum computing/)).toBeInTheDocument()
    })

    it('shows Emma Johnson activity', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText(/Emma Johnson/)).toBeInTheDocument()
    })

    it('shows Prof. Ahmed Hassan activity', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText(/Prof. Ahmed Hassan/)).toBeInTheDocument()
    })
  })

  describe('weekly challenge', () => {
    it('shows weekly challenge section', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText(/Weekly Challenge/)).toBeInTheDocument()
    })

    it('shows Subject Explorer challenge name', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText(/Subject Explorer/)).toBeInTheDocument()
    })

    it('has Join Challenge button linking to /dashboard/join-challenge', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByRole('link', { name: /Join Challenge/i })).toHaveAttribute('href', '/dashboard/join-challenge')
    })

    it('shows 156 participants when totalQuestions > 0', () => {
      render(<CommunityFeed totalQuestions={5} />)
      expect(screen.getByText(/156 participants/)).toBeInTheDocument()
    })

    it('shows 89 participants when totalQuestions is 0', () => {
      render(<CommunityFeed totalQuestions={0} />)
      expect(screen.getByText(/89 participants/)).toBeInTheDocument()
    })
  })

  describe('footer stats', () => {
    it('shows active learners count', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText('847')).toBeInTheDocument()
      expect(screen.getByText(/active learners this week/)).toBeInTheDocument()
    })

    it('shows Join the conversation text', () => {
      render(<CommunityFeed totalQuestions={10} />)
      expect(screen.getByText('Join the conversation!')).toBeInTheDocument()
    })
  })

  describe('dynamic content based on totalQuestions', () => {
    it('shows 25-day streak when totalQuestions > 1', () => {
      render(<CommunityFeed totalQuestions={5} />)
      expect(screen.getByText(/25-day learning streak/)).toBeInTheDocument()
    })

    it('shows 7-day streak when totalQuestions <= 1', () => {
      render(<CommunityFeed totalQuestions={0} />)
      expect(screen.getByText(/7-day learning streak/)).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('has white background with shadow', () => {
      const { container } = render(<CommunityFeed totalQuestions={0} />)
      expect(container.firstChild).toHaveClass('bg-white', 'shadow')
    })
  })
})
