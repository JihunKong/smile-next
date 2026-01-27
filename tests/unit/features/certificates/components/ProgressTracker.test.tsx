/**
 * ProgressTracker Component Tests
 *
 * TDD tests for the ProgressTracker component that displays
 * certificate completion progress with activity status.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProgressTracker } from '@/features/certificates/components/ProgressTracker'
import type { ActivityProgress } from '@/features/certificates/types'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockActivities: ActivityProgress[] = [
  {
    id: 'ap-1',
    activity: {
      id: 'act-1',
      name: 'Introduction to Web Dev',
      description: 'Learn basics',
      activityType: 'lesson',
      owningGroupId: 'group-1',
    },
    sequenceOrder: 1,
    required: true,
    status: 'completed',
    score: 100,
    completedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'ap-2',
    activity: {
      id: 'act-2',
      name: 'HTML Basics Quiz',
      description: 'Test your knowledge',
      activityType: 'quiz',
      owningGroupId: 'group-1',
    },
    sequenceOrder: 2,
    required: true,
    status: 'in_progress',
  },
  {
    id: 'ap-3',
    activity: {
      id: 'act-3',
      name: 'CSS Project',
      description: 'Build a website',
      activityType: 'project',
      owningGroupId: 'group-1',
    },
    sequenceOrder: 3,
    required: false,
    status: 'not_started',
  },
]

const mockProgress = {
  completed: 1,
  inProgress: 1,
  notStarted: 1,
  total: 3,
  percentage: 33,
}

describe('ProgressTracker', () => {
  // ===========================================================================
  // Progress Bar Tests
  // ===========================================================================

  describe('Progress Bar', () => {
    it('renders progress percentage', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      expect(screen.getByText('33%')).toBeInTheDocument()
    })

    it('renders progress bar with correct width', () => {
      const { container } = render(
        <ProgressTracker activities={mockActivities} progress={mockProgress} />
      )

      const progressFill = container.querySelector('[data-testid="progress-fill"]')
      expect(progressFill).toHaveStyle({ width: '33%' })
    })

    it('shows 100% when all complete', () => {
      const fullProgress = { ...mockProgress, percentage: 100, completed: 3, notStarted: 0, inProgress: 0 }
      render(<ProgressTracker activities={mockActivities} progress={fullProgress} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('shows completion stats', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      expect(screen.getByText(/1.*of.*3/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Activity List Tests
  // ===========================================================================

  describe('Activity List', () => {
    it('renders all activities', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      expect(screen.getByText('Introduction to Web Dev')).toBeInTheDocument()
      expect(screen.getByText('HTML Basics Quiz')).toBeInTheDocument()
      expect(screen.getByText('CSS Project')).toBeInTheDocument()
    })

    it('shows completed status indicator', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      const completedIndicator = screen.getByTestId('status-completed')
      expect(completedIndicator).toBeInTheDocument()
    })

    it('shows in_progress status indicator', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      const inProgressIndicator = screen.getByTestId('status-in_progress')
      expect(inProgressIndicator).toBeInTheDocument()
    })

    it('shows not_started status indicator', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      const notStartedIndicator = screen.getByTestId('status-not_started')
      expect(notStartedIndicator).toBeInTheDocument()
    })

    it('shows activity type badge', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      expect(screen.getByText('lesson')).toBeInTheDocument()
      expect(screen.getByText('quiz')).toBeInTheDocument()
      expect(screen.getByText('project')).toBeInTheDocument()
    })

    it('shows required badge for required activities', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      const requiredBadges = screen.getAllByText('Required')
      expect(requiredBadges).toHaveLength(2)
    })

    it('shows optional label for non-required activities', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      expect(screen.getByText('Optional')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Activity Links Tests
  // ===========================================================================

  describe('Activity Links', () => {
    it('renders activity links when certificateId provided', () => {
      render(
        <ProgressTracker
          activities={mockActivities}
          progress={mockProgress}
          certificateId="cert-1"
        />
      )

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    it('activity links point to correct URL', () => {
      render(
        <ProgressTracker
          activities={mockActivities}
          progress={mockProgress}
          certificateId="cert-1"
        />
      )

      const link = screen.getByRole('link', { name: /Introduction to Web Dev/i })
      expect(link).toHaveAttribute('href', expect.stringContaining('act-1'))
    })
  })

  // ===========================================================================
  // Compact Mode Tests
  // ===========================================================================

  describe('Compact Mode', () => {
    it('hides activity descriptions in compact mode', () => {
      render(
        <ProgressTracker
          activities={mockActivities}
          progress={mockProgress}
          compact
        />
      )

      expect(screen.queryByText('Learn basics')).not.toBeInTheDocument()
    })

    it('shows progress bar in compact mode', () => {
      render(
        <ProgressTracker
          activities={mockActivities}
          progress={mockProgress}
          compact
        />
      )

      expect(screen.getByText('33%')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Score Display Tests
  // ===========================================================================

  describe('Score Display', () => {
    it('shows score for completed activities', () => {
      render(<ProgressTracker activities={mockActivities} progress={mockProgress} />)

      expect(screen.getByText(/Score:.*100%/)).toBeInTheDocument()
    })

    it('does not show score for incomplete activities', () => {
      const incompleteActivities = mockActivities.map(a => ({
        ...a,
        status: 'not_started' as const,
        score: undefined,
      }))
      render(<ProgressTracker activities={incompleteActivities} progress={mockProgress} />)

      // Only progress percentage, no score displays
      const percentages = screen.getAllByText(/\d+%/)
      expect(percentages).toHaveLength(1) // Just the progress bar
    })
  })
})
