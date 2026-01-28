/**
 * Tests for DimensionScoreGrid Component
 */

import { render, screen } from '@testing-library/react'
import { DimensionScoreGrid } from '@/features/inquiry-mode/components/DimensionScoreGrid'
import type { DimensionScores } from '@/features/inquiry-mode/types'

describe('DimensionScoreGrid', () => {
  const scores: DimensionScores = {
    creativity: 8.0,
    clarity: 9.0,
    relevance: 7.5,
    innovation: 6.5,
    complexity: 8.5,
  }

  describe('Rendering', () => {
    it('should render all dimension labels', () => {
      render(<DimensionScoreGrid scores={scores} />)
      expect(screen.getByText('Creativity')).toBeInTheDocument()
      expect(screen.getByText('Clarity')).toBeInTheDocument()
      expect(screen.getByText('Relevance')).toBeInTheDocument()
      expect(screen.getByText('Innovation')).toBeInTheDocument()
    })

    it('should render score values', () => {
      render(<DimensionScoreGrid scores={scores} />)
      expect(screen.getByText('8.0')).toBeInTheDocument()
      expect(screen.getByText('9.0')).toBeInTheDocument()
      expect(screen.getByText('7.5')).toBeInTheDocument()
      expect(screen.getByText('6.5')).toBeInTheDocument()
    })

    it('should render emojis by default', () => {
      render(<DimensionScoreGrid scores={scores} />)
      expect(screen.getByText('💡')).toBeInTheDocument()
      expect(screen.getByText('📝')).toBeInTheDocument()
      expect(screen.getByText('🎯')).toBeInTheDocument()
      expect(screen.getByText('🚀')).toBeInTheDocument()
    })
  })

  describe('Hide Icons', () => {
    it('should not render emojis when showIcons is false', () => {
      render(<DimensionScoreGrid scores={scores} showIcons={false} />)
      expect(screen.queryByText('💡')).not.toBeInTheDocument()
    })
  })

  describe('Score Colors', () => {
    it('should show green for high scores', () => {
      render(<DimensionScoreGrid scores={scores} />)
      const clarityScore = screen.getByText('9.0')
      expect(clarityScore).toHaveClass('text-green-600')
    })

    it('should show yellow for medium scores', () => {
      render(<DimensionScoreGrid scores={scores} />)
      const relevanceScore = screen.getByText('7.5')
      expect(relevanceScore).toHaveClass('text-yellow-600')
    })

    it('should show yellow for scores at 6.5', () => {
      render(<DimensionScoreGrid scores={scores} />)
      const innovationScore = screen.getByText('6.5')
      expect(innovationScore).toHaveClass('text-yellow-600')
    })
  })

  describe('Columns', () => {
    it('should use 4 columns by default', () => {
      const { container } = render(<DimensionScoreGrid scores={scores} />)
      const grid = container.firstChild
      expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-4')
    })

    it('should use 2 columns when cols=2', () => {
      const { container } = render(<DimensionScoreGrid scores={scores} cols={2} />)
      const grid = container.firstChild
      expect(grid).toHaveClass('grid-cols-2')
    })
  })

  describe('Show Complexity', () => {
    it('should not show complexity by default', () => {
      render(<DimensionScoreGrid scores={scores} />)
      expect(screen.queryByText('Complexity')).not.toBeInTheDocument()
    })

    it('should show complexity when showComplexity is true', () => {
      render(<DimensionScoreGrid scores={scores} showComplexity />)
      expect(screen.getByText('Complexity')).toBeInTheDocument()
      expect(screen.getByText('8.5')).toBeInTheDocument()
    })
  })

  describe('Background Color', () => {
    it('should use background colors based on score', () => {
      const { container } = render(<DimensionScoreGrid scores={scores} />)
      const dimensionBoxes = container.querySelectorAll('.rounded-lg')
      const highScoreBox = Array.from(dimensionBoxes).find(
        el => el.textContent?.includes('9.0')
      )
      expect(highScoreBox).toHaveClass('bg-green-100')
    })
  })
})
