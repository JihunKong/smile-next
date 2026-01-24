import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InquiryModeContent } from '@/features/activities/components/ModeContent/InquiryModeContent'

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode, href: string }) =>
        <a href={href}>{children}</a>
}))

describe('InquiryModeContent', () => {
    const defaultProps = {
        activityId: 'activity-1',
        questionsRequired: 5,
        timePerQuestion: 240,
        passThreshold: 6.0,
        keywordCount1: 10,
        keywordCount2: 8,
        isPublished: true
    }

    describe('Inquiry Settings Display', () => {
        it('renders questions required', () => {
            render(<InquiryModeContent {...defaultProps} />)
            expect(screen.getByText('5')).toBeInTheDocument()
            expect(screen.getByText('Questions Required')).toBeInTheDocument()
        })

        it('renders time per question in minutes', () => {
            render(<InquiryModeContent {...defaultProps} />)
            expect(screen.getByText('4')).toBeInTheDocument()
            expect(screen.getByText('Minutes/Question')).toBeInTheDocument()
        })

        it('renders pass threshold', () => {
            render(<InquiryModeContent {...defaultProps} />)
            expect(screen.getByText('6.0')).toBeInTheDocument()
            expect(screen.getByText('Min Score')).toBeInTheDocument()
        })
    })

    describe('Keyword Pools', () => {
        it('renders keyword pool 1 count', () => {
            render(<InquiryModeContent {...defaultProps} />)
            expect(screen.getByText('10')).toBeInTheDocument()
            expect(screen.getByText('Concepts')).toBeInTheDocument()
        })

        it('renders keyword pool 2 count', () => {
            render(<InquiryModeContent {...defaultProps} />)
            expect(screen.getByText('8')).toBeInTheDocument()
            expect(screen.getByText('Actions')).toBeInTheDocument()
        })
    })

    describe('Actions', () => {
        it('renders Start Inquiry button when published', () => {
            render(<InquiryModeContent {...defaultProps} isPublished={true} />)
            const startLink = screen.getByRole('link', { name: /start inquiry/i })
            expect(startLink).toBeInTheDocument()
            expect(startLink).toHaveAttribute('href', '/activities/activity-1/inquiry')
        })

        it('does not render Start Inquiry button when not published', () => {
            render(<InquiryModeContent {...defaultProps} isPublished={false} />)
            expect(screen.queryByRole('link', { name: /start inquiry/i })).not.toBeInTheDocument()
        })

        it('renders View Leaderboard link', () => {
            render(<InquiryModeContent {...defaultProps} />)
            const leaderboardLink = screen.getByRole('link', { name: /leaderboard/i })
            expect(leaderboardLink).toBeInTheDocument()
            expect(leaderboardLink).toHaveAttribute('href', '/activities/activity-1/leaderboard')
        })
    })
})
