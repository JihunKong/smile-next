---
id: REFACTOR-0002
title: Create reusable UI component library
status: backlog
priority: critical
category: refactoring
component: ui
created: 2026-01-18
updated: 2026-01-18
effort: l
assignee: ai-agent
---

# Create Reusable UI Component Library

## Summary

The `src/components/ui/` folder contains only `Icon.tsx`. There are no reusable components for buttons, inputs, modals, or other common UI elements. This leads to inconsistent styling, duplicate code (50+ inline SVG spinners), and difficulty maintaining visual consistency. A proper component library will accelerate development and reduce bugs.

## Current Behavior

- Buttons have inline Tailwind classes, varying across pages
- Loading spinners are inline SVGs copied everywhere
- No shared Modal component (multiple implementations)
- Form inputs styled inconsistently
- No standardized color usage (mix of CSS vars and hardcoded colors)

Example of duplicated spinner (found in 50+ files):
```tsx
<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z..." />
</svg>
```

## Expected Behavior

A well-organized component library:
```
src/components/ui/
├── index.ts           # Barrel export
├── Button.tsx         # Primary, secondary, danger, ghost variants
├── Card.tsx           # Consistent card styling
├── Input.tsx          # Text input with label, error states
├── Select.tsx         # Styled select dropdown
├── Textarea.tsx       # Multi-line input
├── Modal.tsx          # Reusable modal with backdrop
├── LoadingSpinner.tsx # Replace all inline spinners
├── Badge.tsx          # Status badges
├── Toast.tsx          # Toast notifications (with provider)
├── Avatar.tsx         # User avatar with fallback
└── Skeleton.tsx       # Loading skeletons
```

Usage:
```tsx
import { Button, LoadingSpinner, Modal } from '@/components/ui'

<Button variant="primary" isLoading={submitting}>
  Save Changes
</Button>

<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
  <Modal.Header>Confirm Action</Modal.Header>
  <Modal.Body>Are you sure?</Modal.Body>
  <Modal.Footer>
    <Button variant="ghost">Cancel</Button>
    <Button variant="danger">Delete</Button>
  </Modal.Footer>
</Modal>
```

## Acceptance Criteria

- [ ] Create at least 10 core UI components:
  - [ ] `Button.tsx` - with variants: primary, secondary, danger, ghost
  - [ ] `LoadingSpinner.tsx` - with sizes: sm, md, lg
  - [ ] `Card.tsx` - with header/body/footer slots
  - [ ] `Modal.tsx` - accessible, with ESC close
  - [ ] `Input.tsx` - with label, error, helper text
  - [ ] `Select.tsx` - styled select
  - [ ] `Textarea.tsx` - styled textarea
  - [ ] `Badge.tsx` - status badges with color variants
  - [ ] `Avatar.tsx` - with fallback initials
  - [ ] `Skeleton.tsx` - loading placeholder
- [ ] All components use CSS variables from `globals.css`
- [ ] All components are accessible (ARIA, keyboard nav)
- [ ] Barrel export in `index.ts`
- [ ] Replace inline spinners across codebase
- [ ] Document props with TypeScript + JSDoc

## Technical Approach

### Button Component

```typescript
// src/components/ui/Button.tsx
import { forwardRef } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, disabled, className, leftIcon, rightIcon, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-[var(--stanford-cardinal)] text-white hover:bg-[var(--stanford-cardinal-light)] focus:ring-[var(--stanford-cardinal)]',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

### LoadingSpinner Component

```typescript
// src/components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <svg
      className={`animate-spin ${sizeMap[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
```

### Barrel Export

```typescript
// src/components/ui/index.ts
export { Button } from './Button'
export { LoadingSpinner } from './LoadingSpinner'
export { Card } from './Card'
export { Modal } from './Modal'
export { Input } from './Input'
export { Select } from './Select'
export { Textarea } from './Textarea'
export { Badge } from './Badge'
export { Avatar } from './Avatar'
export { Skeleton } from './Skeleton'
export { default as Icon, Icons } from './Icon'
```

## Related Files

- `src/components/ui/Icon.tsx` - Existing icon component
- `src/app/globals.css` - CSS variables to use
- All files with inline spinners (50+)

## Dependencies

**Blocked By:**
- None

**Blocks:**
- BUG-0001 (Loading States) - needs LoadingSpinner
- BUG-0002 (Error Messages) - needs Toast component

## Notes

- Use existing Stanford color variables
- Consider adding Storybook later for documentation
- Focus on most-used components first
- All components should support `className` prop for customization

## Conversation History

| Date | Note |
|------|------|
| 2026-01-18 | Initial creation based on codebase analysis |
