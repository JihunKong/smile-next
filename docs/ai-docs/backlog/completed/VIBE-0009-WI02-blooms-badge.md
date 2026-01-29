---
id: VIBE-0009-WI02
title: Extract BloomsBadge Component (TDD)
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

# Extract BloomsBadge Component (TDD)

## Summary

Extract Bloom's Taxonomy level badge display logic that's **duplicated across inquiry pages** into a reusable component. This badge displays the cognitive level of a question with Korean translations and appropriate colors.

## Current Behavior

The Bloom's badge logic is duplicated in:
- `inquiry-take-client.tsx` (lines 175-209): `getBloomsBadgeColor()`, `getBloomsKorean()`, `getBloomsDescription()`
- `results/page.tsx` (lines 141-151): `getBloomsBadgeColor()`

Each file has its own inline implementation with identical logic.

## Expected Behavior

A single, reusable `BloomsBadge` component in `src/features/inquiry-mode/components/BloomsBadge.tsx` that:
- Displays the Bloom's level with Korean translation
- Uses appropriate color coding per level
- Optionally shows the description tooltip
- Handles null/undefined levels gracefully

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 5 test cases)
- [ ] Component is under 50 lines
- [ ] Component exported from `components/index.ts`
- [ ] Uses types from `types.ts`
- [ ] No duplicate code remains in source files

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/components/__tests__/BloomsBadge.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { BloomsBadge } from '../BloomsBadge'

describe('BloomsBadge', () => {
  describe('Korean labels', () => {
    it.each([
      ['remember', '기억'],
      ['understand', '이해'],
      ['apply', '적용'],
      ['analyze', '분석'],
      ['evaluate', '평가'],
      ['create', '창조'],
    ])('renders "%s" as "%s"', (level, expected) => {
      render(<BloomsBadge level={level} />)
      expect(screen.getByText(expected)).toBeInTheDocument()
    })
  })

  describe('color classes', () => {
    it('applies gray colors for "remember"', () => {
      render(<BloomsBadge level="remember" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
    })

    it('applies blue colors for "understand"', () => {
      render(<BloomsBadge level="understand" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('applies green colors for "apply"', () => {
      render(<BloomsBadge level="apply" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveClass('bg-green-100', 'text-green-700')
    })

    it('applies yellow colors for "analyze"', () => {
      render(<BloomsBadge level="analyze" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700')
    })

    it('applies orange colors for "evaluate"', () => {
      render(<BloomsBadge level="evaluate" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-700')
    })

    it('applies purple colors for "create"', () => {
      render(<BloomsBadge level="create" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-700')
    })
  })

  describe('edge cases', () => {
    it('handles null level gracefully', () => {
      render(<BloomsBadge level={null} />)
      expect(screen.getByText('평가중')).toBeInTheDocument()
    })

    it('handles undefined level gracefully', () => {
      render(<BloomsBadge level={undefined} />)
      expect(screen.getByText('평가중')).toBeInTheDocument()
    })

    it('handles unknown level string', () => {
      render(<BloomsBadge level="unknown" />)
      expect(screen.getByText('unknown')).toBeInTheDocument()
    })
  })

  describe('description prop', () => {
    it('shows description when showDescription is true', () => {
      render(<BloomsBadge level="analyze" showDescription />)
      expect(screen.getByText(/분석하고 관계를 파악/)).toBeInTheDocument()
    })

    it('sets title attribute with description', () => {
      render(<BloomsBadge level="analyze" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveAttribute('title', '정보를 분석하고 관계를 파악하는 수준')
    })
  })

  describe('size variants', () => {
    it('applies small size classes', () => {
      render(<BloomsBadge level="apply" size="sm" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-0.5')
    })

    it('applies default (md) size classes', () => {
      render(<BloomsBadge level="apply" />)
      const badge = screen.getByTestId('blooms-badge')
      expect(badge).toHaveClass('text-sm', 'px-2', 'py-1')
    })
  })
})
```

### TDD Step 2: Run Tests (Should Fail)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/BloomsBadge.test.tsx
```

### TDD Step 3: Implement Component

Create `src/features/inquiry-mode/components/BloomsBadge.tsx`:

```typescript
import { BLOOMS_KOREAN, BLOOMS_DESCRIPTIONS, type BloomsLevel } from '../types'

interface BloomsBadgeProps {
  level: string | null | undefined
  showDescription?: boolean
  size?: 'sm' | 'md'
}

const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  remember: 'bg-gray-100 text-gray-700',
  understand: 'bg-blue-100 text-blue-700',
  apply: 'bg-green-100 text-green-700',
  analyze: 'bg-yellow-100 text-yellow-700',
  evaluate: 'bg-orange-100 text-orange-700',
  create: 'bg-purple-100 text-purple-700',
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2 py-1',
}

export function BloomsBadge({ level, showDescription = false, size = 'md' }: BloomsBadgeProps) {
  const isValidLevel = level && level in BLOOMS_KOREAN
  const korean = isValidLevel ? BLOOMS_KOREAN[level as BloomsLevel] : level || '평가중'
  const description = isValidLevel ? BLOOMS_DESCRIPTIONS[level as BloomsLevel] : ''
  const colorClass = isValidLevel ? BLOOMS_COLORS[level as BloomsLevel] : 'bg-gray-100 text-gray-700'

  return (
    <span
      data-testid="blooms-badge"
      className={`rounded font-medium capitalize ${SIZE_CLASSES[size]} ${colorClass}`}
      title={description}
    >
      {korean}
      {showDescription && description && (
        <span className="block text-xs font-normal mt-0.5">{description}</span>
      )}
    </span>
  )
}
```

### TDD Step 4: Run Tests (Should Pass)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/BloomsBadge.test.tsx
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx` (lines 175-209)
- `src/app/(dashboard)/activities/[id]/inquiry/[attemptId]/results/page.tsx` (lines 141-151)
- `src/features/inquiry-mode/types.ts` - Source of type definitions

## Dependencies

**Blocked By:**
- VIBE-0009-WI01 (Foundation & Types)

**Blocks:**
- VIBE-0009-WI06 (QuestionSubmissionCard)
- VIBE-0009-WI08 (InquiryResultCard)
- VIBE-0009-WI11 (Take Page Refactor)
- VIBE-0009-WI13 (Results Page Refactor)

## Test Commands

```bash
# Run this specific test
npm test -- src/features/inquiry-mode/components/__tests__/BloomsBadge.test.tsx

# Run with coverage
npm test -- --coverage src/features/inquiry-mode/components/__tests__/BloomsBadge.test.tsx
```

## Notes

- Component must preserve all existing color mappings exactly
- Korean translations are critical - must match existing labels
- This component will be reused across all inquiry pages

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
