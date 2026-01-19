import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoadingState } from '@/components/ui'

describe('LoadingState', () => {
  it('renders spinner', () => {
    const { container } = render(<LoadingState />)
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
  })

  it('renders default message "Loading..."', () => {
    render(<LoadingState />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders custom message', () => {
    render(<LoadingState message="Fetching activities..." />)
    expect(screen.getByText('Fetching activities...')).toBeInTheDocument()
  })

  it('applies fullPage styling when prop is true', () => {
    const { container } = render(<LoadingState fullPage />)
    expect(container.firstChild).toHaveClass('min-h-screen')
  })

  it('does not apply fullPage styling by default', () => {
    const { container } = render(<LoadingState />)
    expect(container.firstChild).not.toHaveClass('min-h-screen')
  })

  it('passes size to spinner - lg', () => {
    const { container } = render(<LoadingState size="lg" />)
    expect(container.querySelector('svg')).toHaveClass('h-10', 'w-10')
  })

  it('passes size to spinner - sm', () => {
    const { container } = render(<LoadingState size="sm" />)
    expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4')
  })

  it('uses stanford-cardinal color for spinner', () => {
    const { container } = render(<LoadingState />)
    expect(container.querySelector('svg')).toHaveClass('text-[var(--stanford-cardinal)]')
  })
})
