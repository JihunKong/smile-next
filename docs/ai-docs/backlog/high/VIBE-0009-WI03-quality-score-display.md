---
id: VIBE-0009-WI03
title: Extract QualityScoreDisplay Component (TDD)
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

# Extract QualityScoreDisplay Component (TDD)

## Summary

Extract score display and color logic used in inquiry results and leaderboard pages into a reusable component. This handles the visual representation of quality scores with appropriate color coding.

## Current Behavior

Score display logic is duplicated in:
- `inquiry-take-client.tsx` (lines 168-173): `getScoreColor()` for 0-10 scale
- `results/page.tsx` (lines 129-139): `getScoreColor()`, `getScoreBgColor()` for percentage scale
- `leaderboard/page.tsx`: Inline score coloring logic

## Expected Behavior

A single, reusable `QualityScoreDisplay` component that:
- Displays scores with appropriate color coding
- Supports both 0-10 and percentage scales
- Shows pass/fail indicators when threshold provided
- Provides exported utility functions for use elsewhere

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 6 test cases)
- [ ] Component is under 60 lines
- [ ] Utility functions exported for standalone use
- [ ] Component exported from `components/index.ts`

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/components/__tests__/QualityScoreDisplay.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { QualityScoreDisplay, getScoreColor, getScoreBgColor } from '../QualityScoreDisplay'

describe('QualityScoreDisplay', () => {
  describe('getScoreColor utility', () => {
    it('returns emerald for scores >= 80', () => {
      expect(getScoreColor(80)).toBe('text-emerald-600')
      expect(getScoreColor(100)).toBe('text-emerald-600')
      expect(getScoreColor(85)).toBe('text-emerald-600')
    })

    it('returns amber for scores >= 60 and < 80', () => {
      expect(getScoreColor(60)).toBe('text-amber-600')
      expect(getScoreColor(79)).toBe('text-amber-600')
      expect(getScoreColor(70)).toBe('text-amber-600')
    })

    it('returns red for scores < 60', () => {
      expect(getScoreColor(59)).toBe('text-red-600')
      expect(getScoreColor(0)).toBe('text-red-600')
      expect(getScoreColor(30)).toBe('text-red-600')
    })
  })

  describe('getScoreBgColor utility', () => {
    it('returns emerald background for scores >= 80', () => {
      expect(getScoreBgColor(80)).toBe('bg-emerald-50')
    })

    it('returns amber background for scores >= 60', () => {
      expect(getScoreBgColor(70)).toBe('bg-amber-50')
    })

    it('returns red background for scores < 60', () => {
      expect(getScoreBgColor(50)).toBe('bg-red-50')
    })
  })

  describe('score rendering', () => {
    it('renders percentage score by default', () => {
      render(<QualityScoreDisplay score={85} />)
      expect(screen.getByText('85%')).toBeInTheDocument()
    })

    it('renders score out of 10 when scale is "10"', () => {
      render(<QualityScoreDisplay score={8.5} scale="10" />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
      expect(screen.getByText('/ 10')).toBeInTheDocument()
    })

    it('renders score with custom label', () => {
      render(<QualityScoreDisplay score={90} label="평균 점수" />)
      expect(screen.getByText('평균 점수')).toBeInTheDocument()
    })
  })

  describe('pass/fail status', () => {
    it('shows "통과" when score >= threshold and showPassStatus is true', () => {
      render(<QualityScoreDisplay score={75} passThreshold={70} showPassStatus />)
      expect(screen.getByText(/통과/)).toBeInTheDocument()
    })

    it('shows "미달" when score < threshold and showPassStatus is true', () => {
      render(<QualityScoreDisplay score={65} passThreshold={70} showPassStatus />)
      expect(screen.getByText(/미달/)).toBeInTheDocument()
    })

    it('does not show pass status when showPassStatus is false', () => {
      render(<QualityScoreDisplay score={85} passThreshold={70} />)
      expect(screen.queryByText(/통과/)).not.toBeInTheDocument()
      expect(screen.queryByText(/미달/)).not.toBeInTheDocument()
    })
  })

  describe('size variants', () => {
    it('applies small size classes', () => {
      render(<QualityScoreDisplay score={80} size="sm" />)
      const display = screen.getByTestId('quality-score-display')
      expect(display).toHaveClass('text-lg')
    })

    it('applies large size classes', () => {
      render(<QualityScoreDisplay score={80} size="lg" />)
      const display = screen.getByTestId('quality-score-display')
      expect(display).toHaveClass('text-4xl')
    })
  })

  describe('edge cases', () => {
    it('handles null score gracefully', () => {
      render(<QualityScoreDisplay score={null} />)
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('handles undefined score gracefully', () => {
      render(<QualityScoreDisplay score={undefined} />)
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('handles 0 score correctly', () => {
      render(<QualityScoreDisplay score={0} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })
})
```

### TDD Step 2: Run Tests (Should Fail)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/QualityScoreDisplay.test.tsx
```

### TDD Step 3: Implement Component

Create `src/features/inquiry-mode/components/QualityScoreDisplay.tsx`:

```typescript
interface QualityScoreDisplayProps {
  score: number | null | undefined
  scale?: 'percentage' | '10'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  passThreshold?: number
  showPassStatus?: boolean
}

/**
 * Get text color class based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

/**
 * Get background color class based on score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-50'
  if (score >= 60) return 'bg-amber-50'
  return 'bg-red-50'
}

const SIZE_CLASSES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
}

export function QualityScoreDisplay({
  score,
  scale = 'percentage',
  size = 'md',
  label,
  passThreshold,
  showPassStatus = false,
}: QualityScoreDisplayProps) {
  const hasScore = score !== null && score !== undefined
  const normalizedScore = hasScore ? (scale === '10' ? score * 10 : score) : 0
  const colorClass = hasScore ? getScoreColor(normalizedScore) : 'text-gray-400'
  const passed = hasScore && passThreshold !== undefined ? score >= passThreshold : false

  return (
    <div data-testid="quality-score-display" className="text-center">
      {label && <div className="text-sm text-gray-500 mb-1">{label}</div>}
      <span className={`font-bold ${SIZE_CLASSES[size]} ${colorClass}`}>
        {hasScore ? (scale === '10' ? score.toFixed(1) : `${score}%`) : '-'}
      </span>
      {scale === '10' && hasScore && (
        <span className="text-gray-500 text-sm ml-1">/ 10</span>
      )}
      {showPassStatus && passThreshold !== undefined && hasScore && (
        <div className={`text-sm font-medium mt-1 ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
          {passed ? '✓ 통과' : '✗ 미달'}
        </div>
      )}
    </div>
  )
}
```

### TDD Step 4: Run Tests (Should Pass)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/QualityScoreDisplay.test.tsx
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx` (lines 168-173)
- `src/app/(dashboard)/activities/[id]/inquiry/[attemptId]/results/page.tsx` (lines 129-139)
- `src/features/case-mode/components/ScoreDisplay.tsx` - Similar component in case-mode

## Dependencies

**Blocked By:**
- VIBE-0009-WI01 (Foundation & Types)

**Blocks:**
- VIBE-0009-WI08 (InquiryResultCard)
- VIBE-0009-WI12 (Leaderboard Refactor)
- VIBE-0009-WI13 (Results Page Refactor)

## Test Commands

```bash
# Run this specific test
npm test -- src/features/inquiry-mode/components/__tests__/QualityScoreDisplay.test.tsx

# Run with coverage
npm test -- --coverage src/features/inquiry-mode/components/__tests__/QualityScoreDisplay.test.tsx
```

## Notes

- Export utility functions separately for use in server components
- Consider consolidating with `src/features/case-mode/components/ScoreDisplay.tsx` into shared
- Score color thresholds should be configurable in future iteration

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
