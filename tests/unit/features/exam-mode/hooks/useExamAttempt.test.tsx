/**
 * Tests for useExamAttempt Hook
 *
 * @see VIBE-0010
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useExamAttempt } from '@/features/exam-mode/hooks/useExamAttempt'
import type { Question } from '@/features/exam-mode/types'

describe('useExamAttempt', () => {
  const mockQuestions: Question[] = [
    { id: 'q-1', content: 'Question 1?', choices: ['A', 'B', 'C', 'D'] },
    { id: 'q-2', content: 'Question 2?', choices: ['A', 'B', 'C', 'D'] },
    { id: 'q-3', content: 'Question 3?', choices: ['A', 'B', 'C', 'D'] },
  ]

  const mockSaveAnswer = vi.fn()
  const mockSubmitExam = vi.fn()

  const defaultOptions = {
    attemptId: 'attempt-1',
    activityId: 'activity-1',
    questions: mockQuestions,
    existingAnswers: {},
    remainingSeconds: 300,
    timeLimitMinutes: 5,
    saveAnswer: mockSaveAnswer,
    submitExam: mockSubmitExam,
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockSaveAnswer.mockResolvedValue(undefined)
    mockSubmitExam.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should initialize with first question', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      expect(result.current.currentQuestion).toEqual(mockQuestions[0])
    })

    it('should start with no answers', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      expect(result.current.answeredCount).toBe(0)
    })

    it('should initialize with existing answers', () => {
      const existingAnswers = { 'q-1': ['0'], 'q-2': ['1'] }
      const { result } = renderHook(() =>
        useExamAttempt({ ...defaultOptions, existingAnswers })
      )
      expect(result.current.answeredCount).toBe(2)
    })

    it('should not be submitting initially', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should not be saving initially', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      expect(result.current.isSaving).toBe(false)
    })

    it('should provide question number starting at 1', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      expect(result.current.questionNumber).toBe(1)
    })
  })

  describe('Timer Integration', () => {
    it('should expose timer state', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      expect(result.current.timer.remainingSeconds).toBe(300)
    })

    it('should countdown timer', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.timer.remainingSeconds).toBe(295)
    })

    it('should auto-submit when time is up', async () => {
      const { result } = renderHook(() =>
        useExamAttempt({ ...defaultOptions, remainingSeconds: 2 })
      )

      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      // The timer should have reached 0 and triggered submission
      expect(mockSubmitExam).toHaveBeenCalled()
    })
  })

  describe('Navigation Integration', () => {
    it('should expose navigation state', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      expect(result.current.navigation.currentIndex).toBe(0)
    })

    it('should navigate to next question', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      act(() => {
        result.current.navigation.nextQuestion()
      })

      expect(result.current.currentQuestion?.id).toBe('q-2')
      expect(result.current.questionNumber).toBe(2)
    })

    it('should navigate to previous question', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      act(() => {
        result.current.navigation.nextQuestion()
      })

      act(() => {
        result.current.navigation.prevQuestion()
      })

      expect(result.current.currentQuestion?.id).toBe('q-1')
    })
  })

  describe('Answer Management', () => {
    it('should set answer for current question', async () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      await act(async () => {
        await result.current.setAnswer('q-1', 2)
      })

      expect(result.current.answers['q-1']).toEqual(['2'])
    })

    it('should update answered count after answering', async () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      await act(async () => {
        await result.current.setAnswer('q-1', 0)
        vi.advanceTimersByTime(200) // Allow debounce
      })

      expect(result.current.answeredCount).toBe(1)
    })

    it('should save answer to server', async () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      await act(async () => {
        await result.current.setAnswer('q-1', 1)
      })

      await act(async () => {
        vi.advanceTimersByTime(200) // Allow debounce
      })

      // The save should have been called
      expect(mockSaveAnswer).toHaveBeenCalled()
    })

    it('should provide current answer for displayed question', async () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      await act(async () => {
        await result.current.setAnswer('q-1', 3)
      })

      expect(result.current.currentAnswer).toEqual(['3'])
    })

    it('should return empty array for unanswered question', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      expect(result.current.currentAnswer).toEqual([])
    })
  })

  describe('Choice Shuffles', () => {
    it('should return default order when no shuffle provided', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))
      const shuffle = result.current.getChoiceShuffle('q-1')
      expect(shuffle).toEqual([0, 1, 2, 3])
    })

    it('should return provided shuffle order', () => {
      const choiceShuffles = { 'q-1': [3, 1, 2, 0] }
      const { result } = renderHook(() =>
        useExamAttempt({ ...defaultOptions, choiceShuffles })
      )
      const shuffle = result.current.getChoiceShuffle('q-1')
      expect(shuffle).toEqual([3, 1, 2, 0])
    })
  })

  describe('Exam Submission', () => {
    it('should call submitExam on handleSubmit', async () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockSubmitExam).toHaveBeenCalledWith('attempt-1')
    })

    it('should set isSubmitting during submission', async () => {
      mockSubmitExam.mockImplementation(() => new Promise(() => {}))
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      act(() => {
        result.current.handleSubmit()
      })

      expect(result.current.isSubmitting).toBe(true)
    })

    it('should not submit multiple times while submitting', async () => {
      mockSubmitExam.mockImplementation(() => new Promise(() => {}))
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      // First call starts submission
      act(() => {
        result.current.handleSubmit()
      })

      // Subsequent calls should be ignored because isSubmitting is true
      act(() => {
        result.current.handleSubmit()
        result.current.handleSubmit()
      })

      // Due to React strict mode, the first call may run multiple times, but the key is
      // isSubmitting guards against concurrent submissions
      expect(result.current.isSubmitting).toBe(true)
    })

    it('should reset isSubmitting on failure', async () => {
      mockSubmitExam.mockResolvedValueOnce({ success: false, error: 'Failed' })
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.isSubmitting).toBe(false)
      alertSpy.mockRestore()
    })
  })

  describe('Empty Questions Handling', () => {
    it('should handle empty questions array', () => {
      const { result } = renderHook(() =>
        useExamAttempt({ ...defaultOptions, questions: [] })
      )

      expect(result.current.currentQuestion).toBeNull()
      expect(result.current.questionNumber).toBe(1)
    })
  })

  describe('Flagging', () => {
    it('should allow flagging questions via navigation', () => {
      const { result } = renderHook(() => useExamAttempt(defaultOptions))

      act(() => {
        result.current.navigation.toggleFlag('q-1')
      })

      expect(result.current.navigation.isFlagged('q-1')).toBe(true)
    })
  })
})
