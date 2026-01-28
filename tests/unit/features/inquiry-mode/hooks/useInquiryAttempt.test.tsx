/**
 * Tests for useInquiryAttempt Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useInquiryAttempt } from '@/features/inquiry-mode/hooks/useInquiryAttempt'
import type { SubmittedQuestion } from '@/features/inquiry-mode/types'

// Mock the server actions
vi.mock('@/app/(dashboard)/activities/[id]/inquiry/actions', () => ({
  submitInquiryQuestion: vi.fn(),
  completeInquiryAttempt: vi.fn(),
  updateInquiryCheatingStats: vi.fn(),
}))

import {
  submitInquiryQuestion,
  completeInquiryAttempt,
} from '@/app/(dashboard)/activities/[id]/inquiry/actions'

describe('useInquiryAttempt', () => {
  const defaultProps = {
    attemptId: 'attempt-1',
    activityId: 'activity-1',
    questionsRequired: 5,
    passThreshold: 6.0,
    initialQuestions: [] as SubmittedQuestion[],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty current question', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))
      expect(result.current.currentQuestion).toBe('')
    })

    it('should initialize with provided initial questions', () => {
      const initialQuestions: SubmittedQuestion[] = [
        { id: 'q-1', content: 'Test', score: 8, bloomsLevel: 'understand', feedback: null },
      ]
      const { result } = renderHook(() =>
        useInquiryAttempt({ ...defaultProps, initialQuestions })
      )
      expect(result.current.submittedQuestions).toHaveLength(1)
    })

    it('should initialize with isSubmitting as false', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should calculate correct questions remaining', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))
      expect(result.current.questionsRemaining).toBe(5)
    })

    it('should not be complete initially', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))
      expect(result.current.isComplete).toBe(false)
    })
  })

  describe('Current Question Management', () => {
    it('should update current question', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.setCurrentQuestion('What is photosynthesis?')
      })

      expect(result.current.currentQuestion).toBe('What is photosynthesis?')
    })

    it('should track character count', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.setCurrentQuestion('Hello World')
      })

      expect(result.current.currentQuestion.length).toBe(11)
    })
  })

  describe('Question Submission', () => {
    it('should not submit empty question', async () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      await act(async () => {
        await result.current.submitQuestion()
      })

      expect(submitInquiryQuestion).not.toHaveBeenCalled()
    })

    it('should not submit whitespace-only question', async () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.setCurrentQuestion('   ')
      })

      await act(async () => {
        await result.current.submitQuestion()
      })

      expect(submitInquiryQuestion).not.toHaveBeenCalled()
    })

    it('should add question with evaluating status before server response', async () => {
      vi.mocked(submitInquiryQuestion).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.setCurrentQuestion('What is photosynthesis?')
      })

      // Don't await - we want to check intermediate state
      act(() => {
        result.current.submitQuestion()
      })

      expect(result.current.submittedQuestions).toHaveLength(1)
      expect(result.current.submittedQuestions[0].evaluationStatus).toBe('evaluating')
    })

    it('should clear current question after submission starts', async () => {
      vi.mocked(submitInquiryQuestion).mockImplementation(
        () => new Promise(() => {})
      )

      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.setCurrentQuestion('Test question')
      })

      act(() => {
        result.current.submitQuestion()
      })

      expect(result.current.currentQuestion).toBe('')
    })

    it('should update question with server response on success', async () => {
      vi.mocked(submitInquiryQuestion).mockResolvedValueOnce({
        success: true,
        data: {
          questionId: 'real-q-1',
          evaluation: {
            score: 8.5,
            bloomsLevel: 'analyze',
            feedback: 'Great question!',
          },
        },
      })

      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.setCurrentQuestion('What is the role of chlorophyll?')
      })

      await act(async () => {
        await result.current.submitQuestion()
      })

      await waitFor(() => {
        expect(result.current.submittedQuestions[0].id).toBe('real-q-1')
        expect(result.current.submittedQuestions[0].score).toBe(8.5)
        expect(result.current.submittedQuestions[0].evaluationStatus).toBe('completed')
      })
    })

    it('should mark question as error on failure', async () => {
      vi.mocked(submitInquiryQuestion).mockResolvedValueOnce({
        success: false,
        error: 'Server error',
      })

      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.setCurrentQuestion('Test question')
      })

      await act(async () => {
        await result.current.submitQuestion()
      })

      await waitFor(() => {
        expect(result.current.submittedQuestions[0].evaluationStatus).toBe('error')
        expect(result.current.submittedQuestions[0].feedback).toBe('Server error')
      })
    })
  })

  describe('Completion', () => {
    it('should be complete when all questions submitted', () => {
      const initialQuestions: SubmittedQuestion[] = Array(5).fill(null).map((_, i) => ({
        id: `q-${i}`,
        content: `Question ${i}`,
        score: 8,
        bloomsLevel: 'understand',
        feedback: null,
      }))

      const { result } = renderHook(() =>
        useInquiryAttempt({ ...defaultProps, initialQuestions })
      )

      expect(result.current.isComplete).toBe(true)
      expect(result.current.questionsRemaining).toBe(0)
    })

    it('should complete attempt and return results', async () => {
      vi.mocked(completeInquiryAttempt).mockResolvedValueOnce({
        success: true,
        data: {
          passed: true,
          averageScore: 8.5,
          questionsGenerated: 5,
        },
      })

      const initialQuestions: SubmittedQuestion[] = Array(5).fill(null).map((_, i) => ({
        id: `q-${i}`,
        content: `Question ${i}`,
        score: 8,
        bloomsLevel: 'understand',
        feedback: null,
      }))

      const { result } = renderHook(() =>
        useInquiryAttempt({ ...defaultProps, initialQuestions })
      )

      let completionResult
      await act(async () => {
        completionResult = await result.current.completeAttempt()
      })

      expect(completionResult).toEqual({
        passed: true,
        averageScore: 8.5,
        questionsGenerated: 5,
      })
    })
  })

  describe('Timer Key', () => {
    it('should provide timer key for resetting timer', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))
      expect(typeof result.current.timerKey).toBe('number')
    })

    it('should increment timer key after submission', async () => {
      vi.mocked(submitInquiryQuestion).mockResolvedValueOnce({
        success: true,
        data: { questionId: 'q-1', evaluation: { score: 8, bloomsLevel: 'apply', feedback: null } },
      })

      const { result } = renderHook(() => useInquiryAttempt(defaultProps))
      const initialKey = result.current.timerKey

      act(() => {
        result.current.setCurrentQuestion('Test')
      })

      await act(async () => {
        await result.current.submitQuestion()
      })

      expect(result.current.timerKey).toBeGreaterThan(initialKey)
    })
  })

  describe('Average Score', () => {
    it('should calculate average score from completed questions', () => {
      const initialQuestions: SubmittedQuestion[] = [
        { id: 'q-1', content: 'Q1', score: 8, bloomsLevel: 'apply', feedback: null },
        { id: 'q-2', content: 'Q2', score: 6, bloomsLevel: 'understand', feedback: null },
        { id: 'q-3', content: 'Q3', score: null, bloomsLevel: null, feedback: null, evaluationStatus: 'evaluating' },
      ]

      const { result } = renderHook(() =>
        useInquiryAttempt({ ...defaultProps, initialQuestions })
      )

      expect(result.current.averageScore).toBe(7) // (8 + 6) / 2
    })

    it('should return 0 when no scores available', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))
      expect(result.current.averageScore).toBe(0)
    })
  })

  describe('Keyword Addition', () => {
    it('should append keyword to current question', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.setCurrentQuestion('How does')
      })

      act(() => {
        result.current.addKeyword('photosynthesis')
      })

      expect(result.current.currentQuestion).toBe('How does photosynthesis')
    })

    it('should add keyword to empty question without space', () => {
      const { result } = renderHook(() => useInquiryAttempt(defaultProps))

      act(() => {
        result.current.addKeyword('photosynthesis')
      })

      expect(result.current.currentQuestion).toBe('photosynthesis')
    })
  })
})
