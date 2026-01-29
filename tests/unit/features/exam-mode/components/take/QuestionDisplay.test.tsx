/**
 * Tests for QuestionDisplay Component
 *
 * @see VIBE-0010
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionDisplay } from '@/features/exam-mode/components/take/QuestionDisplay'
import type { Question } from '@/features/exam-mode/types'

describe('QuestionDisplay', () => {
  const mockQuestion: Question = {
    id: 'q-1',
    content: 'What is the capital of France?',
    choices: ['London', 'Paris', 'Berlin', 'Madrid'],
  }

  const defaultProps = {
    question: mockQuestion,
    questionNumber: 1,
    totalQuestions: 10,
    selectedAnswer: [] as string[],
    choiceShuffle: [0, 1, 2, 3],
    isFlagged: false,
    onSelectAnswer: vi.fn(),
    onToggleFlag: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Question Content', () => {
    it('should display question content', () => {
      render(<QuestionDisplay {...defaultProps} />)
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    })

    it('should display question number', () => {
      render(<QuestionDisplay {...defaultProps} questionNumber={5} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should display total questions', () => {
      render(<QuestionDisplay {...defaultProps} />)
      expect(screen.getByText(/of 10/)).toBeInTheDocument()
    })

    it('should display content protected notice', () => {
      render(<QuestionDisplay {...defaultProps} />)
      expect(screen.getByText(/Content Protected/)).toBeInTheDocument()
    })
  })

  describe('Answer Choices', () => {
    it('should display all choices', () => {
      render(<QuestionDisplay {...defaultProps} />)
      expect(screen.getByText('London')).toBeInTheDocument()
      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('Berlin')).toBeInTheDocument()
      expect(screen.getByText('Madrid')).toBeInTheDocument()
    })

    it('should display choice letters A, B, C, D', () => {
      render(<QuestionDisplay {...defaultProps} />)
      expect(screen.getByText('A.')).toBeInTheDocument()
      expect(screen.getByText('B.')).toBeInTheDocument()
      expect(screen.getByText('C.')).toBeInTheDocument()
      expect(screen.getByText('D.')).toBeInTheDocument()
    })

    it('should respect shuffle order', () => {
      render(
        <QuestionDisplay
          {...defaultProps}
          choiceShuffle={[3, 2, 1, 0]} // Reversed order
        />
      )
      // Madrid should now be A
      const choices = screen.getAllByRole('button').filter(b =>
        b.textContent?.includes('.')
      )
      expect(choices[0]).toHaveTextContent('Madrid')
    })

    it('should call onSelectAnswer with original index when clicked', () => {
      const onSelectAnswer = vi.fn()
      render(
        <QuestionDisplay
          {...defaultProps}
          choiceShuffle={[3, 2, 1, 0]} // Madrid is first (A)
          onSelectAnswer={onSelectAnswer}
        />
      )

      // Click on first choice (which is Madrid, original index 3)
      const buttons = screen.getAllByRole('button')
      const answerButtons = buttons.filter(b => b.textContent?.includes('.'))
      fireEvent.click(answerButtons[0])

      expect(onSelectAnswer).toHaveBeenCalledWith(3)
    })
  })

  describe('Selected Answer', () => {
    it('should highlight selected answer', () => {
      render(
        <QuestionDisplay
          {...defaultProps}
          selectedAnswer={['1']} // Paris selected
        />
      )

      const parisButton = screen.getByText('Paris').closest('button')
      expect(parisButton).toHaveClass('border-blue-500')
    })

    it('should not highlight unselected answers', () => {
      render(
        <QuestionDisplay
          {...defaultProps}
          selectedAnswer={['1']} // Paris selected
        />
      )

      const londonButton = screen.getByText('London').closest('button')
      expect(londonButton).not.toHaveClass('border-blue-500')
    })
  })

  describe('Flag Button', () => {
    it('should call onToggleFlag when flag button is clicked', () => {
      const onToggleFlag = vi.fn()
      render(<QuestionDisplay {...defaultProps} onToggleFlag={onToggleFlag} />)

      // Find the flag button (it's the button without text content)
      const buttons = screen.getAllByRole('button')
      const flagButton = buttons.find(b =>
        !b.textContent?.includes('.') &&
        !b.textContent?.includes('London') &&
        !b.textContent?.includes('Paris')
      )
      fireEvent.click(flagButton!)

      expect(onToggleFlag).toHaveBeenCalledTimes(1)
    })

    it('should show filled flag icon when flagged', () => {
      const { container } = render(<QuestionDisplay {...defaultProps} isFlagged={true} />)
      // Filled flag has fill="currentColor"
      const filledFlag = container.querySelector('svg[fill="currentColor"]')
      expect(filledFlag).toBeInTheDocument()
    })

    it('should show outline flag icon when not flagged', () => {
      const { container } = render(<QuestionDisplay {...defaultProps} isFlagged={false} />)
      // Outline flag has fill="none"
      const outlineFlags = container.querySelectorAll('svg[fill="none"]')
      expect(outlineFlags.length).toBeGreaterThan(0)
    })
  })

  describe('Custom Labels', () => {
    it('should use custom of label', () => {
      render(
        <QuestionDisplay
          {...defaultProps}
          labels={{ of: '/' }}
        />
      )
      expect(screen.getByText('/ 10')).toBeInTheDocument()
    })

    it('should use custom contentProtected label', () => {
      render(
        <QuestionDisplay
          {...defaultProps}
          labels={{ contentProtected: '보호된 콘텐츠' }}
        />
      )
      expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument()
    })
  })

  describe('Data Attributes', () => {
    it('should have data-testid for question content', () => {
      render(<QuestionDisplay {...defaultProps} />)
      expect(screen.getByTestId('question')).toBeInTheDocument()
    })
  })
})
