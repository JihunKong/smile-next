/**
 * Tests for ExamNavButtons Component
 *
 * @see VIBE-0010
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { ExamNavButtons } from '@/features/exam-mode/components/take/ExamNavButtons'

describe('ExamNavButtons', () => {
  const defaultProps = {
    isFirstQuestion: false,
    isLastQuestion: false,
    answeredCount: 5,
    totalQuestions: 10,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onSubmit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Navigation Buttons', () => {
    it('should display Previous button', () => {
      render(<ExamNavButtons {...defaultProps} />)
      expect(screen.getByText('Previous')).toBeInTheDocument()
    })

    it('should display Next button', () => {
      render(<ExamNavButtons {...defaultProps} />)
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should call onPrevious when Previous is clicked', () => {
      const onPrevious = vi.fn()
      render(<ExamNavButtons {...defaultProps} onPrevious={onPrevious} />)

      fireEvent.click(screen.getByText('Previous'))
      expect(onPrevious).toHaveBeenCalledTimes(1)
    })

    it('should call onNext when Next is clicked', () => {
      const onNext = vi.fn()
      render(<ExamNavButtons {...defaultProps} onNext={onNext} />)

      fireEvent.click(screen.getByText('Next'))
      expect(onNext).toHaveBeenCalledTimes(1)
    })
  })

  describe('First Question State', () => {
    it('should disable Previous button on first question', () => {
      render(<ExamNavButtons {...defaultProps} isFirstQuestion={true} />)
      expect(screen.getByText('Previous')).toBeDisabled()
    })

    it('should not disable Next button on first question', () => {
      render(<ExamNavButtons {...defaultProps} isFirstQuestion={true} />)
      expect(screen.getByText('Next')).not.toBeDisabled()
    })
  })

  describe('Last Question State', () => {
    it('should disable Next button on last question', () => {
      render(<ExamNavButtons {...defaultProps} isLastQuestion={true} />)
      expect(screen.getByText('Next')).toBeDisabled()
    })

    it('should not disable Previous button on last question', () => {
      render(<ExamNavButtons {...defaultProps} isLastQuestion={true} />)
      expect(screen.getByText('Previous')).not.toBeDisabled()
    })
  })

  describe('Progress Display', () => {
    it('should display progress label', () => {
      render(<ExamNavButtons {...defaultProps} />)
      expect(screen.getByText('Progress')).toBeInTheDocument()
    })

    it('should display answered count', () => {
      render(<ExamNavButtons {...defaultProps} answeredCount={7} />)
      expect(screen.getByText(/7 of 10 answered/)).toBeInTheDocument()
    })

    it('should render progress bar', () => {
      const { container } = render(<ExamNavButtons {...defaultProps} />)
      const progressBar = container.querySelector('.bg-gray-200.rounded-full.h-3')
      expect(progressBar).toBeInTheDocument()
    })

    it('should show correct progress width', () => {
      const { container } = render(
        <ExamNavButtons {...defaultProps} answeredCount={5} totalQuestions={10} />
      )
      const progressFill = container.querySelector('[style*="width: 50%"]')
      expect(progressFill).toBeInTheDocument()
    })
  })

  describe('Button Styling', () => {
    it('should apply gray styling to Previous button', () => {
      const { container } = render(<ExamNavButtons {...defaultProps} />)
      const prevButton = screen.getByText('Previous').closest('button')
      expect(prevButton).toHaveClass('bg-gray-100')
    })

    it('should apply blue styling to Next button when not last', () => {
      render(<ExamNavButtons {...defaultProps} />)
      const nextButton = screen.getByText('Next').closest('button')
      expect(nextButton).toHaveClass('bg-blue-600')
    })

    it('should apply gray styling to Next button when last', () => {
      render(<ExamNavButtons {...defaultProps} isLastQuestion={true} />)
      const nextButton = screen.getByText('Next').closest('button')
      expect(nextButton).toHaveClass('bg-gray-100')
    })
  })

  describe('Custom Labels', () => {
    it('should use custom previous label', () => {
      render(
        <ExamNavButtons
          {...defaultProps}
          labels={{ previous: '이전' }}
        />
      )
      expect(screen.getByText('이전')).toBeInTheDocument()
    })

    it('should use custom next label', () => {
      render(
        <ExamNavButtons
          {...defaultProps}
          labels={{ next: '다음' }}
        />
      )
      expect(screen.getByText('다음')).toBeInTheDocument()
    })

    it('should use custom progress label', () => {
      render(
        <ExamNavButtons
          {...defaultProps}
          labels={{ progress: '진행률' }}
        />
      )
      expect(screen.getByText('진행률')).toBeInTheDocument()
    })

    it('should use custom answered label', () => {
      render(
        <ExamNavButtons
          {...defaultProps}
          labels={{ answered: '완료' }}
        />
      )
      expect(screen.getByText(/완료/)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single question exam', () => {
      render(
        <ExamNavButtons
          {...defaultProps}
          isFirstQuestion={true}
          isLastQuestion={true}
          answeredCount={0}
          totalQuestions={1}
        />
      )
      expect(screen.getByText('Previous')).toBeDisabled()
      expect(screen.getByText('Next')).toBeDisabled()
    })

    it('should show 100% progress when all answered', () => {
      const { container } = render(
        <ExamNavButtons
          {...defaultProps}
          answeredCount={10}
          totalQuestions={10}
        />
      )
      const progressFill = container.querySelector('[style*="width: 100%"]')
      expect(progressFill).toBeInTheDocument()
    })
  })
})
