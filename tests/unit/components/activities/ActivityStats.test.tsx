import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityStats } from '@/features/activities/components/ActivityDetail/ActivityStats'

describe('ActivityStats', () => {
    const mockStats = {
        questionCount: 10,
        memberCount: 25,
        likeCount: 50,
        isPrivate: false
    }

    it('renders question count', () => {
        render(<ActivityStats {...mockStats} />)
        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByText('Questions')).toBeInTheDocument()
    })

    it('renders member count', () => {
        render(<ActivityStats {...mockStats} />)
        expect(screen.getByText('25')).toBeInTheDocument()
        expect(screen.getByText('Members')).toBeInTheDocument()
    })

    it('renders like count', () => {
        render(<ActivityStats {...mockStats} />)
        expect(screen.getByText('50')).toBeInTheDocument()
        expect(screen.getByText('Likes')).toBeInTheDocument()
    })

    it('shows visibility status as Public when not private', () => {
        render(<ActivityStats {...mockStats} />)
        expect(screen.getByText('Public')).toBeInTheDocument()
    })

    it('shows visibility status as Private when private', () => {
        render(<ActivityStats {...mockStats} isPrivate={true} />)
        expect(screen.getByText('Private')).toBeInTheDocument()
    })

    it('renders as a grid layout', () => {
        const { container } = render(<ActivityStats {...mockStats} />)
        expect(container.querySelector('.grid')).toBeInTheDocument()
    })

    it('renders zero values correctly', () => {
        render(<ActivityStats questionCount={0} memberCount={0} likeCount={0} isPrivate={false} />)
        expect(screen.getAllByText('0').length).toBe(3)
    })

    it('renders large numbers correctly', () => {
        render(<ActivityStats questionCount={1000} memberCount={500} likeCount={10000} isPrivate={false} />)
        expect(screen.getByText('1000')).toBeInTheDocument()
        expect(screen.getByText('500')).toBeInTheDocument()
        expect(screen.getByText('10000')).toBeInTheDocument()
    })

    it('has proper accessibility structure', () => {
        render(<ActivityStats {...mockStats} />)
        // Should have a section heading
        expect(screen.getByText('Activity Statistics')).toBeInTheDocument()
    })

    it('renders with custom className when provided', () => {
        const { container } = render(<ActivityStats {...mockStats} className="custom-class" />)
        expect(container.firstChild).toHaveClass('custom-class')
    })
})
