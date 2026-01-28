/**
 * Tests for KeywordPool Component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { KeywordPool } from '@/features/inquiry-mode/components/KeywordPool'

describe('KeywordPool', () => {
  const mockKeywords = ['Photosynthesis', 'Chlorophyll', 'Sunlight']

  describe('Rendering', () => {
    it('should render pool title', () => {
      render(<KeywordPool keywords={mockKeywords} title="Concepts" variant="concept" />)
      expect(screen.getByText('Concepts')).toBeInTheDocument()
    })

    it('should render all keywords', () => {
      render(<KeywordPool keywords={mockKeywords} title="Concepts" variant="concept" />)
      expect(screen.getByText('Photosynthesis')).toBeInTheDocument()
      expect(screen.getByText('Chlorophyll')).toBeInTheDocument()
      expect(screen.getByText('Sunlight')).toBeInTheDocument()
    })

    it('should not render when keywords array is empty', () => {
      const { container } = render(<KeywordPool keywords={[]} title="Concepts" variant="concept" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Variants', () => {
    it('should apply concept variant background', () => {
      render(<KeywordPool keywords={mockKeywords} title="Concepts" variant="concept" />)
      const pool = screen.getByText('Concepts').closest('div')
      expect(pool).toHaveClass('from-yellow-50', 'to-yellow-100')
    })

    it('should apply action variant background', () => {
      render(<KeywordPool keywords={mockKeywords} title="Actions" variant="action" />)
      const pool = screen.getByText('Actions').closest('div')
      expect(pool).toHaveClass('from-orange-50', 'to-orange-100')
    })
  })

  describe('Click Handler', () => {
    it('should call onKeywordClick when a keyword is clicked', () => {
      const handleClick = vi.fn()
      render(
        <KeywordPool
          keywords={mockKeywords}
          title="Concepts"
          variant="concept"
          onKeywordClick={handleClick}
        />
      )
      fireEvent.click(screen.getByText('Photosynthesis'))
      expect(handleClick).toHaveBeenCalledWith('Photosynthesis')
    })

    it('should render keywords as buttons when onKeywordClick is provided', () => {
      render(
        <KeywordPool
          keywords={mockKeywords}
          title="Concepts"
          variant="concept"
          onKeywordClick={() => {}}
        />
      )
      expect(screen.getAllByRole('button')).toHaveLength(3)
    })
  })

  describe('Dot Indicator', () => {
    it('should show colored dot indicator for concept variant', () => {
      render(<KeywordPool keywords={mockKeywords} title="Concepts" variant="concept" />)
      const header = screen.getByText('Concepts').closest('h4')
      const dot = header?.querySelector('.rounded-full')
      expect(dot).toHaveClass('bg-yellow-500')
    })

    it('should show colored dot indicator for action variant', () => {
      render(<KeywordPool keywords={mockKeywords} title="Actions" variant="action" />)
      const header = screen.getByText('Actions').closest('h4')
      const dot = header?.querySelector('.rounded-full')
      expect(dot).toHaveClass('bg-orange-500')
    })
  })
})
