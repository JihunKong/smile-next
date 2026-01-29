/**
 * Tests for QuestionNav Component
 *
 * @see VIBE-0010
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionNav } from '@/features/exam-mode/components/take/QuestionNav'

describe('QuestionNav', () => {
  const defaultProps = {
    questions: [
      { id: 'q-1' },
      { id: 'q-2' },
      { id: 'q-3' },
      { id: 'q-4' },
      { id: 'q-5' },
    ],
    currentIndex: 0,
    answers: {} as Record<string, string[]>,
    flaggedQuestions: new Set<string>(),
    onSelectQuestion: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Progress Bar', () => {
    it('should display progress label', () => {
      render(<QuestionNav {...defaultProps} />)
      expect(screen.getByText('Progress')).toBeInTheDocument()
    })

    it('should show 0 of N answered initially', () => {
      render(<QuestionNav {...defaultProps} />)
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText(/of 5 answered/)).toBeInTheDocument()
    })

    it('should update answered count', () => {
      const { container } = render(
        <QuestionNav
          {...defaultProps}
          answers={{ 'q-1': ['0'], 'q-2': ['1'], 'q-3': ['2'] }}
        />
      )
      // Find the semibold span with the count
      const countSpan = container.querySelector('.font-semibold')
      expect(countSpan?.textContent).toBe('3')
    })
  })

  describe('Question Navigation Buttons', () => {
    it('should render a button for each question', () => {
      render(<QuestionNav {...defaultProps} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should call onSelectQuestion when a button is clicked', () => {
      const onSelectQuestion = vi.fn()
      render(<QuestionNav {...defaultProps} onSelectQuestion={onSelectQuestion} />)

      fireEvent.click(screen.getByText('3'))
      expect(onSelectQuestion).toHaveBeenCalledWith(2) // 0-indexed
    })
  })

  describe('Question Status Styling', () => {
    it('should highlight current question in blue', () => {
      const { container } = render(<QuestionNav {...defaultProps} currentIndex={2} />)
      const buttons = container.querySelectorAll('button')
      expect(buttons[2]).toHaveClass('bg-blue-600')
    })

    it('should show answered questions in green', () => {
      const { container } = render(
        <QuestionNav
          {...defaultProps}
          answers={{ 'q-2': ['0'] }}
        />
      )
      const buttons = container.querySelectorAll('button')
      expect(buttons[1]).toHaveClass('bg-green-500')
    })

    it('should show unanswered questions in yellow', () => {
      const { container } = render(<QuestionNav {...defaultProps} />)
      const buttons = container.querySelectorAll('button')
      expect(buttons[1]).toHaveClass('bg-yellow-100')
    })

    it('should show current question style even if answered', () => {
      const { container } = render(
        <QuestionNav
          {...defaultProps}
          currentIndex={0}
          answers={{ 'q-1': ['0'] }}
        />
      )
      const buttons = container.querySelectorAll('button')
      // Current takes precedence
      expect(buttons[0]).toHaveClass('bg-blue-600')
    })
  })

  describe('Flagged Questions', () => {
    it('should show flagged indicator in title', () => {
      render(
        <QuestionNav
          {...defaultProps}
          flaggedQuestions={new Set(['q-2'])}
        />
      )
      const button = screen.getByText('2').closest('button')
      expect(button).toHaveAttribute('title', expect.stringContaining('(Flagged)'))
    })

    it('should not show flagged indicator for unflagged questions', () => {
      render(<QuestionNav {...defaultProps} />)
      const button = screen.getByText('2').closest('button')
      expect(button).toHaveAttribute('title', expect.not.stringContaining('(Flagged)'))
    })
  })

  describe('Custom Labels', () => {
    it('should use custom progress label', () => {
      render(
        <QuestionNav
          {...defaultProps}
          labels={{ progress: '진행률' }}
        />
      )
      expect(screen.getByText('진행률')).toBeInTheDocument()
    })

    it('should use custom answered label', () => {
      render(
        <QuestionNav
          {...defaultProps}
          labels={{ answered: '응답완료' }}
        />
      )
      expect(screen.getByText(/응답완료/)).toBeInTheDocument()
    })

    it('should use custom flagged label in title', () => {
      render(
        <QuestionNav
          {...defaultProps}
          flaggedQuestions={new Set(['q-1'])}
          labels={{ flagged: '(플래그됨)' }}
        />
      )
      const button = screen.getByText('1').closest('button')
      expect(button).toHaveAttribute('title', expect.stringContaining('(플래그됨)'))
    })
  })

  describe('Empty State', () => {
    it('should handle empty questions array', () => {
      const { container } = render(
        <QuestionNav {...defaultProps} questions={[]} />
      )
      const buttons = container.querySelectorAll('.flex-wrap.gap-2 button')
      expect(buttons).toHaveLength(0)
    })
  })

  describe('Large Question Count', () => {
    it('should render many question buttons', () => {
      const manyQuestions = Array.from({ length: 50 }, (_, i) => ({ id: `q-${i + 1}` }))
      render(<QuestionNav {...defaultProps} questions={manyQuestions} />)
      expect(screen.getByText('50')).toBeInTheDocument()
    })
  })
})
