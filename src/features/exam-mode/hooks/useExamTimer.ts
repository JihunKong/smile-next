/**
 * useExamTimer Hook
 *
 * Manages exam countdown timer with warning states and auto-submit.
 *
 * @see VIBE-0004D
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseExamTimerOptions {
    initialSeconds: number
    warningThreshold?: number // Default 60 seconds
    criticalThreshold?: number // Default 30 seconds
    onTimeUp: () => void
}

interface UseExamTimerReturn {
    remainingSeconds: number
    isWarning: boolean
    isCritical: boolean
    isPaused: boolean
    formattedTime: string
    timerPercentage: number
    pause: () => void
    resume: () => void
}

export function useExamTimer({
    initialSeconds,
    warningThreshold = 60,
    criticalThreshold = 30,
    onTimeUp,
}: UseExamTimerOptions): UseExamTimerReturn {
    const [remaining, setRemaining] = useState(initialSeconds)
    const [isPaused, setIsPaused] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const onTimeUpRef = useRef(onTimeUp)

    // Keep onTimeUp ref updated
    useEffect(() => {
        onTimeUpRef.current = onTimeUp
    }, [onTimeUp])

    useEffect(() => {
        if (isPaused || remaining <= 0) return

        timerRef.current = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current)
                    onTimeUpRef.current()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isPaused, remaining])

    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }, [])

    const pause = useCallback(() => {
        setIsPaused(true)
    }, [])

    const resume = useCallback(() => {
        setIsPaused(false)
    }, [])

    return {
        remainingSeconds: remaining,
        isWarning: remaining <= warningThreshold && remaining > criticalThreshold,
        isCritical: remaining <= criticalThreshold,
        isPaused,
        formattedTime: formatTime(remaining),
        timerPercentage: initialSeconds > 0 ? (remaining / initialSeconds) * 100 : 100,
        pause,
        resume,
    }
}
