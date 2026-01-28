/**
 * Tests for InquiryResultCard Component
 */

import { render, screen } from '@testing-library/react'
import { InquiryResultCard } from '@/features/inquiry-mode/components/InquiryResultCard'
import type { QuestionWithEvaluation } from '@/features/inquiry-mode/types'

describe('InquiryResultCard', () => {
  const baseQuestion: QuestionWithEvaluation = {
    id: 'q-1',
    content: 'How does photosynthesis convert light energy into chemical energy?',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    evaluation: {
      overallScore: 8.5,
      creativityScore: 8.0,
      clarityScore: 9.0,
      relevanceScore: 8.5,
      innovationScore: 7.5,
      complexityScore: 8.0,
      bloomsLevel: 'analyze',
      evaluationText: 'Excellent question demonstrating analytical thinking!',
      strengths: ['Clear focus', 'Deep analysis', 'Relevant topic'],
      improvements: ['Could explore more variables'],
      enhancedQuestions: [
        { level: 'evaluate', question: 'What are the trade-offs in different photosynthetic pathways?' },
      ],
    },
  }

  describe('Rendering', () => {
    it('should display question number', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('Q1')).toBeInTheDocument()
    })

    it('should display question content', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText(baseQuestion.content)).toBeInTheDocument()
    })

    it('should display overall score', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      const scoreElements = screen.getAllByText('8.5')
      expect(scoreElements.length).toBeGreaterThan(0)
    })

    it('should display Bloom\'s level badge', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('Analyze')).toBeInTheDocument()
    })
  })

  describe('Dimension Scores', () => {
    it('should display creativity score', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('8.0')).toBeInTheDocument()
      expect(screen.getByText('Creativity')).toBeInTheDocument()
    })

    it('should display clarity score', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('9.0')).toBeInTheDocument()
      expect(screen.getByText('Clarity')).toBeInTheDocument()
    })

    it('should display relevance score', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('Relevance')).toBeInTheDocument()
    })

    it('should display innovation score', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('7.5')).toBeInTheDocument()
      expect(screen.getByText('Innovation')).toBeInTheDocument()
    })
  })

  describe('AI Feedback', () => {
    it('should display evaluation text', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('Excellent question demonstrating analytical thinking!')).toBeInTheDocument()
    })

    it('should display AI Feedback header', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('AI Feedback')).toBeInTheDocument()
    })
  })

  describe('Strengths and Improvements', () => {
    it('should display strengths', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('Strengths')).toBeInTheDocument()
      expect(screen.getByText(/Clear focus/)).toBeInTheDocument()
    })

    it('should display improvements', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText('Improvements')).toBeInTheDocument()
      expect(screen.getByText(/Could explore more variables/)).toBeInTheDocument()
    })
  })

  describe('Enhanced Questions', () => {
    it('should display enhanced questions section', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText(/Try These Higher-Level Questions/)).toBeInTheDocument()
    })

    it('should display enhanced question content', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      expect(screen.getByText(/trade-offs/)).toBeInTheDocument()
    })
  })

  describe('No Evaluation', () => {
    it('should handle question without evaluation', () => {
      const questionWithoutEval: QuestionWithEvaluation = {
        ...baseQuestion,
        evaluation: null,
      }
      render(<InquiryResultCard question={questionWithoutEval} index={0} />)
      expect(screen.getByText(baseQuestion.content)).toBeInTheDocument()
      expect(screen.queryByText('AI Feedback')).not.toBeInTheDocument()
    })
  })

  describe('Score Colors', () => {
    it('should show green for high scores', () => {
      render(<InquiryResultCard question={baseQuestion} index={0} />)
      // Get the main score element (2xl size)
      const scoreElements = screen.getAllByText('8.5')
      const mainScore = scoreElements.find(el => el.classList.contains('text-2xl'))
      expect(mainScore).toHaveClass('text-green-600')
    })

    it('should show yellow for medium scores', () => {
      const mediumScoreQuestion: QuestionWithEvaluation = {
        ...baseQuestion,
        evaluation: { ...baseQuestion.evaluation!, overallScore: 7.0 },
      }
      render(<InquiryResultCard question={mediumScoreQuestion} index={0} />)
      const scoreElement = screen.getByText('7.0')
      expect(scoreElement).toHaveClass('text-yellow-600')
    })
  })

  describe('Empty Arrays', () => {
    it('should not show strengths section when empty', () => {
      const noStrengthsQuestion: QuestionWithEvaluation = {
        ...baseQuestion,
        evaluation: { ...baseQuestion.evaluation!, strengths: [] },
      }
      render(<InquiryResultCard question={noStrengthsQuestion} index={0} />)
      expect(screen.queryByText('Strengths')).not.toBeInTheDocument()
    })

    it('should not show improvements section when empty', () => {
      const noImprovementsQuestion: QuestionWithEvaluation = {
        ...baseQuestion,
        evaluation: { ...baseQuestion.evaluation!, improvements: [] },
      }
      render(<InquiryResultCard question={noImprovementsQuestion} index={0} />)
      expect(screen.queryByText('Improvements')).not.toBeInTheDocument()
    })
  })
})
