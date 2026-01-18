---
id: FEAT-0005
title: Complete dark mode implementation
status: backlog
priority: low
category: feature
component: frontend
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Complete Dark Mode Implementation

## Summary

The CSS shows dark mode support via `prefers-color-scheme: dark` media query, and `UserPreference` has a `theme` field. However, many components have hardcoded colors that don't respect the theme. A comprehensive audit and update is needed to ensure dark mode works consistently.

## Current Behavior

```css
/* globals.css - Dark mode defined */
@media (prefers-color-scheme: dark) {
  :root {
    --background: var(--stanford-pine);
    --foreground: var(--stanford-white);
  }
}
```

But components use hardcoded colors:
```tsx
// Common patterns found
className="bg-white text-gray-900"       // Ignores dark mode
className="bg-gray-100 border-gray-300"  // Hardcoded light colors
className="text-black"                    // Won't adapt
```

## Expected Behavior

All components use CSS variables or Tailwind dark mode classes:
```tsx
// Proper dark mode support
className="bg-background text-foreground"
className="bg-gray-100 dark:bg-gray-800"
className="text-gray-900 dark:text-gray-100"
```

## Acceptance Criteria

- [ ] Audit all components for hardcoded colors
- [ ] Update globals.css with comprehensive dark mode variables
- [ ] Add dark mode variants to key components
- [ ] Implement theme toggle in settings
- [ ] Persist theme preference to user settings
- [ ] Test all pages in dark mode

## Technical Approach

### 1. Extend CSS Variables

```css
/* globals.css */
:root {
  /* Light mode defaults */
  --background: #ffffff;
  --foreground: #1a1a1a;
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
  --input-bg: #ffffff;
  --input-border: #d1d5db;
  --muted: #6b7280;
  --muted-bg: #f3f4f6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #1a1a1a;
    --foreground: #ffffff;
    --card-bg: #262626;
    --card-border: #404040;
    --input-bg: #262626;
    --input-border: #525252;
    --muted: #a1a1aa;
    --muted-bg: #262626;
  }
}

/* Support for manual theme override */
[data-theme="light"] {
  --background: #ffffff;
  /* ... light values */
}

[data-theme="dark"] {
  --background: #1a1a1a;
  /* ... dark values */
}
```

### 2. Theme Toggle Component

```typescript
// src/components/ThemeToggle.tsx
'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
    
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <select 
      value={theme} 
      onChange={(e) => setTheme(e.target.value as Theme)}
      className="bg-background text-foreground border rounded px-2 py-1"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  )
}
```

### 3. Sync with User Preferences

```typescript
// When user logs in, apply their preference
const userPreference = await getUserPreference(userId)
if (userPreference?.theme !== 'system') {
  document.documentElement.setAttribute('data-theme', userPreference.theme)
}

// When user changes preference, save to DB
async function updateTheme(theme: Theme) {
  await fetch('/api/user/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ theme })
  })
}
```

### 4. Component Updates

Replace hardcoded colors:

```tsx
// Before
<div className="bg-white border border-gray-200">

// After
<div className="bg-card-bg border border-card-border">
// or using Tailwind
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
```

### 5. Audit Script

```bash
# Find hardcoded colors
grep -r "bg-white\|bg-gray-\|text-gray-\|text-black\|border-gray-" src/app src/components --include="*.tsx"
```

## Components to Update

Priority order:
1. `Navigation.tsx` - Always visible
2. `Providers.tsx` - Theme provider wrapper
3. Card components
4. Form inputs
5. Modals and dialogs
6. Data tables
7. All remaining pages

## Related Files

- `src/app/globals.css` - Theme variables
- `src/components/` - All components
- `src/app/(dashboard)/settings/page.tsx` - Theme toggle location
- `prisma/schema.prisma` - UserPreference.theme field

## Dependencies

**Blocked By:**
- REFACTOR-0002 (UI Component Library) - would be easier after this

**Blocks:**
- None

## Notes

- Consider using `next-themes` for easier theme management
- Images may need dark mode variants or filters
- Stanford colors may need dark mode alternatives
- Test with actual dark mode users for feedback

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on CSS analysis |
