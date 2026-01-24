---
id: VIBE-0009-WI07
title: Extract InquiryProgress Component (TDD)
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

# Extract InquiryProgress Component (TDD)

## Summary

Create a progress indicator component showing current question count vs required count. This provides visual feedback on the student's progress through the inquiry attempt.

## Current Behavior

Progress display is inline in `inquiry-take-client.tsx` (lines 298-308):
- Progress bar with gradient styling
- Count display (completed/remaining)
- Percentage-based width calculation

## Expected Behavior

A dedicated `InquiryProgress` component that:
- Displays current vs total count
- Shows animated progress bar
- Indicates completion state
- Supports optional label

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 5 test cases)
- [ ] Component is under 60 lines
- [ ] Component exported from `components/index.ts`
- [ ] Preserves gradient styling

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/components/__tests__/InquiryProgress.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { InquiryProgress } from '../InquiryProgress'

describe('InquiryProgress', () => {
  describe('count display', () => {
    it('renders current and total count', () => {
      render(<InquiryProgress current={3} total={5} />)
      expect(screen.getByText(/3/)).toBeInTheDocument()
      expect(screen.getByText(/5/)).toBeInTheDocument()
    })

    it('shows completed count message', () => {
      render(<InquiryProgress current={2} total={5} />)
      expect(screen.getByText(/2개 완료/)).toBeInTheDocument()
    })

    it('shows remaining count message', () => {
      render(<InquiryProgress current={2} total={5} />)
      expect(screen.getByText(/3개 남음/)).toBeInTheDocument()
    })
  })

  describe('progress bar', () => {
    it('shows progress bar with correct width', () => {
      render(<InquiryProgress current={2} total={4} />)
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('shows 0% width when no progress', () => {
      render(<InquiryProgress current={0} total={5} />)
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveStyle({ width: '0%' })
    })

    it('shows 100% width when complete', () => {
      render(<InquiryProgress current={5} total={5} />)
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveStyle({ width: '100%' })
    })

    it('applies gradient classes', () => {
      render(<InquiryProgress current={3} total={5} />)
      const progressBar = screen.getByTestId('progress-bar')
      expect(progressBar).toHaveClass('bg-gradient-to-r')
    })
  })

  describe('completion state', () => {
    it('shows completion message when current equals total', () => {
      render(<InquiryProgress current={5} total={5} />)
      expect(screen.getByText(/모든 질문.*완료/)).toBeInTheDocument()
    })

    it('applies completion styles', () => {
      render(<InquiryProgress current={5} total={5} />)
      const container = screen.getByTestId('inquiry-progress')
      expect(container).toHaveClass('bg-green-50')
    })
  })

  describe('optional label', () => {
    it('renders label when provided', () => {
      render(<InquiryProgress current={1} total={3} label="질문 생성" />)
      expect(screen.getByText('질문 생성')).toBeInTheDocument()
    })

    it('does not render label when not provided', () => {
      render(<InquiryProgress current={1} total={3} />)
      expect(screen.queryByTestId('progress-label')).not.toBeInTheDocument()
    })
  })

  describe('activity info', () => {
    it('renders activity name when provided', () => {
      render(<InquiryProgress current={1} total={3} activityName="Test Activity" />)
      expect(screen.getByText('Test Activity')).toBeInTheDocument()
    })

    it('renders mode indicator', () => {
      render(<InquiryProgress current={1} total={3} showModeIndicator />)
      expect(screen.getByText(/탐구 학습 모드/)).toBeInTheDocument()
    })
  })
})
```

### TDD Step 2: Run Tests (Should Fail)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/InquiryProgress.test.tsx
```

### TDD Step 3: Implement Component

Create `src/features/inquiry-mode/components/InquiryProgress.tsx`:

```typescript
interface InquiryProgressProps {
  current: number
  total: number
  label?: string
  activityName?: string
  showModeIndicator?: boolean
}

export function InquiryProgress({
  current,
  total,
  label,
  activityName,
  showModeIndicator = false,
}: InquiryProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0
  const remaining = total - current
  const isComplete = current >= total

  return (
    <div
      data-testid="inquiry-progress"
      className={`rounded-lg ${isComplete ? 'bg-green-50' : ''}`}
    >
      {/* Header with activity info */}
      {(activityName || showModeIndicator) && (
        <div className="mb-3">
          {showModeIndicator && (
            <p className="text-sm text-gray-500">탐구 학습 모드</p>
          )}
          {activityName && (
            <h1 className="font-semibold text-gray-900">{activityName}</h1>
          )}
        </div>
      )}

      {/* Label */}
      {label && (
        <p data-testid="progress-label" className="text-sm text-gray-600 mb-2">
          {label}
        </p>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          data-testid="progress-bar"
          className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Count Display */}
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{current}개 완료</span>
        <span>
          {isComplete ? (
            <span className="text-green-600 font-medium">모든 질문 완료! 🎉</span>
          ) : (
            `${remaining}개 남음`
          )}
        </span>
      </div>
    </div>
  )
}
```

### TDD Step 4: Run Tests (Should Pass)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/InquiryProgress.test.tsx
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx` (lines 298-308)

## Dependencies

**Blocked By:**
- VIBE-0009-WI01 (Foundation & Types)

**Blocks:**
- VIBE-0009-WI11 (Take Page Refactor)

## Test Commands

```bash
# Run this specific test
npm test -- src/features/inquiry-mode/components/__tests__/InquiryProgress.test.tsx

# Run with coverage
npm test -- --coverage src/features/inquiry-mode/components/__tests__/InquiryProgress.test.tsx
```

## Notes

- Gradient colors (yellow-400 to yellow-600) are specific to inquiry mode
- Consider making this a shared component with configurable colors for other modes
- Animation (transition-all duration-500) should be preserved

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
