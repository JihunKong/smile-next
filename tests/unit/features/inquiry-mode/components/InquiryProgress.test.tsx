/**
 * Tests for InquiryProgress Component
 */

import { render, screen } from '@testing-library/react'
import { InquiryProgress } from '@/features/inquiry-mode/components/InquiryProgress'

describe('InquiryProgress', () => {
  describe('Rendering', () => {
    it('should render progress bar', () => {
      render(<InquiryProgress current={2} total={5} />)
      const progressBar = document.querySelector('.bg-gradient-to-r')
      expect(progressBar).toBeInTheDocument()
    })

    it('should display completed count', () => {
      render(<InquiryProgress current={3} total={5} />)
      expect(screen.getByText(/3/)).toBeInTheDocument()
      expect(screen.getByText(/completed/i)).toBeInTheDocument()
    })

    it('should display remaining count', () => {
      render(<InquiryProgress current={3} total={5} />)
      expect(screen.getByText(/2/)).toBeInTheDocument()
      expect(screen.getByText(/remaining/i)).toBeInTheDocument()
    })
  })

  describe('Progress Calculation', () => {
    it('should show 0% progress for 0 completed', () => {
      render(<InquiryProgress current={0} total={5} />)
      const progressBar = document.querySelector('.bg-gradient-to-r') as HTMLElement
      expect(progressBar?.style.width).toBe('0%')
    })

    it('should show 50% progress for half completed', () => {
      render(<InquiryProgress current={2} total={4} />)
      const progressBar = document.querySelector('.bg-gradient-to-r') as HTMLElement
      expect(progressBar?.style.width).toBe('50%')
    })

    it('should show 100% progress when all completed', () => {
      render(<InquiryProgress current={5} total={5} />)
      const progressBar = document.querySelector('.bg-gradient-to-r') as HTMLElement
      expect(progressBar?.style.width).toBe('100%')
    })
  })

  describe('Progress Display Format', () => {
    it('should show current question number when showCurrentQuestion is true', () => {
      render(<InquiryProgress current={2} total={5} showCurrentQuestion />)
      expect(screen.getByText(/3 of 5/)).toBeInTheDocument()
    })

    it('should not show current question number by default', () => {
      render(<InquiryProgress current={2} total={5} />)
      expect(screen.queryByText(/of 5/)).not.toBeInTheDocument()
    })
  })

  describe('Average Score', () => {
    it('should display average score when provided', () => {
      render(<InquiryProgress current={3} total={5} averageScore={7.5} />)
      expect(screen.getByText('7.5')).toBeInTheDocument()
    })

    it('should not display average score when not provided', () => {
      render(<InquiryProgress current={3} total={5} />)
      expect(screen.queryByText(/average/i)).not.toBeInTheDocument()
    })

    it('should format average score to one decimal', () => {
      render(<InquiryProgress current={3} total={5} averageScore={7.333} />)
      expect(screen.getByText('7.3')).toBeInTheDocument()
    })
  })

  describe('Completion State', () => {
    it('should indicate completion when all questions are done', () => {
      render(<InquiryProgress current={5} total={5} />)
      expect(screen.getByText(/0/)).toBeInTheDocument()
    })
  })

  describe('Compact Mode', () => {
    it('should render compact version when compact is true', () => {
      render(<InquiryProgress current={3} total={5} compact />)
      expect(screen.queryByText(/completed/i)).not.toBeInTheDocument()
    })

    it('should show simple progress in compact mode', () => {
      render(<InquiryProgress current={3} total={5} compact />)
      expect(screen.getByText('3/5')).toBeInTheDocument()
    })
  })
})
