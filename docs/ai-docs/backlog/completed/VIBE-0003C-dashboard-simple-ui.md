---
id: VIBE-0003C
title: Extract Dashboard simple UI components with tests
status: completed
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
completed: 2026-01-18
effort: s
assignee: ai-agent
---

# Extract Dashboard Simple UI Components

## Summary

Extract three simple, self-contained UI components from `dashboard/page.tsx`: WelcomeHeader, QuickActions, and ErrorBanner. These have minimal props and no complex logic, making them ideal for the first UI extraction.

## Current Behavior

Components embedded in `page.tsx`:
- **ErrorBanner** (lines 306-332) - Error state when stats fail to load
- **WelcomeHeader** (lines 334-343) - Gradient header with user greeting
- **QuickActions** (lines 345-381) - 4 navigation cards

## Expected Behavior

```
dashboard/components/
├── index.ts
├── ErrorBanner.tsx     (~40 lines)
├── WelcomeHeader.tsx   (~50 lines)
└── QuickActions.tsx    (~60 lines)
```

## Acceptance Criteria

- [ ] Unit tests written FIRST for all 3 components
- [ ] `ErrorBanner.tsx` renders error message and refresh link
- [ ] `WelcomeHeader.tsx` shows personalized greeting
- [ ] `QuickActions.tsx` renders 4 navigation cards with correct links
- [ ] `index.ts` barrel exports all components
- [ ] Tests pass: `npm run test -- SimpleComponents`
- [ ] Visual output identical to current

## Technical Approach

### 1. Write Tests First

```typescript
// tests/unit/app/dashboard/components/SimpleComponents.test.tsx
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

  it('renders nothing when no error', () => {
    const { container } = render(<ErrorBanner error={undefined} />)
    expect(container).toBeEmptyDOMElement()
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

  it('displays motivational subtitle', () => {
    render(<WelcomeHeader userName="Test" />)
    expect(screen.getByText(/Ready to create impactful questions/)).toBeInTheDocument()
  })

  it('has gradient background', () => {
    const { container } = render(<WelcomeHeader userName="Test" />)
    expect(container.firstChild).toHaveClass('bg-gradient-to-r')
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
  })
})
```

### 2. Create Components

```typescript
// dashboard/components/ErrorBanner.tsx
interface ErrorBannerProps {
  error?: string
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null

  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Some statistics could not be loaded
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            There was an issue loading your statistics. Some data may be incomplete.
            Try refreshing the page.
          </p>
          <div className="mt-2">
            <a
              href="/dashboard"
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              <i className="fas fa-redo mr-1"></i>
              Refresh Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
```

```typescript
// dashboard/components/WelcomeHeader.tsx
interface WelcomeHeaderProps {
  userName?: string | null
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8 shadow-lg">
      <div className="flex items-center">
        <i className="fas fa-user-circle text-4xl mr-4"></i>
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName || 'User'}!</h1>
          <p className="text-blue-100 mt-1">Ready to create impactful questions and engage learners?</p>
        </div>
      </div>
    </div>
  )
}
```

```typescript
// dashboard/components/QuickActions.tsx
import Link from 'next/link'

const ACTIONS = [
  { href: '/groups/create', icon: 'fa-plus-circle', color: 'blue', title: 'Create Group', subtitle: 'Start a new learning group' },
  { href: '/groups', icon: 'fa-users', color: 'green', title: 'My Groups', subtitle: 'Manage your groups' },
  { href: '/activities', icon: 'fa-clipboard-list', color: 'purple', title: 'Activities', subtitle: 'Create & manage activities' },
  { href: '/profile', icon: 'fa-user-cog', color: 'yellow', title: 'Profile', subtitle: 'Update your settings' },
]

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-${action.color}-400 hover:bg-${action.color}-50 transition-colors`}
          >
            <i className={`fas ${action.icon} text-2xl text-${action.color}-600 mr-3`}></i>
            <div>
              <div className="font-medium text-gray-900">{action.title}</div>
              <div className="text-sm text-gray-500">{action.subtitle}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

```typescript
// dashboard/components/index.ts
export { ErrorBanner } from './ErrorBanner'
export { WelcomeHeader } from './WelcomeHeader'
export { QuickActions } from './QuickActions'
```

## Related Files

- `src/app/(dashboard)/dashboard/page.tsx` - Source

## Dependencies

**Blocked By:**
- VIBE-0003A (Types)

**Blocks:**
- VIBE-0003H (Final Composition)

## Notes

- These are the simplest components - good starting point
- No state or complex props needed
- QuickActions uses Tailwind dynamic classes - ensure purge config includes them

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Created as part of VIBE-0003 breakdown |
