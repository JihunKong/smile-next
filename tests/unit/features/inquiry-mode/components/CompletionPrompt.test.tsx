/**
 * Tests for CompletionPrompt Component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { CompletionPrompt } from '@/features/inquiry-mode/components/CompletionPrompt'

const defaultLabels = {
  title: 'All Questions Submitted!',
  description: 'You have generated {count} questions.',
  processing: 'Processing...',
  button: 'View Results',
}

describe('CompletionPrompt', () => {
  describe('Rendering', () => {
    it('should render title', () => {
      render(
        <CompletionPrompt
          questionsRequired={5}
          isSubmitting={false}
          onComplete={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('All Questions Submitted!')).toBeInTheDocument()
    })

    it('should render description with count', () => {
      render(
        <CompletionPrompt
          questionsRequired={5}
          isSubmitting={false}
          onComplete={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('You have generated 5 questions.')).toBeInTheDocument()
    })

    it('should render complete button', () => {
      render(
        <CompletionPrompt
          questionsRequired={5}
          isSubmitting={false}
          onComplete={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByRole('button', { name: /view results/i })).toBeInTheDocument()
    })

    it('should render success icon', () => {
      const { container } = render(
        <CompletionPrompt
          questionsRequired={5}
          isSubmitting={false}
          onComplete={vi.fn()}
          labels={defaultLabels}
        />
      )
      // Check for checkmark icon
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Button Interaction', () => {
    it('should call onComplete when button is clicked', () => {
      const handleComplete = vi.fn()
      render(
        <CompletionPrompt
          questionsRequired={5}
          isSubmitting={false}
          onComplete={handleComplete}
          labels={defaultLabels}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: /view results/i }))
      expect(handleComplete).toHaveBeenCalled()
    })

    it('should disable button when isSubmitting is true', () => {
      render(
        <CompletionPrompt
          questionsRequired={5}
          isSubmitting={true}
          onComplete={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should show processing text when isSubmitting is true', () => {
      render(
        <CompletionPrompt
          questionsRequired={5}
          isSubmitting={true}
          onComplete={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  describe('Questions Count', () => {
    it('should display correct count for different requirements', () => {
      render(
        <CompletionPrompt
          questionsRequired={10}
          isSubmitting={false}
          onComplete={vi.fn()}
          labels={defaultLabels}
        />
      )
      expect(screen.getByText('You have generated 10 questions.')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have green background styling', () => {
      const { container } = render(
        <CompletionPrompt
          questionsRequired={5}
          isSubmitting={false}
          onComplete={vi.fn()}
          labels={defaultLabels}
        />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('bg-green')
    })
  })
})
