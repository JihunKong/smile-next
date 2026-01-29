/**
 * Tests for useExamNavigation Hook
 *
 * @see VIBE-0010
 */

import { renderHook, act } from '@testing-library/react'
import { useExamNavigation } from '@/features/exam-mode/hooks/useExamNavigation'

describe('useExamNavigation', () => {
  const defaultOptions = {
    totalQuestions: 10,
  }

  describe('Initial State', () => {
    it('should start at index 0 by default', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))
      expect(result.current.currentIndex).toBe(0)
    })

    it('should start at custom initial index', () => {
      const { result } = renderHook(() =>
        useExamNavigation({ ...defaultOptions, initialIndex: 5 })
      )
      expect(result.current.currentIndex).toBe(5)
    })

    it('should have empty flagged questions set', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))
      expect(result.current.flaggedQuestions.size).toBe(0)
    })

    it('should indicate first question', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))
      expect(result.current.isFirstQuestion).toBe(true)
    })

    it('should not indicate last question at start', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))
      expect(result.current.isLastQuestion).toBe(false)
    })
  })

  describe('goToQuestion', () => {
    it('should navigate to a specific question', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.goToQuestion(5)
      })

      expect(result.current.currentIndex).toBe(5)
    })

    it('should not navigate to negative index', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.goToQuestion(-1)
      })

      expect(result.current.currentIndex).toBe(0)
    })

    it('should not navigate beyond total questions', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.goToQuestion(15)
      })

      expect(result.current.currentIndex).toBe(0)
    })

    it('should allow navigation to last question', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.goToQuestion(9) // 0-indexed, so 9 is the 10th question
      })

      expect(result.current.currentIndex).toBe(9)
      expect(result.current.isLastQuestion).toBe(true)
    })
  })

  describe('nextQuestion', () => {
    it('should move to next question', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.nextQuestion()
      })

      expect(result.current.currentIndex).toBe(1)
    })

    it('should not go past last question', () => {
      const { result } = renderHook(() =>
        useExamNavigation({ ...defaultOptions, initialIndex: 9 })
      )

      act(() => {
        result.current.nextQuestion()
      })

      expect(result.current.currentIndex).toBe(9)
    })

    it('should update isFirstQuestion after moving', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.nextQuestion()
      })

      expect(result.current.isFirstQuestion).toBe(false)
    })
  })

  describe('prevQuestion', () => {
    it('should move to previous question', () => {
      const { result } = renderHook(() =>
        useExamNavigation({ ...defaultOptions, initialIndex: 5 })
      )

      act(() => {
        result.current.prevQuestion()
      })

      expect(result.current.currentIndex).toBe(4)
    })

    it('should not go before first question', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.prevQuestion()
      })

      expect(result.current.currentIndex).toBe(0)
    })

    it('should update isLastQuestion after moving back', () => {
      const { result } = renderHook(() =>
        useExamNavigation({ ...defaultOptions, initialIndex: 9 })
      )

      act(() => {
        result.current.prevQuestion()
      })

      expect(result.current.isLastQuestion).toBe(false)
    })
  })

  describe('toggleFlag', () => {
    it('should add question to flagged set', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.toggleFlag('question-1')
      })

      expect(result.current.flaggedQuestions.has('question-1')).toBe(true)
    })

    it('should remove question from flagged set if already flagged', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.toggleFlag('question-1')
      })

      act(() => {
        result.current.toggleFlag('question-1')
      })

      expect(result.current.flaggedQuestions.has('question-1')).toBe(false)
    })

    it('should allow multiple questions to be flagged', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.toggleFlag('question-1')
        result.current.toggleFlag('question-2')
        result.current.toggleFlag('question-3')
      })

      expect(result.current.flaggedQuestions.size).toBe(3)
    })
  })

  describe('isFlagged', () => {
    it('should return true for flagged questions', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      act(() => {
        result.current.toggleFlag('question-1')
      })

      expect(result.current.isFlagged('question-1')).toBe(true)
    })

    it('should return false for unflagged questions', () => {
      const { result } = renderHook(() => useExamNavigation(defaultOptions))

      expect(result.current.isFlagged('question-1')).toBe(false)
    })
  })

  describe('Boundary Conditions', () => {
    it('should handle single question exam', () => {
      const { result } = renderHook(() =>
        useExamNavigation({ totalQuestions: 1 })
      )

      expect(result.current.isFirstQuestion).toBe(true)
      expect(result.current.isLastQuestion).toBe(true)
    })

    it('should handle navigation in two question exam', () => {
      const { result } = renderHook(() =>
        useExamNavigation({ totalQuestions: 2 })
      )

      expect(result.current.isFirstQuestion).toBe(true)
      expect(result.current.isLastQuestion).toBe(false)

      act(() => {
        result.current.nextQuestion()
      })

      expect(result.current.isFirstQuestion).toBe(false)
      expect(result.current.isLastQuestion).toBe(true)
    })
  })
})
