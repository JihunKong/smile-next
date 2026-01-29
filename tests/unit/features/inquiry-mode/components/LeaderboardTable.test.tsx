/**
 * Tests for LeaderboardTable Component
 */

import { render, screen } from '@testing-library/react'
import { LeaderboardTable } from '@/features/inquiry-mode/components/LeaderboardTable'
import type { LeaderboardEntry } from '@/features/inquiry-mode'

const defaultLabels = {
  rank: 'Rank',
  student: 'Student',
  qualityScore: 'Quality Score',
  status: 'Status',
  questions: 'Questions',
  bloomLevel: 'Bloom Level',
  time: 'Time',
  date: 'Date',
  passed: 'Passed',
  failed: 'Failed',
  you: 'You',
  noAttempts: 'No attempts yet',
  beFirst: 'Be the first!',
}

const mockEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: 'user1',
    userName: 'John Doe',
    qualityScore: 8.5,
    qualityPercentage: 85,
    passed: true,
    questionsGenerated: 5,
    questionsRequired: 5,
    avgBloomLevel: 4.2,
    timeTaken: '12m 30s',
    attemptNumber: 1,
    submittedAt: new Date('2024-01-15'),
    filterType: 'best',
  },
  {
    rank: 2,
    userId: 'user2',
    userName: 'Jane Smith',
    qualityScore: 5.5,
    qualityPercentage: 55,
    passed: false,
    questionsGenerated: 5,
    questionsRequired: 5,
    avgBloomLevel: 2.8,
    timeTaken: '15m 45s',
    attemptNumber: 2,
    submittedAt: new Date('2024-01-16'),
    filterType: 'recent',
  },
]

describe('LeaderboardTable', () => {
  describe('Rendering', () => {
    it('should render table headers', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Rank')).toBeInTheDocument()
      expect(screen.getByText('Student')).toBeInTheDocument()
      expect(screen.getByText('Quality Score')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should render all leaderboard entries', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should render rank numbers', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()
    })
  })

  describe('Score Display', () => {
    it('should display quality percentages', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('85.0%')).toBeInTheDocument()
      expect(screen.getByText('55.0%')).toBeInTheDocument()
    })

    it('should display raw scores', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('(8.5/10)')).toBeInTheDocument()
      expect(screen.getByText('(5.5/10)')).toBeInTheDocument()
    })
  })

  describe('Pass/Fail Status', () => {
    it('should show Passed status for passing entries', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Passed')).toBeInTheDocument()
    })

    it('should show Failed status for failing entries', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })
  })

  describe('Current User Highlighting', () => {
    it('should highlight current user row', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user1"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('You')).toBeInTheDocument()
    })

    it('should not show You badge for other users', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.queryByText('You')).not.toBeInTheDocument()
    })
  })

  describe('Questions Display', () => {
    it('should display questions generated/required', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getAllByText('5/5').length).toBe(2)
    })
  })

  describe('Bloom Level Display', () => {
    it('should display average bloom levels', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('4.2')).toBeInTheDocument()
      expect(screen.getByText('2.8')).toBeInTheDocument()
    })
  })

  describe('Time Display', () => {
    it('should display time taken', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('12m 30s')).toBeInTheDocument()
      expect(screen.getByText('15m 45s')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no entries', () => {
      render(
        <LeaderboardTable
          entries={[]}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('No attempts yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first!')).toBeInTheDocument()
    })
  })

  describe('User Avatar', () => {
    it('should display first letter of user name as avatar', () => {
      render(
        <LeaderboardTable
          entries={mockEntries}
          currentUserId="user3"
          labels={defaultLabels}
        />
      )
      // Both John Doe and Jane Smith start with J
      const avatars = screen.getAllByText('J')
      expect(avatars.length).toBe(2)
    })
  })
})
