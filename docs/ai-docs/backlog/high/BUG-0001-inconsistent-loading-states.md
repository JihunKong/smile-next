---
id: BUG-0001
title: Fix inconsistent loading states across pages
status: backlog
priority: high
category: bug
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Fix Inconsistent Loading States

## Summary

Loading states are visually inconsistent across the application. Different pages show loading differently - some use spinning SVGs, some show "Loading..." text, and some have no loading indicator at all. This creates a disjointed user experience.

## Current Behavior

- Activities page: Large centered spinner with text
- Groups page: Different spinner style
- Some modals: No loading state
- API calls: Various inline spinners
- Colors vary: green, gray, cardinal red

## Expected Behavior

- Unified `LoadingSpinner` component used everywhere
- Consistent positioning (centered in container)
- Consistent sizing based on context:
  - Buttons: small spinner
  - Content areas: medium spinner with text
  - Full page: large spinner
- Consistent color (stanford-cardinal or neutral gray)

## Acceptance Criteria

- [ ] Single `LoadingSpinner` component created
- [ ] All inline SVG spinners replaced with component
- [ ] Consistent loading message pattern ("Loading activities...", etc.)
- [ ] Skeleton loading for content-heavy pages (optional)

## Technical Approach

1. Create `LoadingSpinner` component (part of REFACTOR-0002)
2. Search and replace all inline spinner SVGs
3. Create loading wrapper component for consistent messaging

```typescript
// src/components/ui/LoadingState.tsx
import { LoadingSpinner } from './LoadingSpinner'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  fullPage = false 
}: LoadingStateProps) {
  const wrapper = fullPage 
    ? 'min-h-screen flex items-center justify-center' 
    : 'py-12 text-center'

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={size} className="text-[var(--stanford-cardinal)]" />
        {message && (
          <p className="text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  )
}
```

## Related Files

- All `*-client.tsx` files with loading states
- `src/app/(dashboard)/activities/activities-client.tsx`
- `src/app/(dashboard)/groups/groups-client.tsx`

## Dependencies

**Blocked By:**
- REFACTOR-0002 (UI Components) - needs LoadingSpinner first

**Blocks:**
- None

## Notes

Consider adding skeleton loading for data-heavy pages like activities list.

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation |
