/**
 * Tests for SubmitConfirmModal Component
 *
 * @see VIBE-0010
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { SubmitConfirmModal } from '@/features/exam-mode/components/take/SubmitConfirmModal'

describe('SubmitConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    answeredCount: 8,
    totalQuestions: 10,
    flaggedCount: 2,
    remainingTime: '5:00',
    isSubmitting: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText('Submit Exam?')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<SubmitConfirmModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Submit Exam?')).not.toBeInTheDocument()
    })
  })

  describe('Summary Statistics', () => {
    it('should display total questions label', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText('Total Questions:')).toBeInTheDocument()
    })

    it('should display answered label', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText('Answered:')).toBeInTheDocument()
    })

    it('should display unanswered label', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText('Unanswered:')).toBeInTheDocument()
    })

    it('should display flagged for review label', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText('Flagged for Review:')).toBeInTheDocument()
    })

    it('should display time remaining', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText('Time Remaining:')).toBeInTheDocument()
    })
  })

  describe('Warning Banner', () => {
    it('should show warning when there are unanswered questions', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText('Warning: Unanswered Questions')).toBeInTheDocument()
    })

    it('should not show warning when all questions are answered', () => {
      render(<SubmitConfirmModal {...defaultProps} answeredCount={10} />)
      expect(screen.queryByText('Warning: Unanswered Questions')).not.toBeInTheDocument()
    })

    it('should display warning text about incorrect marking', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText(/They will be marked as incorrect/)).toBeInTheDocument()
    })
  })

  describe('Button Actions', () => {
    it('should call onClose when Cancel is clicked', () => {
      const onClose = vi.fn()
      render(<SubmitConfirmModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('Cancel'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onConfirm when Submit is clicked', () => {
      const onConfirm = vi.fn()
      render(<SubmitConfirmModal {...defaultProps} onConfirm={onConfirm} answeredCount={10} />)

      fireEvent.click(screen.getByText('Submit'))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('should show unanswered count in submit button when questions unanswered', () => {
      render(<SubmitConfirmModal {...defaultProps} />)
      expect(screen.getByText('Submit with 2 Unanswered')).toBeInTheDocument()
    })
  })

  describe('Submitting State', () => {
    it('should show Submitting... when isSubmitting is true', () => {
      render(<SubmitConfirmModal {...defaultProps} isSubmitting={true} />)
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
    })

    it('should disable Cancel button when submitting', () => {
      render(<SubmitConfirmModal {...defaultProps} isSubmitting={true} />)
      expect(screen.getByText('Cancel')).toBeDisabled()
    })

    it('should disable Submit button when submitting', () => {
      render(<SubmitConfirmModal {...defaultProps} isSubmitting={true} />)
      expect(screen.getByText('Submitting...').closest('button')).toBeDisabled()
    })
  })

  describe('Custom Labels', () => {
    it('should use custom title label', () => {
      render(
        <SubmitConfirmModal
          {...defaultProps}
          labels={{ title: '시험을 제출하시겠습니까?' }}
        />
      )
      expect(screen.getByText('시험을 제출하시겠습니까?')).toBeInTheDocument()
    })

    it('should use custom cancel label', () => {
      render(
        <SubmitConfirmModal
          {...defaultProps}
          labels={{ cancel: '취소' }}
        />
      )
      expect(screen.getByText('취소')).toBeInTheDocument()
    })

    it('should use custom submit label when all answered', () => {
      render(
        <SubmitConfirmModal
          {...defaultProps}
          answeredCount={10}
          labels={{ submit: '제출' }}
        />
      )
      expect(screen.getByText('제출')).toBeInTheDocument()
    })

    it('should use custom submitWithUnanswered label', () => {
      render(
        <SubmitConfirmModal
          {...defaultProps}
          labels={{ submitWithUnanswered: '{count}개 미응답 상태로 제출' }}
        />
      )
      expect(screen.getByText('2개 미응답 상태로 제출')).toBeInTheDocument()
    })
  })
})
