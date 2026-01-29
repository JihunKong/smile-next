/**
 * Tests for QuestionInput Component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionInput } from '@/features/inquiry-mode/components/QuestionInput'

const defaultLabels = {
  title: 'Create Your Question',
  description: 'Write a thoughtful question',
  placeholder: 'Enter your question here...',
  charCount: '{count} characters',
  canSubmit: 'Ready to submit',
  submitting: 'Submitting...',
  submit: 'Submit Question',
}

describe('QuestionInput', () => {
  describe('Rendering', () => {
    it('should render title and description', () => {
      render(
        <QuestionInput
          value=""
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Create Your Question')).toBeInTheDocument()
      expect(screen.getByText('Write a thoughtful question')).toBeInTheDocument()
    })

    it('should render textarea with placeholder', () => {
      render(
        <QuestionInput
          value=""
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByPlaceholderText('Enter your question here...')).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(
        <QuestionInput
          value=""
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })
  })

  describe('Character Count', () => {
    it('should display character count for empty input', () => {
      render(
        <QuestionInput
          value=""
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('0 characters')).toBeInTheDocument()
    })

    it('should update character count as value changes', () => {
      render(
        <QuestionInput
          value="Hello World"
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('11 characters')).toBeInTheDocument()
    })
  })

  describe('Ready to Submit Indicator', () => {
    it('should not show ready indicator for short input', () => {
      render(
        <QuestionInput
          value="Short"
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.queryByText('Ready to submit')).not.toBeInTheDocument()
    })

    it('should show ready indicator when input exceeds 20 characters', () => {
      render(
        <QuestionInput
          value="This is a question with more than twenty characters"
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Ready to submit')).toBeInTheDocument()
    })
  })

  describe('Input Handling', () => {
    it('should call onChange when text is entered', () => {
      const handleChange = vi.fn()
      render(
        <QuestionInput
          value=""
          onChange={handleChange}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      const textarea = screen.getByPlaceholderText('Enter your question here...')
      fireEvent.change(textarea, { target: { value: 'New question' } })
      expect(handleChange).toHaveBeenCalledWith('New question')
    })

    it('should display the current value', () => {
      render(
        <QuestionInput
          value="My current question"
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByDisplayValue('My current question')).toBeInTheDocument()
    })
  })

  describe('Submit Behavior', () => {
    it('should disable submit button when value is empty', () => {
      render(
        <QuestionInput
          value=""
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    })

    it('should disable submit button when value is only whitespace', () => {
      render(
        <QuestionInput
          value="   "
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    })

    it('should enable submit button when value has content', () => {
      render(
        <QuestionInput
          value="A valid question"
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
    })

    it('should call onSubmit when button is clicked', () => {
      const handleSubmit = vi.fn()
      render(
        <QuestionInput
          value="A valid question"
          onChange={vi.fn()}
          onSubmit={handleSubmit}
          isSubmitting={false}
          labels={defaultLabels}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
      expect(handleSubmit).toHaveBeenCalled()
    })

    it('should disable submit button when isSubmitting is true', () => {
      render(
        <QuestionInput
          value="A valid question"
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={true}
          labels={defaultLabels}
        />
      )
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should show submitting text when isSubmitting is true', () => {
      render(
        <QuestionInput
          value="A valid question"
          onChange={vi.fn()}
          onSubmit={vi.fn()}
          isSubmitting={true}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Submitting...')).toBeInTheDocument()
    })
  })
})
