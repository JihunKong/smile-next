import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OpenModeContent } from '@/features/activities/components/ModeContent/OpenModeContent'

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode, href: string }) =>
        <a href={href}>{children}</a>
}))

describe('OpenModeContent', () => {
    const defaultProps = {
        activityId: 'activity-1',
        instructions: 'Ask thoughtful questions about the topic.',
        questionCount: 10,
        isPassFailEnabled: true,
        requiredQuestionCount: 5,
        requiredAvgScore: 7.0
    }

    describe('Instructions', () => {
        it('renders instructions when provided', () => {
            render(<OpenModeContent {...defaultProps} />)
            expect(screen.getByText('Ask thoughtful questions about the topic.')).toBeInTheDocument()
        })

        it('renders default instructions when not provided', () => {
            render(<OpenModeContent {...defaultProps} instructions={undefined} />)
            expect(screen.getByText('Ask thoughtful questions related to the topic.')).toBeInTheDocument()
        })
    })

    describe('Pass/Fail Requirements', () => {
        it('renders pass/fail section when enabled', () => {
            render(<OpenModeContent {...defaultProps} isPassFailEnabled={true} />)
            expect(screen.getByText('Pass/Fail Requirements')).toBeInTheDocument()
        })

        it('does not render pass/fail section when disabled', () => {
            render(<OpenModeContent {...defaultProps} isPassFailEnabled={false} />)
            expect(screen.queryByText('Pass/Fail Requirements')).not.toBeInTheDocument()
        })

        it('renders required question count', () => {
            render(<OpenModeContent {...defaultProps} />)
            expect(screen.getByText('5')).toBeInTheDocument()
            expect(screen.getByText('Questions Required')).toBeInTheDocument()
        })

        it('renders required average score', () => {
            render(<OpenModeContent {...defaultProps} />)
            expect(screen.getByText('7.0')).toBeInTheDocument()
            expect(screen.getByText('Min Avg Score')).toBeInTheDocument()
        })
    })

    describe('Question Count', () => {
        it('renders current question count', () => {
            render(<OpenModeContent {...defaultProps} />)
            expect(screen.getByText('10')).toBeInTheDocument()
        })
    })

    describe('Actions', () => {
        it('renders Ask a Question link', () => {
            render(<OpenModeContent {...defaultProps} />)
            const askLink = screen.getByRole('link', { name: /ask a question/i })
            expect(askLink).toBeInTheDocument()
            expect(askLink).toHaveAttribute('href', '/activities/activity-1/questions/create')
        })
    })

    describe('Custom className', () => {
        it('applies custom className when provided', () => {
            const { container } = render(<OpenModeContent {...defaultProps} className="custom-class" />)
            expect(container.firstChild).toHaveClass('custom-class')
        })
    })
})
