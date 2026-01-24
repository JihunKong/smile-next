import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExamModeContent } from '@/features/activities/components/ModeContent/ExamModeContent'

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode, href: string }) =>
        <a href={href}>{children}</a>
}))

describe('ExamModeContent', () => {
    const defaultProps = {
        activityId: 'activity-1',
        timeLimit: 30,
        questionsToShow: 20,
        passThreshold: 70,
        maxAttempts: 2,
        isPublished: true,
        isManager: false,
        attemptCount: 15,
        avgScore: 78
    }

    describe('Exam Settings Display', () => {
        it('renders time limit', () => {
            render(<ExamModeContent {...defaultProps} />)
            expect(screen.getByText('30')).toBeInTheDocument()
            expect(screen.getByText('Minutes')).toBeInTheDocument()
        })

        it('renders question count', () => {
            render(<ExamModeContent {...defaultProps} />)
            expect(screen.getByText('20')).toBeInTheDocument()
            expect(screen.getByText('Questions')).toBeInTheDocument()
        })

        it('renders pass threshold', () => {
            render(<ExamModeContent {...defaultProps} />)
            expect(screen.getByText('70%')).toBeInTheDocument()
            expect(screen.getByText('Pass Threshold')).toBeInTheDocument()
        })

        it('renders max attempts', () => {
            render(<ExamModeContent {...defaultProps} />)
            expect(screen.getByText('2')).toBeInTheDocument()
            expect(screen.getByText('Max Attempts')).toBeInTheDocument()
        })
    })

    describe('Published Status', () => {
        it('renders published badge when published', () => {
            render(<ExamModeContent {...defaultProps} isPublished={true} />)
            expect(screen.getByText('Published')).toBeInTheDocument()
        })

        it('renders draft badge when not published', () => {
            render(<ExamModeContent {...defaultProps} isPublished={false} />)
            expect(screen.getByText('Draft')).toBeInTheDocument()
        })
    })

    describe('Actions', () => {
        it('renders Take Exam button when published and not manager', () => {
            render(<ExamModeContent {...defaultProps} isPublished={true} isManager={false} />)
            const takeExamLink = screen.getByRole('link', { name: /take exam/i })
            expect(takeExamLink).toBeInTheDocument()
            expect(takeExamLink).toHaveAttribute('href', '/activities/activity-1/exam')
        })

        it('does not render Take Exam button when not published', () => {
            render(<ExamModeContent {...defaultProps} isPublished={false} />)
            expect(screen.queryByRole('link', { name: /take exam/i })).not.toBeInTheDocument()
        })

        it('renders View Analytics link for manager', () => {
            render(<ExamModeContent {...defaultProps} isManager={true} />)
            const analyticsLink = screen.getByRole('link', { name: /analytics/i })
            expect(analyticsLink).toBeInTheDocument()
            expect(analyticsLink).toHaveAttribute('href', '/activities/activity-1/exam/analytics')
        })
    })

    describe('Stats for Manager', () => {
        it('renders attempt count for manager', () => {
            render(<ExamModeContent {...defaultProps} isManager={true} attemptCount={15} />)
            expect(screen.getByText('15')).toBeInTheDocument()
            expect(screen.getByText('Attempts')).toBeInTheDocument()
        })

        it('renders average score for manager', () => {
            render(<ExamModeContent {...defaultProps} isManager={true} avgScore={78} />)
            expect(screen.getByText('78%')).toBeInTheDocument()
            expect(screen.getByText('Avg Score')).toBeInTheDocument()
        })
    })
})
