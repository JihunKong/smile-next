import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

// Components will be imported after creation
import { ErrorBanner, WelcomeHeader, QuickActions } from '@/app/(dashboard)/dashboard/components'

describe('ErrorBanner', () => {
  it('renders error message', () => {
    render(<ErrorBanner error="Failed to load statistics" />)
    expect(screen.getByText('Some statistics could not be loaded')).toBeInTheDocument()
  })

  it('shows refresh link', () => {
    render(<ErrorBanner error="Test error" />)
    expect(screen.getByRole('link', { name: /Refresh Page/i })).toHaveAttribute('href', '/dashboard')
  })

  it('shows the issue description text', () => {
    render(<ErrorBanner error="Test error" />)
    expect(screen.getByText(/There was an issue loading your statistics/)).toBeInTheDocument()
  })

  it('renders nothing when no error', () => {
    const { container } = render(<ErrorBanner error={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('has warning background styling', () => {
    const { container } = render(<ErrorBanner error="Test" />)
    expect(container.firstChild).toHaveClass('bg-yellow-50')
  })
})

describe('WelcomeHeader', () => {
  it('displays user name in greeting', () => {
    render(<WelcomeHeader userName="John Doe" />)
    expect(screen.getByText(/Welcome back, John Doe!/)).toBeInTheDocument()
  })

  it('shows "User" when name is undefined', () => {
    render(<WelcomeHeader userName={undefined} />)
    expect(screen.getByText(/Welcome back, User!/)).toBeInTheDocument()
  })

  it('shows "User" when name is null', () => {
    render(<WelcomeHeader userName={null} />)
    expect(screen.getByText(/Welcome back, User!/)).toBeInTheDocument()
  })

  it('displays motivational subtitle', () => {
    render(<WelcomeHeader userName="Test" />)
    expect(screen.getByText(/Ready to create impactful questions/)).toBeInTheDocument()
  })

  it('has gradient background', () => {
    const { container } = render(<WelcomeHeader userName="Test" />)
    expect(container.firstChild).toHaveClass('bg-gradient-to-r')
  })

  it('has correct gradient colors', () => {
    const { container } = render(<WelcomeHeader userName="Test" />)
    expect(container.firstChild).toHaveClass('from-blue-600', 'to-purple-600')
  })
})

describe('QuickActions', () => {
  it('renders all 4 action links', () => {
    render(<QuickActions />)
    expect(screen.getByText('Create Group')).toBeInTheDocument()
    expect(screen.getByText('My Groups')).toBeInTheDocument()
    expect(screen.getByText('Activities')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('has correct href for Create Group', () => {
    render(<QuickActions />)
    expect(screen.getByRole('link', { name: /Create Group/i })).toHaveAttribute('href', '/groups/create')
  })

  it('has correct href for My Groups', () => {
    render(<QuickActions />)
    expect(screen.getByRole('link', { name: /My Groups/i })).toHaveAttribute('href', '/groups')
  })

  it('has correct href for Activities', () => {
    render(<QuickActions />)
    expect(screen.getByRole('link', { name: /Activities/i })).toHaveAttribute('href', '/activities')
  })

  it('has correct href for Profile', () => {
    render(<QuickActions />)
    expect(screen.getByRole('link', { name: /Profile/i })).toHaveAttribute('href', '/profile')
  })

  it('displays subtitles for each action', () => {
    render(<QuickActions />)
    expect(screen.getByText('Start a new learning group')).toBeInTheDocument()
    expect(screen.getByText('Manage your groups')).toBeInTheDocument()
    expect(screen.getByText('Create & manage activities')).toBeInTheDocument()
    expect(screen.getByText('Update your settings')).toBeInTheDocument()
  })

  it('has section title "Quick Actions"', () => {
    render(<QuickActions />)
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })

  it('has white background with shadow', () => {
    const { container } = render(<QuickActions />)
    expect(container.firstChild).toHaveClass('bg-white', 'shadow')
  })
})
