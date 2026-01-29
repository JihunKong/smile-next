/**
 * Tests for AnswerChoice Component
 *
 * @see VIBE-0010
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { AnswerChoice } from '@/features/exam-mode/components/take/AnswerChoice'

describe('AnswerChoice', () => {
  const defaultProps = {
    choice: 'Paris',
    letter: 'B',
    isSelected: false,
    onSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Display', () => {
    it('should display the choice text', () => {
      render(<AnswerChoice {...defaultProps} />)
      expect(screen.getByText('Paris')).toBeInTheDocument()
    })

    it('should display the letter with period', () => {
      render(<AnswerChoice {...defaultProps} />)
      expect(screen.getByText('B.')).toBeInTheDocument()
    })

    it('should display different letters correctly', () => {
      render(<AnswerChoice {...defaultProps} letter="D" />)
      expect(screen.getByText('D.')).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should call onSelect when clicked', () => {
      const onSelect = vi.fn()
      render(<AnswerChoice {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByRole('button'))
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('should have blue border when selected', () => {
      render(<AnswerChoice {...defaultProps} isSelected={true} />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-blue-500')
    })

    it('should have gray border when not selected', () => {
      render(<AnswerChoice {...defaultProps} isSelected={false} />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-gray-200')
    })

    it('should have blue background when selected', () => {
      render(<AnswerChoice {...defaultProps} isSelected={true} />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-50')
    })
  })

  describe('Checkmark', () => {
    it('should show checkmark icon when selected', () => {
      const { container } = render(<AnswerChoice {...defaultProps} isSelected={true} />)
      const checkmark = container.querySelector('svg')
      expect(checkmark).toBeInTheDocument()
    })

    it('should not show checkmark when not selected', () => {
      const { container } = render(<AnswerChoice {...defaultProps} isSelected={false} />)
      const indicator = container.querySelector('.w-8.h-8.rounded-full')
      expect(indicator?.querySelector('svg')).toBeNull()
    })
  })

  describe('Accessibility', () => {
    it('should be a button element', () => {
      render(<AnswerChoice {...defaultProps} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should have full width for easy clicking', () => {
      render(<AnswerChoice {...defaultProps} />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('should have cursor pointer', () => {
      render(<AnswerChoice {...defaultProps} />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('cursor-pointer')
    })
  })

  describe('Long Choice Text', () => {
    it('should handle long choice text', () => {
      const longText =
        'This is a very long answer choice that should wrap properly and still be readable by the user taking the exam'
      render(<AnswerChoice {...defaultProps} choice={longText} />)
      expect(screen.getByText(longText)).toBeInTheDocument()
    })
  })

  describe('Special Characters', () => {
    it('should handle choice text with special characters', () => {
      render(<AnswerChoice {...defaultProps} choice="< > &" />)
      expect(screen.getByText('< > &')).toBeInTheDocument()
    })

    it('should handle choice text with numbers', () => {
      render(<AnswerChoice {...defaultProps} choice="42" />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })
})
