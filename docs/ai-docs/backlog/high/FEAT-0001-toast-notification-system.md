---
id: FEAT-0001
title: Implement toast notification system for user feedback
status: backlog
priority: high
category: feature
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: m
assignee: ai-agent
---

# Implement Toast Notification System

## Summary

Currently there's no unified way to show success/error feedback to users. Some actions show inline messages, some just redirect without feedback, and some only log to console. A toast notification system will provide consistent, non-blocking feedback.

## Current Behavior

- Form submissions: Either inline error or redirect without message
- Delete actions: No confirmation of success
- API errors: Displayed inline or not at all
- Success states: Often just a redirect

## Expected Behavior

- Toast notifications for all user actions
- Four variants: success (green), error (red), warning (yellow), info (blue)
- Auto-dismiss after configurable duration
- Stackable (multiple toasts visible)
- Accessible (announced to screen readers)
- Dismissible with X button

## Acceptance Criteria

- [ ] `Toast` component with 4 variants
- [ ] `ToastProvider` context for global access
- [ ] `useToast` hook for triggering toasts
- [ ] Auto-dismiss with configurable duration (default 5s)
- [ ] Accessible with role="alert" for important messages
- [ ] Position: bottom-right of viewport
- [ ] Smooth enter/exit animations

## Technical Approach

### Toast Context

```typescript
// src/components/ui/Toast/ToastContext.tsx
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, type, message, duration }])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return {
    success: (message: string) => context.addToast('success', message),
    error: (message: string) => context.addToast('error', message),
    warning: (message: string) => context.addToast('warning', message),
    info: (message: string) => context.addToast('info', message),
  }
}
```

### Toast Component

```typescript
// src/components/ui/Toast/Toast.tsx
const variants = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

export function Toast({ toast, onDismiss }) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${variants[toast.type]}`}
    >
      <span className="text-lg">{icons[toast.type]}</span>
      <p className="flex-1">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  )
}
```

### Usage

```typescript
// In any component
import { useToast } from '@/components/ui/Toast'

function MyComponent() {
  const toast = useToast()

  async function handleSubmit() {
    try {
      await saveData()
      toast.success('Changes saved successfully!')
    } catch (error) {
      toast.error('Failed to save changes. Please try again.')
    }
  }
}
```

## Related Files

- `src/components/Providers.tsx` - Add ToastProvider
- All forms and action handlers

## Dependencies

**Blocked By:**
- None

**Blocks:**
- None

## Notes

- Consider using react-hot-toast for faster implementation
- Or build custom for more control
- Ensure toast announcements work with screen readers

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation |
