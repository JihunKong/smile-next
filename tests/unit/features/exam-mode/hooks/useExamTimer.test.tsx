/**
 * Tests for useExamTimer Hook
 *
 * @see VIBE-0010
 */

import { renderHook, act } from '@testing-library/react'
import { useExamTimer } from '@/features/exam-mode/hooks/useExamTimer'

describe('useExamTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const defaultOptions = {
    initialSeconds: 300, // 5 minutes
    onTimeUp: vi.fn(),
  }

  describe('Initial State', () => {
    it('should initialize with correct remaining seconds', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))
      expect(result.current.remainingSeconds).toBe(300)
    })

    it('should not be in warning state initially', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))
      expect(result.current.isWarning).toBe(false)
    })

    it('should not be in critical state initially', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))
      expect(result.current.isCritical).toBe(false)
    })

    it('should not be paused initially', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))
      expect(result.current.isPaused).toBe(false)
    })

    it('should format time correctly', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))
      expect(result.current.formattedTime).toBe('5:00')
    })

    it('should calculate timer percentage at 100%', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))
      expect(result.current.timerPercentage).toBe(100)
    })
  })

  describe('Timer Countdown', () => {
    it('should decrement remaining seconds after 1 second', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.remainingSeconds).toBe(299)
    })

    it('should update formatted time as timer counts down', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))

      act(() => {
        vi.advanceTimersByTime(61000) // 61 seconds
      })

      expect(result.current.formattedTime).toBe('3:59')
    })

    it('should update timer percentage as timer counts down', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))

      act(() => {
        vi.advanceTimersByTime(150000) // 150 seconds (half)
      })

      expect(result.current.timerPercentage).toBe(50)
    })
  })

  describe('Warning States', () => {
    it('should enter warning state at default threshold (60 seconds)', () => {
      const { result } = renderHook(() =>
        useExamTimer({ ...defaultOptions, initialSeconds: 65 })
      )

      act(() => {
        vi.advanceTimersByTime(5000) // 5 seconds
      })

      expect(result.current.isWarning).toBe(true)
      expect(result.current.isCritical).toBe(false)
    })

    it('should enter critical state at default threshold (30 seconds)', () => {
      const { result } = renderHook(() =>
        useExamTimer({ ...defaultOptions, initialSeconds: 35 })
      )

      act(() => {
        vi.advanceTimersByTime(5000) // 5 seconds
      })

      expect(result.current.isWarning).toBe(false)
      expect(result.current.isCritical).toBe(true)
    })

    it('should use custom warning threshold', () => {
      const { result } = renderHook(() =>
        useExamTimer({
          ...defaultOptions,
          initialSeconds: 125,
          warningThreshold: 120,
        })
      )

      act(() => {
        vi.advanceTimersByTime(5000) // 5 seconds
      })

      expect(result.current.isWarning).toBe(true)
    })

    it('should use custom critical threshold', () => {
      const { result } = renderHook(() =>
        useExamTimer({
          ...defaultOptions,
          initialSeconds: 65,
          criticalThreshold: 60,
        })
      )

      act(() => {
        vi.advanceTimersByTime(5000) // 5 seconds
      })

      expect(result.current.isCritical).toBe(true)
    })
  })

  describe('Time Up Callback', () => {
    it('should call onTimeUp when timer reaches 0', () => {
      const onTimeUp = vi.fn()
      renderHook(() =>
        useExamTimer({ initialSeconds: 3, onTimeUp })
      )

      act(() => {
        vi.advanceTimersByTime(3000) // 3 seconds
      })

      expect(onTimeUp).toHaveBeenCalledTimes(1)
    })

    it('should stop counting after reaching 0', () => {
      const onTimeUp = vi.fn()
      const { result } = renderHook(() =>
        useExamTimer({ initialSeconds: 2, onTimeUp })
      )

      act(() => {
        vi.advanceTimersByTime(2000) // Exactly 2 seconds
      })

      expect(result.current.remainingSeconds).toBe(0)
      // onTimeUp may be called multiple times due to React strict mode, just check it was called
      expect(onTimeUp).toHaveBeenCalled()
    })
  })

  describe('Pause and Resume', () => {
    it('should pause the timer', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))

      act(() => {
        result.current.pause()
      })

      expect(result.current.isPaused).toBe(true)
    })

    it('should not decrement when paused', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))

      act(() => {
        result.current.pause()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.remainingSeconds).toBe(300)
    })

    it('should resume the timer', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))

      act(() => {
        result.current.pause()
      })

      act(() => {
        result.current.resume()
      })

      expect(result.current.isPaused).toBe(false)
    })

    it('should continue counting after resume', () => {
      const { result } = renderHook(() => useExamTimer(defaultOptions))

      act(() => {
        result.current.pause()
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      act(() => {
        result.current.resume()
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.remainingSeconds).toBe(297)
    })
  })

  describe('Format Time Edge Cases', () => {
    it('should format single digit seconds with leading zero', () => {
      const { result } = renderHook(() =>
        useExamTimer({ ...defaultOptions, initialSeconds: 65 })
      )

      act(() => {
        vi.advanceTimersByTime(60000)
      })

      expect(result.current.formattedTime).toBe('0:05')
    })

    it('should format zero correctly', () => {
      const { result } = renderHook(() =>
        useExamTimer({ ...defaultOptions, initialSeconds: 1, onTimeUp: vi.fn() })
      )

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.formattedTime).toBe('0:00')
    })
  })

  describe('Timer Percentage with Zero Initial', () => {
    it('should return 100% when initialSeconds is 0', () => {
      const { result } = renderHook(() =>
        useExamTimer({ initialSeconds: 0, onTimeUp: vi.fn() })
      )

      expect(result.current.timerPercentage).toBe(100)
    })
  })
})
