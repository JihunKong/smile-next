---
id: VIBE-0009-WI08
title: Extract InquiryResultCard Component (TDD)
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

# Extract InquiryResultCard Component (TDD)

## Summary

Create a results card for displaying individual question evaluations with detailed scores, feedback, strengths, improvements, and enhanced questions. This replaces the inline rendering in the results page.

## Current Behavior

Question results are rendered inline in `results/page.tsx` with:
- Question content and creation time
- Overall score with breakdown (creativity, clarity, relevance, etc.)
- Bloom's level badge
- Strengths and improvements lists
- Enhanced question suggestions

## Expected Behavior

A dedicated `InquiryResultCard` component that:
- Displays question content
- Shows overall and breakdown scores using `QualityScoreDisplay`
- Includes Bloom's level using `BloomsBadge`
- Has expandable section for detailed feedback
- Shows strengths, improvements, and enhanced questions

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 8 test cases)
- [ ] Component is under 120 lines
- [ ] Uses BloomsBadge and QualityScoreDisplay components
- [ ] Component exported from `components/index.ts`
- [ ] Handles missing evaluation gracefully

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/components/__tests__/InquiryResultCard.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { InquiryResultCard } from '../InquiryResultCard'
import type { QuestionWithEvaluation } from '../../types'

describe('InquiryResultCard', () => {
  const mockQuestion: QuestionWithEvaluation = {
    id: '1',
    content: 'How does machine learning impact education?',
    createdAt: new Date('2026-01-20T10:30:00'),
    evaluation: {
      overallScore: 85,
      creativityScore: 80,
      clarityScore: 90,
      relevanceScore: 85,
      innovationScore: 75,
      complexityScore: 88,
      bloomsLevel: 'analyze',
      evaluationText: 'Excellent analytical question that demonstrates deep understanding.',
      strengths: ['Clear wording', 'Relevant topic', 'Good depth'],
      improvements: ['Add specific context', 'Consider practical examples'],
      enhancedQuestions: [
        { level: 'evaluate', question: 'Evaluate the effectiveness of ML in special education' }
      ],
      nextLevelGuidance: 'Try creating questions that require evaluation or creation.',
    },
  }

  describe('basic rendering', () => {
    it('renders question content', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} />)
      expect(screen.getByText(/machine learning impact/)).toBeInTheDocument()
    })

    it('shows question number (1-indexed)', () => {
      render(<InquiryResultCard question={mockQuestion} index={2} />)
      expect(screen.getByText('질문 3')).toBeInTheDocument()
    })

    it('displays overall score', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} />)
      expect(screen.getByText('85')).toBeInTheDocument()
    })

    it('displays Blooms badge', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} />)
      expect(screen.getByText('분석')).toBeInTheDocument()
    })
  })

  describe('expandable details', () => {
    it('hides breakdown scores by default', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} />)
      expect(screen.queryByText(/창의성/)).not.toBeInTheDocument()
    })

    it('shows breakdown scores when expand button clicked', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} />)
      
      fireEvent.click(screen.getByRole('button', { name: /상세 보기/ }))
      
      expect(screen.getByText(/창의성/)).toBeInTheDocument()
      expect(screen.getByText(/명확성/)).toBeInTheDocument()
      expect(screen.getByText(/관련성/)).toBeInTheDocument()
    })

    it('shows breakdown scores immediately when expanded prop is true', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} expanded />)
      expect(screen.getByText(/창의성/)).toBeInTheDocument()
    })

    it('toggles expansion on button click', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} />)
      
      const button = screen.getByRole('button', { name: /상세/ })
      fireEvent.click(button)
      expect(screen.getByText(/창의성/)).toBeInTheDocument()
      
      fireEvent.click(screen.getByRole('button', { name: /접기/ }))
      expect(screen.queryByText(/창의성/)).not.toBeInTheDocument()
    })
  })

  describe('feedback sections', () => {
    it('displays evaluation text', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} expanded />)
      expect(screen.getByText(/Excellent analytical question/)).toBeInTheDocument()
    })

    it('displays strengths list', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} expanded />)
      expect(screen.getByText('Clear wording')).toBeInTheDocument()
      expect(screen.getByText('Relevant topic')).toBeInTheDocument()
    })

    it('displays improvements list', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} expanded />)
      expect(screen.getByText('Add specific context')).toBeInTheDocument()
    })

    it('displays enhanced questions', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} expanded />)
      expect(screen.getByText(/Evaluate the effectiveness/)).toBeInTheDocument()
    })

    it('displays next level guidance', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} expanded />)
      expect(screen.getByText(/evaluation or creation/)).toBeInTheDocument()
    })
  })

  describe('score breakdown display', () => {
    it('shows individual score values', () => {
      render(<InquiryResultCard question={mockQuestion} index={0} expanded />)
      expect(screen.getByText('80')).toBeInTheDocument() // creativity
      expect(screen.getByText('90')).toBeInTheDocument() // clarity
    })

    it('handles null individual scores', () => {
      const partialEval = {
        ...mockQuestion,
        evaluation: {
          ...mockQuestion.evaluation!,
          creativityScore: null,
        },
      }
      render(<InquiryResultCard question={partialEval} index={0} expanded />)
      expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    })
  })

  describe('missing evaluation handling', () => {
    it('shows pending message when evaluation is null', () => {
      const noEval = { ...mockQuestion, evaluation: null }
      render(<InquiryResultCard question={noEval} index={0} />)
      expect(screen.getByText(/평가 대기 중/)).toBeInTheDocument()
    })

    it('hides expand button when evaluation is null', () => {
      const noEval = { ...mockQuestion, evaluation: null }
      render(<InquiryResultCard question={noEval} index={0} />)
      expect(screen.queryByRole('button', { name: /상세/ })).not.toBeInTheDocument()
    })
  })

  describe('empty lists handling', () => {
    it('hides strengths section when empty', () => {
      const noStrengths = {
        ...mockQuestion,
        evaluation: { ...mockQuestion.evaluation!, strengths: [] },
      }
      render(<InquiryResultCard question={noStrengths} index={0} expanded />)
      expect(screen.queryByText(/강점/)).not.toBeInTheDocument()
    })

    it('hides improvements section when empty', () => {
      const noImprovements = {
        ...mockQuestion,
        evaluation: { ...mockQuestion.evaluation!, improvements: [] },
      }
      render(<InquiryResultCard question={noImprovements} index={0} expanded />)
      expect(screen.queryByText(/개선점/)).not.toBeInTheDocument()
    })
  })
})
```

### TDD Step 2: Run Tests (Should Fail)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/InquiryResultCard.test.tsx
```

### TDD Step 3: Implement Component

Create `src/features/inquiry-mode/components/InquiryResultCard.tsx`:

```typescript
'use client'

import { useState } from 'react'
import type { QuestionWithEvaluation } from '../types'
import { BloomsBadge } from './BloomsBadge'
import { getScoreColor } from './QualityScoreDisplay'

interface InquiryResultCardProps {
  question: QuestionWithEvaluation
  index: number
  expanded?: boolean
}

const SCORE_LABELS = {
  creativityScore: '창의성',
  clarityScore: '명확성',
  relevanceScore: '관련성',
  innovationScore: '혁신성',
  complexityScore: '복잡도',
}

export function InquiryResultCard({ question, index, expanded: initialExpanded = false }: InquiryResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const { content, evaluation } = question

  if (!evaluation) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium">
            질문 {index + 1}
          </span>
        </div>
        <p className="text-gray-700 mb-2">{content}</p>
        <p className="text-gray-500 text-sm">평가 대기 중...</p>
      </div>
    )
  }

  const { overallScore, bloomsLevel, evaluationText, strengths, improvements, enhancedQuestions, nextLevelGuidance } = evaluation

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
            질문 {index + 1}
          </span>
          {bloomsLevel && <BloomsBadge level={bloomsLevel} size="sm" />}
        </div>
        <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
          {overallScore}
        </span>
      </div>

      {/* Question Content */}
      <p className="text-gray-800 mb-3">{content}</p>

      {/* Evaluation Text */}
      {evaluationText && (
        <p className="text-gray-600 text-sm mb-3 italic">{evaluationText}</p>
      )}

      {/* Expand Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 text-sm hover:underline flex items-center gap-1"
        aria-label={isExpanded ? '상세 접기' : '상세 보기'}
      >
        {isExpanded ? '접기' : '상세 보기'}
        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(SCORE_LABELS).map(([key, label]) => {
              const score = evaluation[key as keyof typeof SCORE_LABELS]
              return (
                <div key={key} className="text-center p-2 bg-gray-50 rounded">
                  <div className={`text-lg font-semibold ${score ? getScoreColor(score) : 'text-gray-400'}`}>
                    {score ?? '-'}
                  </div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              )
            })}
          </div>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-700 mb-2">✓ 강점</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {improvements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-700 mb-2">△ 개선점</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Enhanced Questions */}
          {enhancedQuestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2">💡 향상된 질문 예시</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                {enhancedQuestions.map((eq, i) => (
                  <li key={i} className="bg-blue-50 p-2 rounded">
                    {typeof eq === 'string' ? eq : (
                      <>
                        <span className="text-xs text-blue-600 font-medium">[{eq.level}]</span>{' '}
                        {eq.question}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Level Guidance */}
          {nextLevelGuidance && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>다음 단계:</strong> {nextLevelGuidance}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### TDD Step 4: Run Tests (Should Pass)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/InquiryResultCard.test.tsx
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/[attemptId]/results/page.tsx`
- `src/features/inquiry-mode/components/BloomsBadge.tsx`
- `src/features/inquiry-mode/components/QualityScoreDisplay.tsx`
- `src/features/inquiry-mode/types.ts`

## Dependencies

**Blocked By:**
- VIBE-0009-WI02 (BloomsBadge)
- VIBE-0009-WI03 (QualityScoreDisplay)

**Blocks:**
- VIBE-0009-WI13 (Results Page Refactor)

## Test Commands

```bash
# Run this specific test
npm test -- src/features/inquiry-mode/components/__tests__/InquiryResultCard.test.tsx

# Run with coverage
npm test -- --coverage src/features/inquiry-mode/components/__tests__/InquiryResultCard.test.tsx
```

## Notes

- Component must be a client component ('use client') for useState
- Korean labels must be preserved exactly
- Score color function should be imported from QualityScoreDisplay

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
