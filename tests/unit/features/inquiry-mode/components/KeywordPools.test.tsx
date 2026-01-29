/**
 * Tests for KeywordPools Component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { KeywordPools } from '@/features/inquiry-mode/components/KeywordPools'

const defaultLabels = {
  hint: 'Keyword Hints',
  concepts: 'Concepts',
  actions: 'Actions',
  tip: 'Click keywords to add them',
}

describe('KeywordPools', () => {
  describe('Rendering', () => {
    it('should render both keyword pools', () => {
      render(
        <KeywordPools
          keywordPool1={['concept1', 'concept2']}
          keywordPool2={['action1', 'action2']}
          onKeywordClick={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Concepts')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should render hint title', () => {
      render(
        <KeywordPools
          keywordPool1={['concept1']}
          keywordPool2={['action1']}
          onKeywordClick={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Keyword Hints')).toBeInTheDocument()
    })

    it('should render tip text', () => {
      render(
        <KeywordPools
          keywordPool1={['concept1']}
          keywordPool2={['action1']}
          onKeywordClick={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Click keywords to add them')).toBeInTheDocument()
    })

    it('should return null when both pools are empty', () => {
      const { container } = render(
        <KeywordPools
          keywordPool1={[]}
          keywordPool2={[]}
          onKeywordClick={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Keyword Display', () => {
    it('should display all concept keywords', () => {
      render(
        <KeywordPools
          keywordPool1={['Photosynthesis', 'Cellular', 'Energy']}
          keywordPool2={[]}
          onKeywordClick={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Photosynthesis')).toBeInTheDocument()
      expect(screen.getByText('Cellular')).toBeInTheDocument()
      expect(screen.getByText('Energy')).toBeInTheDocument()
    })

    it('should display all action keywords', () => {
      render(
        <KeywordPools
          keywordPool1={[]}
          keywordPool2={['Compare', 'Analyze', 'Evaluate']}
          onKeywordClick={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Compare')).toBeInTheDocument()
      expect(screen.getByText('Analyze')).toBeInTheDocument()
      expect(screen.getByText('Evaluate')).toBeInTheDocument()
    })
  })

  describe('Click Interaction', () => {
    it('should call onKeywordClick when concept keyword is clicked', () => {
      const handleClick = vi.fn()
      render(
        <KeywordPools
          keywordPool1={['concept1']}
          keywordPool2={[]}
          onKeywordClick={handleClick}
          labels={defaultLabels}
        />
      )
      fireEvent.click(screen.getByText('concept1'))
      expect(handleClick).toHaveBeenCalledWith('concept1')
    })

    it('should call onKeywordClick when action keyword is clicked', () => {
      const handleClick = vi.fn()
      render(
        <KeywordPools
          keywordPool1={[]}
          keywordPool2={['action1']}
          onKeywordClick={handleClick}
          labels={defaultLabels}
        />
      )
      fireEvent.click(screen.getByText('action1'))
      expect(handleClick).toHaveBeenCalledWith('action1')
    })

    it('should call onKeywordClick with correct keyword for each click', () => {
      const handleClick = vi.fn()
      render(
        <KeywordPools
          keywordPool1={['first', 'second']}
          keywordPool2={['third']}
          onKeywordClick={handleClick}
          labels={defaultLabels}
        />
      )
      fireEvent.click(screen.getByText('first'))
      expect(handleClick).toHaveBeenLastCalledWith('first')

      fireEvent.click(screen.getByText('third'))
      expect(handleClick).toHaveBeenLastCalledWith('third')
    })
  })

  describe('Partial Pools', () => {
    it('should render only concepts pool when actions is empty', () => {
      render(
        <KeywordPools
          keywordPool1={['concept1']}
          keywordPool2={[]}
          onKeywordClick={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Concepts')).toBeInTheDocument()
      expect(screen.queryByText('Actions')).not.toBeInTheDocument()
    })

    it('should render only actions pool when concepts is empty', () => {
      render(
        <KeywordPools
          keywordPool1={[]}
          keywordPool2={['action1']}
          onKeywordClick={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.queryByText('Concepts')).not.toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })
})
