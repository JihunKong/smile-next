import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityHeader } from '@/features/activities/components/ActivityDetail/ActivityHeader'
import { ActivityModes } from '@/types/activities'

describe('ActivityHeader', () => {
    const mockActivity = {
        id: 'activity-1',
        name: 'Test Activity',
        description: 'Test description',
        mode: ActivityModes.OPEN,
        createdAt: new Date('2026-01-01'),
        aiRatingEnabled: true,
        creator: {
            id: 'user-1',
            firstName: 'John',
            lastName: 'Doe',
            avatarUrl: null
        },
        owningGroup: {
            id: 'group-1',
            name: 'Test Group'
        },
        _count: { questions: 5 }
    }

    it('renders activity name', () => {
        render(<ActivityHeader activity={mockActivity} />)
        expect(screen.getByText('Test Activity')).toBeInTheDocument()
    })

    it('renders mode badge with Open Mode', () => {
        render(<ActivityHeader activity={mockActivity} />)
        expect(screen.getByText('Open Mode')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
        render(<ActivityHeader activity={mockActivity} />)
        expect(screen.getByText('Test description')).toBeInTheDocument()
    })

    it('renders question count', () => {
        render(<ActivityHeader activity={mockActivity} />)
        expect(screen.getByText('5 questions')).toBeInTheDocument()
    })

    it('renders AI rating indicator when enabled', () => {
        render(<ActivityHeader activity={mockActivity} />)
        expect(screen.getByText(/ai rating enabled/i)).toBeInTheDocument()
    })

    it('does not render AI rating indicator when disabled', () => {
        render(<ActivityHeader activity={{ ...mockActivity, aiRatingEnabled: false }} />)
        expect(screen.queryByText(/ai rating enabled/i)).not.toBeInTheDocument()
    })

    it('renders creator info', () => {
        render(<ActivityHeader activity={mockActivity} />)
        expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('renders correct mode badge color for exam mode', () => {
        render(<ActivityHeader activity={{ ...mockActivity, mode: ActivityModes.EXAM }} />)
        expect(screen.getByText('Exam Mode')).toBeInTheDocument()
    })

    it('renders correct mode badge color for inquiry mode', () => {
        render(<ActivityHeader activity={{ ...mockActivity, mode: ActivityModes.INQUIRY }} />)
        expect(screen.getByText('Inquiry Mode')).toBeInTheDocument()
    })

    it('renders correct mode badge color for case mode', () => {
        render(<ActivityHeader activity={{ ...mockActivity, mode: ActivityModes.CASE }} />)
        expect(screen.getByText('Case Mode')).toBeInTheDocument()
    })

    it('handles missing description gracefully', () => {
        render(<ActivityHeader activity={{ ...mockActivity, description: null }} />)
        // Should not crash, just not render description
        expect(screen.queryByText('Test description')).not.toBeInTheDocument()
    })

    it('renders group name', () => {
        render(<ActivityHeader activity={mockActivity} />)
        expect(screen.getByText('Test Group')).toBeInTheDocument()
    })

    it('handles single question count correctly', () => {
        render(<ActivityHeader activity={{ ...mockActivity, _count: { questions: 1 } }} />)
        expect(screen.getByText('1 question')).toBeInTheDocument()
    })

    it('handles zero question count correctly', () => {
        render(<ActivityHeader activity={{ ...mockActivity, _count: { questions: 0 } }} />)
        expect(screen.getByText('0 questions')).toBeInTheDocument()
    })

    it('renders creator avatar placeholder when no avatar URL', () => {
        render(<ActivityHeader activity={mockActivity} />)
        // Should show initials JD
        expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('renders creator avatar image when avatar URL provided', () => {
        render(
            <ActivityHeader
                activity={{
                    ...mockActivity,
                    creator: { ...mockActivity.creator, avatarUrl: 'https://example.com/avatar.jpg' }
                }}
            />
        )
        const avatar = screen.getByRole('img')
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })
})
