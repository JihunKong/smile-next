/**
 * useExamAttempt Hook
 *
 * Orchestrates the exam taking experience by combining timer,
 * navigation, and answer management.
 *
 * @see VIBE-0004D
 */

import { useState, useCallback, useRef } from 'react'
import { useExamTimer } from './useExamTimer'
import { useExamNavigation } from './useExamNavigation'
import type { Question, ExamTakeClientProps } from '../types'

interface UseExamAttemptOptions {
    attemptId: string
    activityId: string
    questions: Question[]
    existingAnswers: Record<string, string[]>
    remainingSeconds: number
    timeLimitMinutes: number
    choiceShuffles?: Record<string, number[]>
    saveAnswer: (attemptId: string, questionId: string, answer: string[]) => Promise<void>
    submitExam: (attemptId: string) => Promise<{ success: boolean; error?: string }>
}

interface UseExamAttemptReturn {
    // Current question
    currentQuestion: Question | null
    currentAnswer: string[]
    questionNumber: number

    // State
    answers: Record<string, string[]>
    answeredCount: number

    // Actions
    setAnswer: (questionId: string, choiceIndex: number) => Promise<void>
    handleSubmit: () => Promise<void>

    // Status
    isSaving: boolean
    isSubmitting: boolean

    // Timer
    timer: ReturnType<typeof useExamTimer>

    // Navigation
    navigation: ReturnType<typeof useExamNavigation>

    // Choice shuffles
    getChoiceShuffle: (questionId: string) => number[]
}

export function useExamAttempt({
    attemptId,
    activityId,
    questions,
    existingAnswers,
    remainingSeconds,
    timeLimitMinutes,
    choiceShuffles = {},
    saveAnswer,
    submitExam,
}: UseExamAttemptOptions): UseExamAttemptReturn {
    const [answers, setAnswers] = useState<Record<string, string[]>>(existingAnswers)
    const [isSaving, setIsSaving] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Navigation hook
    const navigation = useExamNavigation({
        totalQuestions: questions.length,
    })

    // Submit handler (will be passed to timer)
    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await submitExam(attemptId)
            if (!result.success) {
                alert(result.error || 'Failed to submit exam')
                setIsSubmitting(false)
            }
            // Navigation to results page is handled by caller
        } catch (error) {
            console.error('Error submitting exam:', error)
            alert('Failed to submit exam. Please try again.')
            setIsSubmitting(false)
        }
    }, [attemptId, isSubmitting, submitExam])

    // Timer hook
    const timer = useExamTimer({
        initialSeconds: remainingSeconds,
        warningThreshold: 60,
        criticalThreshold: 30,
        onTimeUp: handleSubmit,
    })

    // Current question
    const safeCurrentIndex = Math.min(navigation.currentIndex, questions.length - 1)
    const currentQuestion = questions.length > 0 ? questions[safeCurrentIndex] : null
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] || [] : []

    // Set answer with debounced save
    const setAnswerFn = useCallback(
        async (questionId: string, choiceIndex: number) => {
            const newAnswers = { ...answers, [questionId]: [choiceIndex.toString()] }
            setAnswers(newAnswers)

            // Clear pending save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }

            // Debounced save (immediate for better UX)
            saveTimeoutRef.current = setTimeout(async () => {
                setIsSaving(true)
                try {
                    await saveAnswer(attemptId, questionId, [choiceIndex.toString()])
                } catch (error) {
                    console.error('Error saving answer:', error)
                } finally {
                    setIsSaving(false)
                }
            }, 100) // Quick debounce for immediate save
        },
        [answers, attemptId, saveAnswer]
    )

    // Get choice shuffle for a question
    const getChoiceShuffle = useCallback(
        (questionId: string): number[] => {
            return (
                choiceShuffles[questionId] ||
                (currentQuestion
                    ? Array.from({ length: currentQuestion.choices.length }, (_, i) => i)
                    : [])
            )
        },
        [choiceShuffles, currentQuestion]
    )

    // Count answered questions
    const answeredCount = Object.keys(answers).filter((qId) => answers[qId]?.length > 0).length

    return {
        // Current question
        currentQuestion,
        currentAnswer,
        questionNumber: navigation.currentIndex + 1,

        // State
        answers,
        answeredCount,

        // Actions
        setAnswer: setAnswerFn,
        handleSubmit,

        // Status
        isSaving,
        isSubmitting,

        // Timer
        timer,

        // Navigation
        navigation,

        // Choice shuffles
        getChoiceShuffle,
    }
}
