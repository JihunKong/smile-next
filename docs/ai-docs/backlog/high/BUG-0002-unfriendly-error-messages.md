---
id: BUG-0002
title: Make error messages user-friendly
status: backlog
priority: high
category: bug
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Make Error Messages User-Friendly

## Summary

Error messages often expose technical details or are too generic to be helpful. Users see messages like "Failed to fetch" or raw database errors instead of actionable guidance.

## Current Behavior

- API errors shown directly: "Unauthorized", "Internal Server Error"
- Fetch errors: "Failed to fetch activities"
- Some errors only logged to console
- No consistent error UI pattern
- No "try again" or recovery options

## Expected Behavior

- User-friendly error messages with actionable guidance
- Technical errors logged but not displayed
- Consistent error UI component
- Recovery options where applicable ("Try Again", "Go Back")
- Contact support suggestion for persistent errors

## Acceptance Criteria

- [ ] Create error message mapping utility
- [ ] Create reusable `ErrorState` component
- [ ] All user-facing errors use friendly messages
- [ ] Technical details logged to console/monitoring
- [ ] Include recovery actions where applicable

## Technical Approach

### Error Message Mapping

```typescript
// src/lib/utils/errorMessages.ts
const errorMessages: Record<string, string> = {
  'Unauthorized': 'Please log in to continue.',
  'Forbidden': 'You don\'t have permission to access this.',
  'Not Found': 'The requested item could not be found.',
  'Failed to fetch': 'Unable to connect. Please check your internet connection.',
  'Network Error': 'Connection problem. Please try again.',
  'Internal Server Error': 'Something went wrong on our end. Please try again later.',
}

export function getUserFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  
  // Check for exact match
  if (errorMessages[message]) {
    return errorMessages[message]
  }
  
  // Check for partial match
  for (const [key, friendly] of Object.entries(errorMessages)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return friendly
    }
  }
  
  // Default fallback
  return 'Something went wrong. Please try again.'
}
```

### Error State Component

```typescript
// src/components/ui/ErrorState.tsx
interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  onGoBack?: () => void
  showSupport?: boolean
}

export function ErrorState({
  title = 'Oops!',
  message,
  onRetry,
  onGoBack,
  showSupport = false,
}: ErrorStateProps) {
  return (
    <div className="py-12 text-center">
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{message}</p>
      <div className="flex items-center justify-center gap-3">
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button variant="ghost" onClick={onGoBack}>
            Go Back
          </Button>
        )}
      </div>
      {showSupport && (
        <p className="mt-4 text-sm text-gray-500">
          If the problem persists, please <a href="/contact" className="underline">contact support</a>.
        </p>
      )}
    </div>
  )
}
```

## Related Files

- All components with error handling
- API route error responses

## Dependencies

**Blocked By:**
- REFACTOR-0002 (UI Components) - needs Button component

**Blocks:**
- None

## Notes

Consider integrating with a logging service for monitoring errors.

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation |
