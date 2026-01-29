/**
 * Tests for ExamTimer Component
 *
 * @see VIBE-0010
 */

import { render, screen } from '@testing-library/react'
import { ExamTimer } from '@/features/exam-mode/components/take/ExamTimer'

describe('ExamTimer', () => {
  const defaultProps = {
    formattedTime: '5:00',
    remainingSeconds: 300,
    timerPercentage: 100,
    questionNumber: 1,
    totalQuestions: 10,
  }

  describe('Time Display', () => {
    it('should display formatted time', () => {
      render(<ExamTimer {...defaultProps} />)
      expect(screen.getByText('5:00')).toBeInTheDocument()
    })

    it('should display time remaining label', () => {
      render(<ExamTimer {...defaultProps} />)
      expect(screen.getByText('Time Remaining')).toBeInTheDocument()
    })
  })

  describe('Question Counter', () => {
    it('should display current question number', () => {
      render(<ExamTimer {...defaultProps} questionNumber={5} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should display total questions', () => {
      render(<ExamTimer {...defaultProps} />)
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('should display Question label and of', () => {
      render(<ExamTimer {...defaultProps} />)
      expect(screen.getByText(/Question/)).toBeInTheDocument()
      expect(screen.getByText(/of/)).toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('should render progress bar', () => {
      const { container } = render(<ExamTimer {...defaultProps} />)
      const progressBar = container.querySelector('.bg-gray-200.rounded-full.h-2')
      expect(progressBar).toBeInTheDocument()
    })

    it('should show correct width based on percentage', () => {
      const { container } = render(<ExamTimer {...defaultProps} timerPercentage={50} />)
      const progressFill = container.querySelector('[style*="width: 50%"]')
      expect(progressFill).toBeInTheDocument()
    })
  })

  describe('Warning States', () => {
    it('should use red color by default', () => {
      const { container } = render(<ExamTimer {...defaultProps} />)
      const timerText = container.querySelector('.text-red-600')
      expect(timerText).toBeInTheDocument()
    })

    it('should use yellow color in warning state', () => {
      const { container } = render(<ExamTimer {...defaultProps} isWarning={true} />)
      const timerText = container.querySelector('.text-yellow-600')
      expect(timerText).toBeInTheDocument()
    })

    it('should use red color in critical state', () => {
      const { container } = render(<ExamTimer {...defaultProps} isCritical={true} />)
      const timerText = container.querySelector('.text-red-600')
      expect(timerText).toBeInTheDocument()
    })

    it('should use critical color over warning when both true', () => {
      const { container } = render(
        <ExamTimer {...defaultProps} isWarning={true} isCritical={true} />
      )
      // Critical takes precedence
      const yellowText = container.querySelector('.text-yellow-600')
      expect(yellowText).not.toBeInTheDocument()
    })
  })

  describe('Custom Labels', () => {
    it('should use custom timeRemaining label', () => {
      render(
        <ExamTimer
          {...defaultProps}
          labels={{ timeRemaining: '남은 시간' }}
        />
      )
      expect(screen.getByText('남은 시간')).toBeInTheDocument()
    })

    it('should use custom question label', () => {
      render(
        <ExamTimer
          {...defaultProps}
          labels={{ question: '문제' }}
        />
      )
      expect(screen.getByText(/문제/)).toBeInTheDocument()
    })

    it('should use custom of label', () => {
      const { container } = render(
        <ExamTimer
          {...defaultProps}
          labels={{ of: '/' }}
        />
      )
      // The custom "of" label should be in the text-sm text-gray-600 div
      const questionInfo = container.querySelector('.text-sm.text-gray-600')
      expect(questionInfo?.textContent).toContain('/')
    })
  })

  describe('Fixed Position', () => {
    it('should have fixed positioning', () => {
      const { container } = render(<ExamTimer {...defaultProps} />)
      const fixedElement = container.querySelector('.fixed')
      expect(fixedElement).toBeInTheDocument()
    })

    it('should have high z-index', () => {
      const { container } = render(<ExamTimer {...defaultProps} />)
      const zIndexElement = container.querySelector('.z-50')
      expect(zIndexElement).toBeInTheDocument()
    })
  })
})
