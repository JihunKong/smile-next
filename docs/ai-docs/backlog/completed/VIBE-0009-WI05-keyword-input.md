---
id: VIBE-0009-WI05
title: Extract KeywordInput Component (TDD)
status: backlog
priority: high
category: refactoring
component: ui
created: 2026-01-24
updated: 2026-01-24
effort: m
assignee: ai-agent
parent: VIBE-0009
---

# Extract KeywordInput Component (TDD)

## Summary

Create the main keyword input component that allows students to enter keywords for inquiry questions. This component uses `KeywordBadge` for displaying entered keywords and includes the keyword pool hints feature.

## Current Behavior

The keyword input UI is embedded within `inquiry-take-client.tsx` (lines 313-373), mixing:
- Keyword pool display (concept and action keywords)
- Click-to-add functionality from pools
- Manual input field (not currently present - uses pool clicks only)
- Entered keywords display

## Expected Behavior

A dedicated `KeywordInput` component that:
- Displays keyword input field with add button
- Shows entered keywords using KeywordBadge
- Displays keyword pool hints that can be clicked to add
- Enforces max keyword limit
- Provides clear visual feedback for remaining slots

## Acceptance Criteria

- [ ] **Tests written FIRST** following TDD
- [ ] All tests pass (minimum 8 test cases)
- [ ] Component is under 100 lines
- [ ] Uses KeywordBadge for displaying keywords
- [ ] Component exported from `components/index.ts`

## Technical Approach

### TDD Step 1: Write Tests First

Create `src/features/inquiry-mode/components/__tests__/KeywordInput.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KeywordInput } from '../KeywordInput'

describe('KeywordInput', () => {
  const defaultProps = {
    keywords: [],
    onAdd: jest.fn(),
    onRemove: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders keyword pool hints when provided', () => {
      render(
        <KeywordInput
          {...defaultProps}
          keywordPool1={['개념1', '개념2']}
          keywordPool2={['행동1', '행동2']}
        />
      )
      expect(screen.getByText('개념1')).toBeInTheDocument()
      expect(screen.getByText('행동1')).toBeInTheDocument()
    })

    it('renders concept keywords section with correct label', () => {
      render(
        <KeywordInput
          {...defaultProps}
          keywordPool1={['concept']}
          keywordPool2={[]}
        />
      )
      expect(screen.getByText(/개념 키워드/)).toBeInTheDocument()
    })

    it('renders action keywords section with correct label', () => {
      render(
        <KeywordInput
          {...defaultProps}
          keywordPool1={[]}
          keywordPool2={['action']}
        />
      )
      expect(screen.getByText(/행동 키워드/)).toBeInTheDocument()
    })

    it('renders existing keywords as badges', () => {
      render(<KeywordInput {...defaultProps} keywords={['keyword1', 'keyword2']} />)
      expect(screen.getByText('keyword1')).toBeInTheDocument()
      expect(screen.getByText('keyword2')).toBeInTheDocument()
    })

    it('shows keyword count when keywords exist', () => {
      render(<KeywordInput {...defaultProps} keywords={['a', 'b', 'c']} maxKeywords={10} />)
      expect(screen.getByText('3/10')).toBeInTheDocument()
    })
  })

  describe('adding keywords via pool click', () => {
    it('calls onAdd when pool keyword is clicked', async () => {
      const mockOnAdd = jest.fn()
      render(
        <KeywordInput
          {...defaultProps}
          onAdd={mockOnAdd}
          keywordPool1={['clickable']}
        />
      )
      
      await userEvent.click(screen.getByText('clickable'))
      expect(mockOnAdd).toHaveBeenCalledWith('clickable')
    })

    it('disables pool keywords when max reached', () => {
      render(
        <KeywordInput
          {...defaultProps}
          keywords={['a', 'b']}
          maxKeywords={2}
          keywordPool1={['shouldBeDisabled']}
        />
      )
      
      const poolButton = screen.getByRole('button', { name: 'shouldBeDisabled' })
      expect(poolButton).toBeDisabled()
    })
  })

  describe('removing keywords', () => {
    it('calls onRemove with correct index when badge is removed', async () => {
      const mockOnRemove = jest.fn()
      render(
        <KeywordInput
          {...defaultProps}
          keywords={['a', 'b', 'c']}
          onRemove={mockOnRemove}
        />
      )
      
      // Find all remove buttons and click the second one (index 1)
      const removeButtons = screen.getAllByRole('button', { name: /제거/ })
      await userEvent.click(removeButtons[1])
      
      expect(mockOnRemove).toHaveBeenCalledWith(1)
    })
  })

  describe('max keywords limit', () => {
    it('shows remaining count', () => {
      render(<KeywordInput {...defaultProps} keywords={['a']} maxKeywords={5} />)
      expect(screen.getByText(/4개 남음/)).toBeInTheDocument()
    })

    it('shows complete message when max reached', () => {
      render(<KeywordInput {...defaultProps} keywords={['a', 'b']} maxKeywords={2} />)
      expect(screen.getByText(/모두 선택됨/)).toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('disables all interactions when disabled', () => {
      render(
        <KeywordInput
          {...defaultProps}
          keywords={['existing']}
          keywordPool1={['pool']}
          disabled
        />
      )
      
      // Pool buttons should be disabled
      expect(screen.getByRole('button', { name: 'pool' })).toBeDisabled()
      
      // Remove buttons should be disabled
      expect(screen.getByRole('button', { name: /제거/ })).toBeDisabled()
    })
  })

  describe('visual sections', () => {
    it('does not render pool section when no pools provided', () => {
      render(<KeywordInput {...defaultProps} />)
      expect(screen.queryByText(/키워드/)).not.toBeInTheDocument()
    })

    it('renders tip text when pools exist', () => {
      render(
        <KeywordInput
          {...defaultProps}
          keywordPool1={['hint']}
        />
      )
      expect(screen.getByText(/키워드를 클릭하면/)).toBeInTheDocument()
    })
  })
})
```

### TDD Step 2: Run Tests (Should Fail)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/KeywordInput.test.tsx
```

### TDD Step 3: Implement Component

Create `src/features/inquiry-mode/components/KeywordInput.tsx`:

```typescript
import { KeywordBadge } from './KeywordBadge'

interface KeywordInputProps {
  keywords: string[]
  onAdd: (keyword: string) => void
  onRemove: (index: number) => void
  keywordPool1?: string[]
  keywordPool2?: string[]
  maxKeywords?: number
  disabled?: boolean
}

export function KeywordInput({
  keywords,
  onAdd,
  onRemove,
  keywordPool1 = [],
  keywordPool2 = [],
  maxKeywords = 10,
  disabled = false,
}: KeywordInputProps) {
  const canAddMore = keywords.length < maxKeywords
  const remaining = maxKeywords - keywords.length
  const hasPool = keywordPool1.length > 0 || keywordPool2.length > 0

  return (
    <div className="space-y-4">
      {/* Keyword Pools */}
      {hasPool && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="font-medium text-gray-800">질문 힌트: 아래 키워드를 활용해보세요</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keywordPool1.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  개념 키워드
                </h4>
                <div className="flex flex-wrap gap-2">
                  {keywordPool1.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => onAdd(kw)}
                      disabled={disabled || !canAddMore}
                      className="px-3 py-1 bg-white text-yellow-800 rounded-full text-sm font-medium border border-yellow-300 hover:bg-yellow-200 hover:border-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {keywordPool2.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2 text-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  행동 키워드
                </h4>
                <div className="flex flex-wrap gap-2">
                  {keywordPool2.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => onAdd(kw)}
                      disabled={disabled || !canAddMore}
                      className="px-3 py-1 bg-white text-orange-800 rounded-full text-sm font-medium border border-orange-300 hover:bg-orange-200 hover:border-orange-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            팁: 키워드를 클릭하면 질문에 자동으로 추가됩니다
          </p>
        </div>
      )}

      {/* Selected Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <KeywordBadge
              key={`${keyword}-${index}`}
              keyword={keyword}
              onRemove={() => onRemove(index)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* Count Display */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{keywords.length}/{maxKeywords}</span>
        <span>
          {canAddMore ? `${remaining}개 남음` : '모두 선택됨'}
        </span>
      </div>
    </div>
  )
}
```

### TDD Step 4: Run Tests (Should Pass)

```bash
npm test -- src/features/inquiry-mode/components/__tests__/KeywordInput.test.tsx
```

## Related Files

- `src/app/(dashboard)/activities/[id]/inquiry/take/inquiry-take-client.tsx` (lines 313-373)
- `src/features/inquiry-mode/components/KeywordBadge.tsx`

## Dependencies

**Blocked By:**
- VIBE-0009-WI04 (KeywordBadge)

**Blocks:**
- VIBE-0009-WI06 (QuestionSubmissionCard)
- VIBE-0009-WI11 (Take Page Refactor)

## Test Commands

```bash
# Run this specific test
npm test -- src/features/inquiry-mode/components/__tests__/KeywordInput.test.tsx

# Run with coverage
npm test -- --coverage src/features/inquiry-mode/components/__tests__/KeywordInput.test.tsx
```

## Notes

- This is the main user interaction point for keyword selection
- Preserves the existing click-to-add UX from keyword pools
- May need future enhancement for manual text input

## Conversation History

| Date | Note |
|------|------|
| 2026-01-24 | Created from VIBE-0009 implementation plan breakdown |
