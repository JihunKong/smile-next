/**
 * Tests for QualityScoreDisplay Component
 */

import { render, screen } from '@testing-library/react'
import { QualityScoreDisplay } from '@/features/inquiry-mode/components/QualityScoreDisplay'

describe('QualityScoreDisplay', () => {
  describe('Score Display', () => {
    it('should display the score value', () => {
      render(<QualityScoreDisplay score={8.5} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
    })

    it('should display score with single decimal', () => {
      render(<QualityScoreDisplay score={7} />)
      expect(screen.getByText('7.0')).toBeInTheDocument()
    })

    it('should display max score', () => {
      render(<QualityScoreDisplay score={8} maxScore={10} />)
      expect(screen.getByText('/ 10')).toBeInTheDocument()
    })

    it('should use default maxScore of 10', () => {
      render(<QualityScoreDisplay score={8} />)
      expect(screen.getByText('/ 10')).toBeInTheDocument()
    })
  })

  describe('Color Coding', () => {
    it('should display green for scores >= 8', () => {
      render(<QualityScoreDisplay score={8} />)
      const scoreElement = screen.getByText('8.0')
      expect(scoreElement).toHaveClass('text-green-600')
    })

    it('should display yellow for scores >= 6 and < 8', () => {
      render(<QualityScoreDisplay score={7} />)
      const scoreElement = screen.getByText('7.0')
      expect(scoreElement).toHaveClass('text-yellow-600')
    })

    it('should display red for scores < 6', () => {
      render(<QualityScoreDisplay score={5} />)
      const scoreElement = screen.getByText('5.0')
      expect(scoreElement).toHaveClass('text-red-600')
    })
  })

  describe('Quality Label', () => {
    it('should show "Excellent" label for scores >= 8', () => {
      render(<QualityScoreDisplay score={8.5} showLabel />)
      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })

    it('should show "Good" label for scores >= 6 and < 8', () => {
      render(<QualityScoreDisplay score={6.5} showLabel />)
      expect(screen.getByText('Good')).toBeInTheDocument()
    })

    it('should show "Needs Improvement" label for scores < 6', () => {
      render(<QualityScoreDisplay score={4} showLabel />)
      expect(screen.getByText('Needs Improvement')).toBeInTheDocument()
    })

    it('should not show label by default', () => {
      render(<QualityScoreDisplay score={8} />)
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('should render small size by default', () => {
      render(<QualityScoreDisplay score={8} />)
      const scoreElement = screen.getByText('8.0')
      expect(scoreElement).toHaveClass('text-lg')
    })

    it('should render medium size', () => {
      render(<QualityScoreDisplay score={8} size="md" />)
      const scoreElement = screen.getByText('8.0')
      expect(scoreElement).toHaveClass('text-2xl')
    })

    it('should render large size', () => {
      render(<QualityScoreDisplay score={8} size="lg" />)
      const scoreElement = screen.getByText('8.0')
      expect(scoreElement).toHaveClass('text-4xl')
    })
  })

  describe('Null Score', () => {
    it('should display dash for null score', () => {
      render(<QualityScoreDisplay score={null} />)
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('should display gray color for null score', () => {
      render(<QualityScoreDisplay score={null} />)
      const scoreElement = screen.getByText('-')
      expect(scoreElement).toHaveClass('text-gray-500')
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<QualityScoreDisplay score={null} loading />)
      expect(screen.getByTestId('score-loading')).toBeInTheDocument()
    })

    it('should not show score when loading', () => {
      render(<QualityScoreDisplay score={8} loading />)
      expect(screen.queryByText('8.0')).not.toBeInTheDocument()
    })
  })

  describe('Percentage Mode', () => {
    it('should display percentage when showPercentage is true', () => {
      render(<QualityScoreDisplay score={8} showPercentage />)
      expect(screen.getByText('80%')).toBeInTheDocument()
    })

    it('should calculate percentage based on maxScore', () => {
      render(<QualityScoreDisplay score={6} maxScore={10} showPercentage />)
      expect(screen.getByText('60%')).toBeInTheDocument()
    })
  })
})
