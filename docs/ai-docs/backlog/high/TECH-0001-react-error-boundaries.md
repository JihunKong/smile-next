---
id: TECH-0001
title: Add React Error Boundaries to catch render errors
status: backlog
priority: high
category: tech_debt
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: s
assignee: ai-agent
---

# Add React Error Boundaries

## Summary

No error boundaries exist in the application. If a component throws during render, the entire page crashes with a white screen and no recovery option. Error boundaries will catch these errors and show a friendly fallback UI.

## Current Behavior

- Component render errors crash the entire page
- Users see a white screen or React error overlay
- No way to recover without refreshing
- No error logging for render failures

## Expected Behavior

- Render errors caught by error boundaries
- Friendly fallback UI with "Try Again" option
- Errors logged to console/monitoring
- Contained failures (one component crash doesn't break entire page)

## Acceptance Criteria

- [ ] `ErrorBoundary` component created
- [ ] Wrapped around main content in dashboard layout
- [ ] Shows friendly error UI with retry option
- [ ] Logs errors to console
- [ ] Children can recover via key prop change

## Technical Approach

```typescript
// src/components/ui/ErrorBoundary.tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try again.
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:opacity-90 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Usage in Layout

```typescript
// src/app/(dashboard)/layout.tsx
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default async function DashboardLayout({ children }) {
  // ... auth checks ...

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
```

## Related Files

- `src/app/(dashboard)/layout.tsx`
- `src/app/layout.tsx`

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- React 19 has improved error handling - research best practices
- Consider per-section error boundaries for better containment
- May want to integrate with error monitoring service later

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation |
