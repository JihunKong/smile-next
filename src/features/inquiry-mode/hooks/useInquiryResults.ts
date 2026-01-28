'use client'

import { useMemo } from 'react'
import type {
  QuestionWithEvaluation,
  DimensionScores,
  BloomsDistribution,
} from '../types'

interface UseInquiryResultsProps {
  questions: QuestionWithEvaluation[]
  passThreshold: number
}

interface UseInquiryResultsReturn {
  // Computed values
  averageScore: number
  passed: boolean
  dimensionScores: DimensionScores
  bloomsDistribution: BloomsDistribution
  evaluatedQuestions: QuestionWithEvaluation[]
  allQuestions: QuestionWithEvaluation[]
  totalQuestions: number
}

export function useInquiryResults({
  questions,
  passThreshold,
}: UseInquiryResultsProps): UseInquiryResultsReturn {
  const evaluatedQuestions = useMemo(
    () => questions.filter(q => q.evaluation !== null),
    [questions]
  )

  const averageScore = useMemo(() => {
    if (evaluatedQuestions.length === 0) return 0
    const totalScore = evaluatedQuestions.reduce(
      (sum, q) => sum + (q.evaluation?.overallScore || 0),
      0
    )
    return totalScore / evaluatedQuestions.length
  }, [evaluatedQuestions])

  const passed = averageScore >= passThreshold

  const dimensionScores = useMemo((): DimensionScores => {
    if (evaluatedQuestions.length === 0) {
      return {
        creativity: 0,
        clarity: 0,
        relevance: 0,
        innovation: 0,
        complexity: 0,
      }
    }

    const totals = {
      creativity: 0,
      clarity: 0,
      relevance: 0,
      innovation: 0,
      complexity: 0,
    }

    evaluatedQuestions.forEach(q => {
      const ev = q.evaluation
      if (ev) {
        totals.creativity += ev.creativityScore || 0
        totals.clarity += ev.clarityScore || 0
        totals.relevance += ev.relevanceScore || 0
        totals.innovation += ev.innovationScore || 0
        totals.complexity += ev.complexityScore || 0
      }
    })

    const count = evaluatedQuestions.length
    return {
      creativity: totals.creativity / count,
      clarity: totals.clarity / count,
      relevance: totals.relevance / count,
      innovation: totals.innovation / count,
      complexity: totals.complexity / count,
    }
  }, [evaluatedQuestions])

  const bloomsDistribution = useMemo((): BloomsDistribution => {
    const distribution: BloomsDistribution = {}

    questions.forEach(q => {
      if (q.evaluation === null) return // Skip questions without evaluation

      const level = q.evaluation.bloomsLevel || 'unknown'
      distribution[level] = (distribution[level] || 0) + 1
    })

    return distribution
  }, [questions])

  return {
    averageScore,
    passed,
    dimensionScores,
    bloomsDistribution,
    evaluatedQuestions,
    allQuestions: questions,
    totalQuestions: questions.length,
  }
}
