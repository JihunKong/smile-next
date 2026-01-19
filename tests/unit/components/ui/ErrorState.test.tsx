import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ErrorState } from '@/components/ui'

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders default title "Oops!"', () => {
    render(<ErrorState message="Error" />)
    expect(screen.getByText('Oops!')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<ErrorState title="Connection Failed" message="Error" />)
    expect(screen.getByText('Connection Failed')).toBeInTheDocument()
  })

  it('shows retry button when onRetry provided', () => {
    render(<ErrorState message="Error" onRetry={() => {}} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('does not show retry button when onRetry not provided', () => {
    render(<ErrorState message="Error" />)
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('shows go back button when onGoBack provided', () => {
    render(<ErrorState message="Error" onGoBack={() => {}} />)
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })

  it('does not show go back button when onGoBack not provided', () => {
    render(<ErrorState message="Error" />)
    expect(screen.queryByRole('button', { name: /go back/i })).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', () => {
    const handleRetry = vi.fn()
    render(<ErrorState message="Error" onRetry={handleRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onGoBack when go back button clicked', () => {
    const handleGoBack = vi.fn()
    render(<ErrorState message="Error" onGoBack={handleGoBack} />)
    fireEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(handleGoBack).toHaveBeenCalledTimes(1)
  })

  it('shows both buttons when both handlers provided', () => {
    render(<ErrorState message="Error" onRetry={() => {}} onGoBack={() => {}} />)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })
})
