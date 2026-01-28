'use client'

import { useState, useCallback } from 'react'
import type { SubmittedQuestion, InquiryCompletionResult } from '../types'
import { calculateAverageScore } from '../utils'
import {
  submitInquiryQuestion,
  completeInquiryAttempt,
} from '@/app/(dashboard)/activities/[id]/inquiry/actions'

interface UseInquiryAttemptProps {
  attemptId: string
  activityId: string
  questionsRequired: number
  passThreshold: number
  initialQuestions: SubmittedQuestion[]
}

interface UseInquiryAttemptReturn {
  // State
  currentQuestion: string
  submittedQuestions: SubmittedQuestion[]
  isSubmitting: boolean
  timerKey: number
  isComplete: boolean
  questionsRemaining: number
  averageScore: number

  // Actions
  setCurrentQuestion: (question: string) => void
  submitQuestion: () => Promise<void>
  completeAttempt: () => Promise<InquiryCompletionResult | null>
  addKeyword: (keyword: string) => void
  incrementTimerKey: () => void
}

export function useInquiryAttempt({
  attemptId,
  questionsRequired,
  initialQuestions,
}: UseInquiryAttemptProps): UseInquiryAttemptReturn {
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [submittedQuestions, setSubmittedQuestions] = useState<SubmittedQuestion[]>(initialQuestions)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timerKey, setTimerKey] = useState(0)

  const questionsRemaining = questionsRequired - submittedQuestions.length
  const isComplete = questionsRemaining <= 0

  const averageScore = calculateAverageScore(
    submittedQuestions.map(q => q.score)
  )

  const incrementTimerKey = useCallback(() => {
    setTimerKey(k => k + 1)
  }, [])

  const addKeyword = useCallback((keyword: string) => {
    setCurrentQuestion(prev => prev ? `${prev} ${keyword}` : keyword)
  }, [])

  const submitQuestion = useCallback(async () => {
    if (!currentQuestion.trim() || isSubmitting) return

    setIsSubmitting(true)

    // Add question immediately with "evaluating" status
    const tempQuestion: SubmittedQuestion = {
      id: `temp-${Date.now()}`,
      content: currentQuestion,
      score: null,
      bloomsLevel: null,
      feedback: null,
      evaluationStatus: 'evaluating',
    }

    setSubmittedQuestions(prev => [...prev, tempQuestion])
    const questionContent = currentQuestion
    setCurrentQuestion('')
    setTimerKey(k => k + 1)

    try {
      const result = await submitInquiryQuestion(attemptId, questionContent)

      if (result.success && result.data) {
        const updatedQuestion: SubmittedQuestion = {
          id: result.data.questionId,
          content: questionContent,
          score: result.data.evaluation?.score || null,
          bloomsLevel: result.data.evaluation?.bloomsLevel || null,
          feedback: result.data.evaluation?.feedback || null,
          evaluationStatus: result.data.evaluation ? 'completed' : 'pending',
        }
        setSubmittedQuestions(prev =>
          prev.map(q => q.id === tempQuestion.id ? updatedQuestion : q)
        )
      } else {
        setSubmittedQuestions(prev =>
          prev.map(q =>
            q.id === tempQuestion.id
              ? { ...q, evaluationStatus: 'error', feedback: result.error || 'Submission failed' }
              : q
          )
        )
      }
    } catch {
      setSubmittedQuestions(prev =>
        prev.map(q =>
          q.id === tempQuestion.id
            ? { ...q, evaluationStatus: 'error', feedback: 'Submission failed' }
            : q
        )
      )
    }

    setIsSubmitting(false)
  }, [attemptId, currentQuestion, isSubmitting])

  const completeAttemptFn = useCallback(async (): Promise<InquiryCompletionResult | null> => {
    setIsSubmitting(true)

    try {
      const result = await completeInquiryAttempt(attemptId)

      if (result.success && result.data) {
        return result.data
      }
      return null
    } catch {
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [attemptId])

  return {
    // State
    currentQuestion,
    submittedQuestions,
    isSubmitting,
    timerKey,
    isComplete,
    questionsRemaining,
    averageScore,

    // Actions
    setCurrentQuestion,
    submitQuestion,
    completeAttempt: completeAttemptFn,
    addKeyword,
    incrementTimerKey,
  }
}
