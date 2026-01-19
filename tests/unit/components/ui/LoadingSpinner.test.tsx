import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoadingSpinner } from '@/components/ui'

describe('LoadingSpinner', () => {
  it('renders an SVG element', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies sm size class (h-4 w-4)', () => {
    const { container } = render(<LoadingSpinner size="sm" />)
    expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4')
  })

  it('applies md size class by default (h-6 w-6)', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('svg')).toHaveClass('h-6', 'w-6')
  })

  it('applies lg size class (h-10 w-10)', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    expect(container.querySelector('svg')).toHaveClass('h-10', 'w-10')
  })

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="text-red-500" />)
    expect(container.querySelector('svg')).toHaveClass('text-red-500')
  })

  it('has aria-hidden for accessibility', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('has animate-spin class for animation', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('svg')).toHaveClass('animate-spin')
  })
})
