/**
 * Tests for useInquiryResults Hook
 */

import { renderHook } from '@testing-library/react'
import { useInquiryResults } from '@/features/inquiry-mode/hooks/useInquiryResults'
import type { QuestionWithEvaluation, EvaluationData } from '@/features/inquiry-mode/types'

describe('useInquiryResults', () => {
  const createEvaluation = (overrides?: Partial<EvaluationData>): EvaluationData => ({
    overallScore: 8.0,
    creativityScore: 8.0,
    clarityScore: 8.5,
    relevanceScore: 7.5,
    innovationScore: 7.0,
    complexityScore: 8.0,
    bloomsLevel: 'analyze',
    evaluationText: 'Good question',
    strengths: ['Clear'],
    improvements: ['More detail'],
    enhancedQuestions: [],
    ...overrides,
  })

  const createQuestion = (
    id: string,
    evaluation: EvaluationData | null = createEvaluation()
  ): QuestionWithEvaluation => ({
    id,
    content: `Question ${id}`,
    createdAt: new Date(),
    evaluation,
  })

  describe('Average Score Calculation', () => {
    it('should calculate average score from questions', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation({ overallScore: 8 })),
        createQuestion('2', createEvaluation({ overallScore: 6 })),
        createQuestion('3', createEvaluation({ overallScore: 10 })),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.averageScore).toBe(8)
    })

    it('should return 0 for empty questions array', () => {
      const { result } = renderHook(() => useInquiryResults({ questions: [], passThreshold: 6 }))
      expect(result.current.averageScore).toBe(0)
    })

    it('should ignore questions without evaluation', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation({ overallScore: 8 })),
        createQuestion('2', null),
        createQuestion('3', createEvaluation({ overallScore: 6 })),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.averageScore).toBe(7)
    })
  })

  describe('Pass/Fail Determination', () => {
    it('should pass when average score >= threshold', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation({ overallScore: 8 })),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.passed).toBe(true)
    })

    it('should fail when average score < threshold', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation({ overallScore: 5 })),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.passed).toBe(false)
    })

    it('should pass when average score equals threshold', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation({ overallScore: 6 })),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.passed).toBe(true)
    })
  })

  describe('Dimension Scores', () => {
    it('should calculate average dimension scores', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation({
          creativityScore: 8,
          clarityScore: 9,
          relevanceScore: 7,
          innovationScore: 6,
          complexityScore: 8,
        })),
        createQuestion('2', createEvaluation({
          creativityScore: 6,
          clarityScore: 7,
          relevanceScore: 9,
          innovationScore: 8,
          complexityScore: 6,
        })),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.dimensionScores.creativity).toBe(7)
      expect(result.current.dimensionScores.clarity).toBe(8)
      expect(result.current.dimensionScores.relevance).toBe(8)
      expect(result.current.dimensionScores.innovation).toBe(7)
      expect(result.current.dimensionScores.complexity).toBe(7)
    })

    it('should return zero scores for empty questions', () => {
      const { result } = renderHook(() => useInquiryResults({ questions: [], passThreshold: 6 }))

      expect(result.current.dimensionScores.creativity).toBe(0)
      expect(result.current.dimensionScores.clarity).toBe(0)
    })
  })

  describe('Bloom\'s Distribution', () => {
    it('should count questions by Bloom\'s level', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation({ bloomsLevel: 'analyze' })),
        createQuestion('2', createEvaluation({ bloomsLevel: 'analyze' })),
        createQuestion('3', createEvaluation({ bloomsLevel: 'create' })),
        createQuestion('4', createEvaluation({ bloomsLevel: 'understand' })),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.bloomsDistribution).toEqual({
        analyze: 2,
        create: 1,
        understand: 1,
      })
    })

    it('should handle questions without Bloom\'s level', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation({ bloomsLevel: 'apply' })),
        createQuestion('2', null),
        createQuestion('3', createEvaluation({ bloomsLevel: null })),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.bloomsDistribution).toEqual({
        apply: 1,
        unknown: 1,
      })
    })
  })

  describe('Evaluated Questions', () => {
    it('should return only evaluated questions', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation()),
        createQuestion('2', null),
        createQuestion('3', createEvaluation()),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.evaluatedQuestions).toHaveLength(2)
    })

    it('should return all questions', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1', createEvaluation()),
        createQuestion('2', null),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.allQuestions).toHaveLength(2)
    })
  })

  describe('Total Questions', () => {
    it('should return total question count', () => {
      const questions: QuestionWithEvaluation[] = [
        createQuestion('1'),
        createQuestion('2'),
        createQuestion('3'),
      ]

      const { result } = renderHook(() => useInquiryResults({ questions, passThreshold: 6 }))

      expect(result.current.totalQuestions).toBe(3)
    })
  })
})
