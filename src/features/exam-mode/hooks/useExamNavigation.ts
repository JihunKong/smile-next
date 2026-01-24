/**
 * useExamNavigation Hook
 *
 * Manages question navigation state for exam taking.
 *
 * @see VIBE-0004D
 */

import { useState, useCallback } from 'react'

interface UseExamNavigationOptions {
    totalQuestions: number
    initialIndex?: number
}

interface UseExamNavigationReturn {
    currentIndex: number
    flaggedQuestions: Set<string>
    goToQuestion: (index: number) => void
    nextQuestion: () => void
    prevQuestion: () => void
    toggleFlag: (questionId: string) => void
    isFirstQuestion: boolean
    isLastQuestion: boolean
    isFlagged: (questionId: string) => boolean
}

export function useExamNavigation({
    totalQuestions,
    initialIndex = 0,
}: UseExamNavigationOptions): UseExamNavigationReturn {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())

    const goToQuestion = useCallback(
        (index: number) => {
            if (index >= 0 && index < totalQuestions) {
                setCurrentIndex(index)
            }
        },
        [totalQuestions]
    )

    const nextQuestion = useCallback(() => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }, [currentIndex, totalQuestions])

    const prevQuestion = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }, [currentIndex])

    const toggleFlag = useCallback((questionId: string) => {
        setFlaggedQuestions((prev) => {
            const newFlagged = new Set(prev)
            if (newFlagged.has(questionId)) {
                newFlagged.delete(questionId)
            } else {
                newFlagged.add(questionId)
            }
            return newFlagged
        })
    }, [])

    const isFlagged = useCallback(
        (questionId: string) => flaggedQuestions.has(questionId),
        [flaggedQuestions]
    )

    return {
        currentIndex,
        flaggedQuestions,
        goToQuestion,
        nextQuestion,
        prevQuestion,
        toggleFlag,
        isFirstQuestion: currentIndex === 0,
        isLastQuestion: currentIndex === totalQuestions - 1,
        isFlagged,
    }
}
