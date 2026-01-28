/**
 * Tests for KeywordBadge Component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { KeywordBadge } from '@/features/inquiry-mode/components/KeywordBadge'

describe('KeywordBadge', () => {
  describe('Rendering', () => {
    it('should display the keyword text', () => {
      render(<KeywordBadge keyword="Photosynthesis" />)
      expect(screen.getByText('Photosynthesis')).toBeInTheDocument()
    })

    it('should render as a button when clickable', () => {
      render(<KeywordBadge keyword="Test" onClick={() => {}} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should render as a span when not clickable', () => {
      render(<KeywordBadge keyword="Test" />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('should apply concept variant styling by default', () => {
      render(<KeywordBadge keyword="Test" />)
      const badge = screen.getByText('Test')
      expect(badge).toHaveClass('bg-white', 'text-yellow-800', 'border-yellow-300')
    })

    it('should apply concept variant styling', () => {
      render(<KeywordBadge keyword="Test" variant="concept" />)
      const badge = screen.getByText('Test')
      expect(badge).toHaveClass('text-yellow-800')
    })

    it('should apply action variant styling', () => {
      render(<KeywordBadge keyword="Test" variant="action" />)
      const badge = screen.getByText('Test')
      expect(badge).toHaveClass('text-orange-800', 'border-orange-300')
    })
  })

  describe('Click Handler', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      render(<KeywordBadge keyword="Test" onClick={handleClick} />)
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalledWith('Test')
    })

    it('should have hover styles when clickable', () => {
      render(<KeywordBadge keyword="Test" onClick={() => {}} variant="concept" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-yellow-200')
    })
  })

  describe('Tooltip', () => {
    it('should show tooltip on hover when provided', () => {
      render(<KeywordBadge keyword="Test" tooltip="Click to add" onClick={() => {}} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('title', 'Click to add')
    })
  })

  describe('Selected State', () => {
    it('should show selected styling when selected', () => {
      render(<KeywordBadge keyword="Test" selected />)
      const badge = screen.getByText('Test')
      expect(badge).toHaveClass('ring-2')
    })
  })
})
