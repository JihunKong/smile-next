import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CaseModeContent } from '@/features/activities/components/ModeContent/CaseModeContent'

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode, href: string }) =>
        <a href={href}>{children}</a>
}))

describe('CaseModeContent', () => {
    const defaultProps = {
        activityId: 'activity-1',
        numCases: 5,
        totalTimeLimit: 60,
        maxAttempts: 2,
        passThreshold: 6.0,
        isPublished: true
    }

    describe('Case Settings Display', () => {
        it('renders number of cases', () => {
            render(<CaseModeContent {...defaultProps} />)
            expect(screen.getByText('5')).toBeInTheDocument()
            expect(screen.getByText('Cases')).toBeInTheDocument()
        })

        it('renders total time limit', () => {
            render(<CaseModeContent {...defaultProps} />)
            expect(screen.getByText('60')).toBeInTheDocument()
            expect(screen.getByText('Minutes')).toBeInTheDocument()
        })

        it('renders max attempts', () => {
            render(<CaseModeContent {...defaultProps} />)
            expect(screen.getByText('2')).toBeInTheDocument()
            expect(screen.getByText('Attempts')).toBeInTheDocument()
        })

        it('renders pass threshold', () => {
            render(<CaseModeContent {...defaultProps} />)
            expect(screen.getByText('6.0')).toBeInTheDocument()
            expect(screen.getByText('Min Score')).toBeInTheDocument()
        })
    })

    describe('Published Status', () => {
        it('renders published badge when published', () => {
            render(<CaseModeContent {...defaultProps} isPublished={true} />)
            expect(screen.getByText('Published')).toBeInTheDocument()
        })

        it('renders draft badge when not published', () => {
            render(<CaseModeContent {...defaultProps} isPublished={false} />)
            expect(screen.getByText('Draft')).toBeInTheDocument()
        })
    })

    describe('Actions', () => {
        it('renders Start Case Study button when published', () => {
            render(<CaseModeContent {...defaultProps} isPublished={true} />)
            const startLink = screen.getByRole('link', { name: /start case study/i })
            expect(startLink).toBeInTheDocument()
            expect(startLink).toHaveAttribute('href', '/activities/activity-1/case')
        })

        it('does not render Start Case Study button when not published', () => {
            render(<CaseModeContent {...defaultProps} isPublished={false} />)
            expect(screen.queryByRole('link', { name: /start case study/i })).not.toBeInTheDocument()
        })

        it('renders View Leaderboard link', () => {
            render(<CaseModeContent {...defaultProps} />)
            const leaderboardLink = screen.getByRole('link', { name: /leaderboard/i })
            expect(leaderboardLink).toBeInTheDocument()
            expect(leaderboardLink).toHaveAttribute('href', '/activities/activity-1/leaderboard')
        })
    })
})
