---
id: VIBE-0009-WI04
title: Extract KeywordBadge Component (TDD)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: s
assignee: ai-agent
parent: VIBE-0009
---

# Extract KeywordBadge Component (TDD)

## Summary

Create a reusable component for displaying individual keywords with remove functionality in the inquiry take experience. This component displays a keyword as a badge with optional highlighting and a remove button.

## Current Behavior

Keywords are rendered inline in `inquiry-take-client.tsx` (lines 329-361) as clickable buttons within the keyword pools section. The current implementation mixes keyword pool hints with entered keywords.

## Expected Behavior

A dedicated `KeywordBadge` component that:
- Displays a single keyword with consistent styling
- Provides a remove button with callback
- Supports highlighted state for validated keywords
- Supports disabled state when attempt is complete
- Has appropriate accessibility features

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 5 test cases)
- [ ] Component is under 50 lines
- [ ] Component exported from `components/index.ts`
- [ ] Accessible with proper ARIA labels

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/components/__tests__/KeywordBadge.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { KeywordBadge } from '../KeywordBadge'

describe('KeywordBadge', () => {
  const defaultProps = {
    keyword: 'innovation',
    onRemove: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the keyword text', () => {
      render(<KeywordBadge {...defaultProps} />)
      expect(screen.getByText('innovation')).toBeInTheDocument()
    })

    it('renders with remove button', () => {
      render(<KeywordBadge {...defaultProps} />)
      expect(screen.getByRole('button', { name: /제거/ })).toBeInTheDocument()
    })

    it('has appropriate test id', () => {
      render(<KeywordBadge {...defaultProps} />)
      expect(screen.getByTestId('keyword-badge')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onRemove when X button is clicked', () => {
      const mockOnRemove = jest.fn()
      render(<KeywordBadge keyword="test" onRemove={mockOnRemove} />)
      
      fireEvent.click(screen.getByRole('button', { name: /제거/ }))
      expect(mockOnRemove).toHaveBeenCalledTimes(1)
    })

    it('does not propagate click event to parent', () => {
      const parentClick = jest.fn()
      render(
        <div onClick={parentClick}>
          <KeywordBadge {...defaultProps} />
        </div>
      )
      
      fireEvent.click(screen.getByRole('button', { name: /제거/ }))
      expect(parentClick).not.toHaveBeenCalled()
    })
  })

  describe('highlighted state', () => {
    it('shows default style when not highlighted', () => {
      render(<KeywordBadge {...defaultProps} />)
      const badge = screen.getByTestId('keyword-badge')
      expect(badge).toHaveClass('bg-gray-100')
    })

    it('shows highlighted (valid) style when isValid is true', () => {
      render(<KeywordBadge {...defaultProps} isValid />)
      const badge = screen.getByTestId('keyword-badge')
      expect(badge).toHaveClass('bg-green-100')
    })

    it('shows invalid style when isValid is false', () => {
      render(<KeywordBadge {...defaultProps} isValid={false} />)
      const badge = screen.getByTestId('keyword-badge')
      expect(badge).toHaveClass('bg-red-100')
    })
  })

  describe('disabled state', () => {
    it('disables remove button when disabled prop is true', () => {
      render(<KeywordBadge {...defaultProps} disabled />)
      expect(screen.getByRole('button', { name: /제거/ })).toBeDisabled()
    })

    it('applies disabled styles', () => {
      render(<KeywordBadge {...defaultProps} disabled />)
      const badge = screen.getByTestId('keyword-badge')
      expect(badge).toHaveClass('opacity-50')
    })

    it('does not call onRemove when disabled', () => {
      const mockOnRemove = jest.fn()
      render(<KeywordBadge keyword="test" onRemove={mockOnRemove} disabled />)
      
      fireEvent.click(screen.getByRole('button', { name: /제거/ }))
      expect(mockOnRemove).not.toHaveBeenCalled()
    })
  })

  describe('size variants', () => {
    it('applies small size classes', () => {
      render(<KeywordBadge {...defaultProps} size="sm" />)
      const badge = screen.getByTestId('keyword-badge')
      expect(badge).toHaveClass('text-xs')
    })

    it('applies medium (default) size classes', () => {
      render(<KeywordBadge {...defaultProps} />)
      const badge = screen.getByTestId('keyword-badge')
      expect(badge).toHaveClass('text-sm')
    })
  })

  describe('accessibility', () => {
    it('has accessible name for remove button', () => {
      render(<KeywordBadge keyword="innovation" onRemove={jest.fn()} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName(/innovation.*제거/)
    })
  })
})
```

### TDD Step 2: Run Tests (Should Fail)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/KeywordBadge.test.tsx
```

### TDD Step 3: Implement Component

Create `src/features/inquiry-mode/components/KeywordBadge.tsx`:

```typescript
interface KeywordBadgeProps {
  keyword: string
  onRemove: () => void
  isValid?: boolean | undefined
  disabled?: boolean
  size?: 'sm' | 'md'
}

const getBackgroundClass = (isValid?: boolean): string => {
  if (isValid === true) return 'bg-green-100 text-green-800 border-green-300'
  if (isValid === false) return 'bg-red-100 text-red-800 border-red-300'
  return 'bg-gray-100 text-gray-800 border-gray-300'
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
}

export function KeywordBadge({
  keyword,
  onRemove,
  isValid,
  disabled = false,
  size = 'md',
}: KeywordBadgeProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) onRemove()
  }

  return (
    <span
      data-testid="keyword-badge"
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${SIZE_CLASSES[size]}
        ${getBackgroundClass(isValid)}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {keyword}
      <button
        type="button"
        onClick={handleRemove}
        disabled={disabled}
        aria-label={`${keyword} 제거`}
        className="hover:bg-black/10 rounded-full p-0.5 disabled:cursor-not-allowed"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}
```

### TDD Step 4: Run Tests (Should Pass)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/KeywordBadge.test.tsx
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx` (lines 329-361)

## Dependencies

**Blocked By:**
- VIBE-0009-WI01 (Foundation & Types)

**Blocks:**
- VIBE-0009-WI05 (KeywordInput component)

## Test Commands

```bash
# Run this specific test
npm test -- src/features/inquiry-mode/components/__tests__/KeywordBadge.test.tsx

# Run with coverage
npm test -- --coverage src/features/inquiry-mode/components/__tests__/KeywordBadge.test.tsx
```

## Notes

- Component should be composable within KeywordInput
- Consider future expansion for different keyword types (concept vs action keywords)
- Ensure consistent with case-mode component patterns

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
