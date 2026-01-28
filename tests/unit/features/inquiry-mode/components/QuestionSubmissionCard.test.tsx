/**
 * Tests for QuestionSubmissionCard Component
 */

import { render, screen } from '@testing-library/react'
import { QuestionSubmissionCard } from '@/features/inquiry-mode/components/QuestionSubmissionCard'
import type { SubmittedQuestion } from '@/features/inquiry-mode/types'

describe('QuestionSubmissionCard', () => {
  const baseQuestion: SubmittedQuestion = {
    id: 'q-1',
    content: 'What is the role of chlorophyll in photosynthesis?',
    score: 8.5,
    bloomsLevel: 'understand',
    feedback: 'Great question that demonstrates understanding!',
    evaluationStatus: 'completed',
  }

  describe('Rendering', () => {
    it('should display question number', () => {
      render(<QuestionSubmissionCard question={baseQuestion} index={0} />)
      expect(screen.getByText('Q1')).toBeInTheDocument()
    })

    it('should display question content', () => {
      render(<QuestionSubmissionCard question={baseQuestion} index={0} />)
      expect(screen.getByText(baseQuestion.content)).toBeInTheDocument()
    })

    it('should display score when completed', () => {
      render(<QuestionSubmissionCard question={baseQuestion} index={0} />)
      expect(screen.getByText('8.5')).toBeInTheDocument()
    })

    it('should display Bloom\'s level badge', () => {
      render(<QuestionSubmissionCard question={baseQuestion} index={0} />)
      expect(screen.getByText('Understand')).toBeInTheDocument()
    })

    it('should display feedback when available', () => {
      render(<QuestionSubmissionCard question={baseQuestion} index={0} />)
      expect(screen.getByText(baseQuestion.feedback!)).toBeInTheDocument()
    })
  })

  describe('Evaluation Status', () => {
    it('should show evaluating state', () => {
      const evaluatingQuestion: SubmittedQuestion = {
        ...baseQuestion,
        evaluationStatus: 'evaluating',
        score: null,
        bloomsLevel: null,
        feedback: null,
      }
      render(<QuestionSubmissionCard question={evaluatingQuestion} index={0} />)
      const evaluatingTexts = screen.getAllByText(/evaluating/i)
      expect(evaluatingTexts.length).toBeGreaterThan(0)
    })

    it('should show loading spinner when evaluating', () => {
      const evaluatingQuestion: SubmittedQuestion = {
        ...baseQuestion,
        evaluationStatus: 'evaluating',
        score: null,
      }
      render(<QuestionSubmissionCard question={evaluatingQuestion} index={0} />)
      const card = screen.getByText('Q1').closest('.border')
      expect(card).toHaveClass('animate-pulse')
    })

    it('should show error state', () => {
      const errorQuestion: SubmittedQuestion = {
        ...baseQuestion,
        evaluationStatus: 'error',
        feedback: 'Submission failed',
      }
      render(<QuestionSubmissionCard question={errorQuestion} index={0} />)
      const errorTexts = screen.getAllByText(/error/i)
      expect(errorTexts.length).toBeGreaterThan(0)
    })

    it('should show pending state', () => {
      const pendingQuestion: SubmittedQuestion = {
        ...baseQuestion,
        evaluationStatus: 'pending',
        score: null,
      }
      render(<QuestionSubmissionCard question={pendingQuestion} index={0} />)
      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('Score Colors', () => {
    it('should show green for high scores', () => {
      const highScoreQuestion: SubmittedQuestion = {
        ...baseQuestion,
        score: 9.0,
      }
      render(<QuestionSubmissionCard question={highScoreQuestion} index={0} />)
      const scoreElement = screen.getByText('9.0')
      expect(scoreElement).toHaveClass('text-green-600')
    })

    it('should show yellow for medium scores', () => {
      const mediumScoreQuestion: SubmittedQuestion = {
        ...baseQuestion,
        score: 7.0,
      }
      render(<QuestionSubmissionCard question={mediumScoreQuestion} index={0} />)
      const scoreElement = screen.getByText('7.0')
      expect(scoreElement).toHaveClass('text-yellow-600')
    })

    it('should show red for low scores', () => {
      const lowScoreQuestion: SubmittedQuestion = {
        ...baseQuestion,
        score: 4.0,
      }
      render(<QuestionSubmissionCard question={lowScoreQuestion} index={0} />)
      const scoreElement = screen.getByText('4.0')
      expect(scoreElement).toHaveClass('text-red-600')
    })
  })

  describe('Feedback Display', () => {
    it('should not show feedback section when feedback is null', () => {
      const noFeedbackQuestion: SubmittedQuestion = {
        ...baseQuestion,
        feedback: null,
      }
      render(<QuestionSubmissionCard question={noFeedbackQuestion} index={0} />)
      expect(screen.queryByText('AI Feedback')).not.toBeInTheDocument()
    })

    it('should not show feedback when evaluating', () => {
      const evaluatingQuestion: SubmittedQuestion = {
        ...baseQuestion,
        evaluationStatus: 'evaluating',
        feedback: 'Some feedback',
      }
      render(<QuestionSubmissionCard question={evaluatingQuestion} index={0} />)
      expect(screen.queryByText('Some feedback')).not.toBeInTheDocument()
    })
  })

  describe('Quality Label', () => {
    it('should show Excellent for high scores', () => {
      const question: SubmittedQuestion = { ...baseQuestion, score: 8.5 }
      render(<QuestionSubmissionCard question={question} index={0} showQualityLabel />)
      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })

    it('should show Good for medium scores', () => {
      const question: SubmittedQuestion = { ...baseQuestion, score: 7.0 }
      render(<QuestionSubmissionCard question={question} index={0} showQualityLabel />)
      expect(screen.getByText('Good')).toBeInTheDocument()
    })

    it('should show Needs Improvement for low scores', () => {
      const question: SubmittedQuestion = { ...baseQuestion, score: 4.0 }
      render(<QuestionSubmissionCard question={question} index={0} showQualityLabel />)
      expect(screen.getByText('Needs Improvement')).toBeInTheDocument()
    })
  })
})
