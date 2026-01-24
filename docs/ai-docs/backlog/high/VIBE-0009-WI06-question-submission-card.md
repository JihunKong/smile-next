---
id: VIBE-0009-WI06
title: Extract QuestionSubmissionCard Component (TDD)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: m
assignee: ai-agent
parent: VIBE-0009
---

# Extract QuestionSubmissionCard Component (TDD)

## Summary

Create a card component that displays a submitted question with its evaluation status and Bloom's level during the inquiry take experience. This replaces the inline rendering in `inquiry-take-client.tsx`.

## Current Behavior

Submitted questions are rendered inline in `inquiry-take-client.tsx` (lines 457-539) with:
- Question number and content display
- Evaluation status indicator (evaluating, completed, error)
- Bloom's level badge
- Score display with color coding
- Feedback text when available

## Expected Behavior

A dedicated `QuestionSubmissionCard` component that:
- Displays question number and content
- Shows real-time evaluation status (spinner, completed, error)
- Includes Bloom's level badge using `BloomsBadge` component
- Shows score with appropriate styling
- Displays feedback when available

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 8 test cases)
- [ ] Component is under 100 lines
- [ ] Uses BloomsBadge component
- [ ] Component exported from `components/index.ts`
- [ ] Handles all evaluation statuses

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/components/__tests__/QuestionSubmissionCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { QuestionSubmissionCard } from '../QuestionSubmissionCard'
import type { SubmittedQuestion } from '../../types'

describe('QuestionSubmissionCard', () => {
  const completedQuestion: SubmittedQuestion = {
    id: '1',
    content: 'What is the impact of AI on education?',
    score: 8.5,
    bloomsLevel: 'analyze',
    feedback: 'Great analytical question!',
    evaluationStatus: 'completed',
  }

  describe('basic rendering', () => {
    it('renders question content', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={0} />)
      expect(screen.getByText(/What is the impact/)).toBeInTheDocument()
    })

    it('shows question number (1-indexed)', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={2} />)
      expect(screen.getByText('Q3')).toBeInTheDocument()
    })

    it('has appropriate test id', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={0} />)
      expect(screen.getByTestId('question-card-0')).toBeInTheDocument()
    })
  })

  describe('completed status', () => {
    it('displays score when completed', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={0} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
    })

    it('displays score out of 10', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={0} />)
      expect(screen.getByText('/ 10')).toBeInTheDocument()
    })

    it('displays Blooms badge when level is available', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={0} />)
      expect(screen.getByTestId('blooms-badge')).toBeInTheDocument()
      expect(screen.getByText('분석')).toBeInTheDocument()
    })

    it('displays feedback text', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={0} />)
      expect(screen.getByText('Great analytical question!')).toBeInTheDocument()
    })

    it('applies correct score color for high score', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={0} />)
      expect(screen.getByText('8.5')).toHaveClass('text-green-600')
    })

    it('applies correct score color for low score', () => {
      const lowScore = { ...completedQuestion, score: 4.0 }
      render(<QuestionSubmissionCard question={lowScore} index={0} />)
      expect(screen.getByText('4.0')).toHaveClass('text-red-600')
    })

    it('shows success feedback message for high score', () => {
      render(<QuestionSubmissionCard question={completedQuestion} index={0} />)
      expect(screen.getByText(/훌륭해요/)).toBeInTheDocument()
    })
  })

  describe('evaluating status', () => {
    const evaluating: SubmittedQuestion = {
      ...completedQuestion,
      score: null,
      bloomsLevel: null,
      evaluationStatus: 'evaluating',
    }

    it('shows loading spinner when evaluating', () => {
      render(<QuestionSubmissionCard question={evaluating} index={0} />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('shows evaluating status badge', () => {
      render(<QuestionSubmissionCard question={evaluating} index={0} />)
      expect(screen.getByText(/AI 평가 중/)).toBeInTheDocument()
    })

    it('applies pulse animation to card', () => {
      render(<QuestionSubmissionCard question={evaluating} index={0} />)
      const card = screen.getByTestId('question-card-0')
      expect(card).toHaveClass('animate-pulse')
    })

    it('does not show score when evaluating', () => {
      render(<QuestionSubmissionCard question={evaluating} index={0} />)
      expect(screen.queryByText('/ 10')).not.toBeInTheDocument()
    })
  })

  describe('pending status', () => {
    const pending: SubmittedQuestion = {
      ...completedQuestion,
      score: null,
      bloomsLevel: null,
      feedback: null,
      evaluationStatus: 'pending',
    }

    it('shows pending indicator', () => {
      render(<QuestionSubmissionCard question={pending} index={0} />)
      expect(screen.getByText(/대기/)).toBeInTheDocument()
    })
  })

  describe('error status', () => {
    const errorQuestion: SubmittedQuestion = {
      ...completedQuestion,
      score: null,
      bloomsLevel: null,
      feedback: 'Submission failed',
      evaluationStatus: 'error',
    }

    it('shows error indicator', () => {
      render(<QuestionSubmissionCard question={errorQuestion} index={0} />)
      expect(screen.getByText(/오류/)).toBeInTheDocument()
    })

    it('applies error styles to card', () => {
      render(<QuestionSubmissionCard question={errorQuestion} index={0} />)
      const card = screen.getByTestId('question-card-0')
      expect(card).toHaveClass('border-red-300')
    })

    it('displays error message in feedback', () => {
      render(<QuestionSubmissionCard question={errorQuestion} index={0} />)
      expect(screen.getByText('Submission failed')).toBeInTheDocument()
    })
  })

  describe('null score handling', () => {
    it('shows dash when score is null', () => {
      const noScore = { ...completedQuestion, score: null }
      render(<QuestionSubmissionCard question={noScore} index={0} />)
      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })
})
```

### TDD Step 2: Run Tests (Should Fail)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/QuestionSubmissionCard.test.tsx
```

### TDD Step 3: Implement Component

Create `src/features/inquiry-mode/components/QuestionSubmissionCard.tsx`:

```typescript
import type { SubmittedQuestion } from '../types'
import { BloomsBadge } from './BloomsBadge'

interface QuestionSubmissionCardProps {
  question: SubmittedQuestion
  index: number
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-500'
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreMessage(score: number | null): string {
  if (score === null) return ''
  if (score >= 8) return '훌륭해요!'
  if (score >= 6) return '좋아요'
  return '개선 필요'
}

export function QuestionSubmissionCard({ question, index }: QuestionSubmissionCardProps) {
  const { content, score, bloomsLevel, feedback, evaluationStatus } = question
  const isEvaluating = evaluationStatus === 'evaluating'
  const isError = evaluationStatus === 'error'
  const isPending = evaluationStatus === 'pending'

  const cardClasses = `
    border rounded-lg p-4 transition-all
    ${isEvaluating ? 'border-yellow-300 bg-yellow-50 animate-pulse' : ''}
    ${isError ? 'border-red-300 bg-red-50' : ''}
    ${!isEvaluating && !isError ? 'border-gray-200' : ''}
  `

  return (
    <div data-testid={`question-card-${index}`} className={cardClasses}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
              Q{index + 1}
            </span>
            
            {isEvaluating && (
              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium flex items-center gap-1">
                <div data-testid="loading-spinner" className="animate-spin h-3 w-3 border-2 border-yellow-500 border-t-transparent rounded-full" />
                AI 평가 중...
              </span>
            )}
            
            {isError && (
              <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium">
                오류 발생
              </span>
            )}
            
            {isPending && (
              <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                대기 중
              </span>
            )}
            
            {bloomsLevel && !isEvaluating && (
              <BloomsBadge level={bloomsLevel} size="sm" />
            )}
          </div>
          
          <p className="text-gray-800">{content}</p>
          
          {feedback && !isEvaluating && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{feedback}</span>
              </p>
            </div>
          )}
        </div>
        
        <div className="text-right min-w-[60px]">
          {isEvaluating ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
              <p className="text-xs text-yellow-600 mt-1">평가중</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-600 mt-1">오류</p>
            </div>
          ) : (
            <>
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score !== null ? score.toFixed(1) : '-'}
              </span>
              {score !== null && <p className="text-xs text-gray-500">/ 10</p>}
              {score !== null && (
                <div className={`mt-1 text-xs font-medium ${getScoreColor(score)}`}>
                  {getScoreMessage(score)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

### TDD Step 4: Run Tests (Should Pass)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/QuestionSubmissionCard.test.tsx
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx` (lines 457-539)
- `src/features/inquiry-mode/components/BloomsBadge.tsx`
- `src/features/inquiry-mode/types.ts`

## Dependencies

**Blocked By:**
- VIBE-0009-WI02 (BloomsBadge)
- VIBE-0009-WI05 (KeywordInput - same phase, parallel)

**Blocks:**
- VIBE-0009-WI11 (Take Page Refactor)

## Test Commands

```bash
# Run this specific test
npm test -- src/features/inquiry-mode/components/__tests__/QuestionSubmissionCard.test.tsx

# Run with coverage
npm test -- --coverage src/features/inquiry-mode/components/__tests__/QuestionSubmissionCard.test.tsx
```

## Notes

- Preserves all existing visual states from the original implementation
- Korean text must be preserved exactly
- All animations (pulse, spin) must work identically

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
