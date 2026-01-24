import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityActions } from '@/features/activities/components/ActivityDetail/ActivityActions'
import { ActivityModes } from '@/types/activities'

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode, href: string }) =>
        <a href={href}>{children}</a>
}))

describe('ActivityActions', () => {
    const defaultProps = {
        activityId: 'activity-1',
        mode: ActivityModes.OPEN,
        isManager: true
    }

    describe('Manager actions', () => {
        it('renders Edit Activity link for manager', () => {
            render(<ActivityActions {...defaultProps} />)
            const editLink = screen.getByRole('link', { name: /edit activity/i })
            expect(editLink).toBeInTheDocument()
            expect(editLink).toHaveAttribute('href', '/activities/activity-1/edit')
        })

        it('renders Leaderboard link', () => {
            render(<ActivityActions {...defaultProps} />)
            const leaderboardLink = screen.getByRole('link', { name: /leaderboard/i })
            expect(leaderboardLink).toBeInTheDocument()
            expect(leaderboardLink).toHaveAttribute('href', '/activities/activity-1/leaderboard')
        })

        it('does not render Edit Activity link for non-manager', () => {
            render(<ActivityActions {...defaultProps} isManager={false} />)
            expect(screen.queryByRole('link', { name: /edit activity/i })).not.toBeInTheDocument()
        })
    })

    describe('Mode-specific actions', () => {
        it('renders Ask a Question link for Open mode', () => {
            render(<ActivityActions {...defaultProps} mode={ActivityModes.OPEN} />)
            const askLink = screen.getByRole('link', { name: /ask a question/i })
            expect(askLink).toBeInTheDocument()
            expect(askLink).toHaveAttribute('href', '/activities/activity-1/questions/create')
        })

        it('renders Take Exam link for Exam mode', () => {
            render(<ActivityActions {...defaultProps} mode={ActivityModes.EXAM} />)
            const examLink = screen.getByRole('link', { name: /take exam/i })
            expect(examLink).toBeInTheDocument()
            expect(examLink).toHaveAttribute('href', '/activities/activity-1/exam')
        })

        it('renders Start Inquiry link for Inquiry mode', () => {
            render(<ActivityActions {...defaultProps} mode={ActivityModes.INQUIRY} />)
            const inquiryLink = screen.getByRole('link', { name: /start inquiry/i })
            expect(inquiryLink).toBeInTheDocument()
            expect(inquiryLink).toHaveAttribute('href', '/activities/activity-1/inquiry')
        })

        it('renders Start Case Study link for Case mode', () => {
            render(<ActivityActions {...defaultProps} mode={ActivityModes.CASE} />)
            const caseLink = screen.getByRole('link', { name: /start case study/i })
            expect(caseLink).toBeInTheDocument()
            expect(caseLink).toHaveAttribute('href', '/activities/activity-1/case')
        })
    })

    describe('Custom className', () => {
        it('applies custom className when provided', () => {
            const { container } = render(<ActivityActions {...defaultProps} className="custom-class" />)
            expect(container.firstChild).toHaveClass('custom-class')
        })
    })
})
