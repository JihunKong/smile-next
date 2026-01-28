/**
 * Tests for BloomsBadge Component
 */

import { render, screen } from '@testing-library/react'
import { BloomsBadge } from '@/features/inquiry-mode/components/BloomsBadge'
import type { BloomsLevel } from '@/features/inquiry-mode/types'

describe('BloomsBadge', () => {
  describe('Rendering', () => {
    it('should render the level label', () => {
      render(<BloomsBadge level="understand" />)
      expect(screen.getByText('Understand')).toBeInTheDocument()
    })

    it('should capitalize the level name', () => {
      render(<BloomsBadge level="analyze" />)
      expect(screen.getByText('Analyze')).toBeInTheDocument()
    })

    it('should render custom label when provided', () => {
      render(<BloomsBadge level="create" label="Creative Thinking" />)
      expect(screen.getByText('Creative Thinking')).toBeInTheDocument()
    })
  })

  describe('Colors', () => {
    it('should apply gray styling for "remember" level', () => {
      render(<BloomsBadge level="remember" />)
      const badge = screen.getByText('Remember')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
    })

    it('should apply blue styling for "understand" level', () => {
      render(<BloomsBadge level="understand" />)
      const badge = screen.getByText('Understand')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should apply green styling for "apply" level', () => {
      render(<BloomsBadge level="apply" />)
      const badge = screen.getByText('Apply')
      expect(badge).toHaveClass('bg-green-100', 'text-green-700')
    })

    it('should apply yellow styling for "analyze" level', () => {
      render(<BloomsBadge level="analyze" />)
      const badge = screen.getByText('Analyze')
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700')
    })

    it('should apply orange styling for "evaluate" level', () => {
      render(<BloomsBadge level="evaluate" />)
      const badge = screen.getByText('Evaluate')
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-700')
    })

    it('should apply purple styling for "create" level', () => {
      render(<BloomsBadge level="create" />)
      const badge = screen.getByText('Create')
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-700')
    })
  })

  describe('Sizes', () => {
    it('should render small size by default', () => {
      render(<BloomsBadge level="understand" />)
      const badge = screen.getByText('Understand')
      expect(badge).toHaveClass('px-2', 'py-1', 'text-xs')
    })

    it('should render small size when size="sm"', () => {
      render(<BloomsBadge level="understand" size="sm" />)
      const badge = screen.getByText('Understand')
      expect(badge).toHaveClass('px-2', 'py-1', 'text-xs')
    })

    it('should render medium size when size="md"', () => {
      render(<BloomsBadge level="understand" size="md" />)
      const badge = screen.getByText('Understand')
      expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('should render large size when size="lg"', () => {
      render(<BloomsBadge level="understand" size="lg" />)
      const badge = screen.getByText('Understand')
      expect(badge).toHaveClass('px-4', 'py-2', 'text-base')
    })
  })

  describe('Tooltip', () => {
    it('should have title attribute with description when showDescription is true', () => {
      render(<BloomsBadge level="analyze" showDescription />)
      const badge = screen.getByText('Analyze')
      expect(badge).toHaveAttribute('title')
      expect(badge.getAttribute('title')).toContain('Analyze')
    })

    it('should not have title attribute by default', () => {
      render(<BloomsBadge level="analyze" />)
      const badge = screen.getByText('Analyze')
      expect(badge).not.toHaveAttribute('title')
    })
  })

  describe('Case insensitivity', () => {
    it('should handle uppercase level input', () => {
      render(<BloomsBadge level={'CREATE' as BloomsLevel} />)
      expect(screen.getByText('Create')).toBeInTheDocument()
    })

    it('should handle mixed case level input', () => {
      render(<BloomsBadge level={'Analyze' as BloomsLevel} />)
      expect(screen.getByText('Analyze')).toBeInTheDocument()
    })
  })

  describe('Icon', () => {
    it('should show icon when showIcon is true', () => {
      render(<BloomsBadge level="create" showIcon />)
      const badge = screen.getByText('Create').parentElement
      expect(badge?.querySelector('svg')).toBeInTheDocument()
    })

    it('should not show icon by default', () => {
      render(<BloomsBadge level="create" />)
      const badge = screen.getByText('Create')
      expect(badge.querySelector('svg')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible as a status element', () => {
      render(<BloomsBadge level="understand" />)
      const badge = screen.getByText('Understand')
      expect(badge.tagName.toLowerCase()).toBe('span')
    })
  })
})
