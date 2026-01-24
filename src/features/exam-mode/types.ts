/**
 * Exam Mode Types
 *
 * Consolidated TypeScript types for the Exam Mode feature.
 * These types are shared across components, hooks, and server actions.
 *
 * @see VIBE-0004B
 */

// ============================================================================
// Core Exam Types
// ============================================================================

/** A single exam question with choices */
export interface Question {
    id: string
    content: string
    choices: string[]
    correctAnswerIndex?: number // Only for grading (server-side)
    explanation?: string | null // Shown after submission
}

/** An exam attempt record */
export interface ExamAttempt {
    id: string
    userId: string
    activityId: string
    status: 'in_progress' | 'completed' | 'abandoned'
    startedAt: Date
    completedAt?: Date | null
    score?: number | null
    passed?: boolean | null
    questionOrder: string[] // Order questions were shown
    choiceShuffles: Record<string, number[]> // Per-question choice mappings
    totalQuestions: number
    correctAnswers?: number | null
    timeSpentSeconds?: number | null
}

/** A saved answer for a question */
export interface ExamAnswer {
    attemptId: string
    questionId: string
    selectedChoices: string[] // Choice indices as strings
    answeredAt: Date
}

// ============================================================================
// Exam Settings
// ============================================================================

export interface ExamSettings {
    timeLimit?: number // Minutes
    questionsToShow?: number // Subset of questions
    passThreshold?: number // Percentage to pass
    shuffleQuestions?: boolean
    shuffleChoices?: boolean
    maxAttempts?: number
    showFeedback?: boolean // Show correct answers after
    showScore?: boolean
    showPassFail?: boolean
    showLeaderboard?: boolean
    enableAiCoaching?: boolean
}

// ============================================================================
// Take Experience Types
// ============================================================================

export interface ExamTakeClientProps {
    activityId: string
    activityName: string
    groupName: string
    attemptId: string
    questions: Question[]
    existingAnswers: Record<string, string[]>
    remainingSeconds: number
    totalQuestions: number
    timeLimitMinutes: number
    instructions?: string
    description?: string
    choiceShuffles?: Record<string, number[]>
}

// ============================================================================
// Results Types
// ============================================================================

export interface QuestionResult {
    questionId: string
    questionContent: string
    choices: string[]
    studentAnswerIndex: number | null
    correctAnswerIndex: number
    isCorrect: boolean
    explanation: string | null
    shuffleMap: number[] | null // For unshuffling display
}

export interface ExamResultSummary {
    score: number
    passed: boolean
    correctCount: number
    totalQuestions: number
    timeTakenMinutes: number
    submittedAt: Date
    feedback?: string
}

// ============================================================================
// Analytics Types (Teacher View)
// ============================================================================

export interface QuestionAnalytics {
    questionNumber: number
    questionId: string
    questionText: string
    correctAnswer: string
    successRate: number
    difficulty: 'Easy' | 'Medium' | 'Difficult'
    correctCount: number
    incorrectCount: number
    totalResponses: number
    mostCommonWrongAnswer: {
        answer: string
        count: number
        percentage: number
    } | null
}

export interface StudentPerformance {
    attemptId: string
    studentName: string
    studentEmail: string
    scorePercentage: number
    passed: boolean
    questionsCorrect: number
    questionsIncorrect: number
    timeTakenMinutes: number
    submittedAt: Date
}

export interface ExamAnalyticsSummary {
    totalAttempts: number
    averageScore: number
    passRate: number
    averageTimeTaken: number
    questionsAnalytics: QuestionAnalytics[]
    studentPerformances: StudentPerformance[]
}

// ============================================================================
// Server Action Result Types
// ============================================================================

export interface StartExamResult {
    attemptId: string
    questionOrder: string[]
    choiceShuffles: Record<string, number[]>
}

export interface SaveAnswerResult {
    success: boolean
}

export interface SubmitExamResult {
    score: number
    passed: boolean
    correctAnswers: number
    totalQuestions: number
}

export interface ExamAttemptStatus {
    status: 'not_started' | 'in_progress' | 'completed'
    attempt?: ExamAttempt
    remainingSeconds?: number
    attempts: ExamAttempt[]
    canRetake: boolean
}

// ============================================================================
// UI Component Props Types
// ============================================================================

export interface ExamTimerProps {
    totalSeconds: number
    onTimeUp: () => void
    warningThreshold?: number
    className?: string
}

export interface QuestionNavProps {
    totalQuestions: number
    currentIndex: number
    answeredQuestions: string[]
    flaggedQuestions?: Set<string>
    onSelect: (index: number) => void
}

export interface QuestionDisplayProps {
    question: Question
    questionNumber: number
    selectedAnswer: string[]
    onSelectAnswer: (choiceIndex: number) => void
    choiceShuffle?: number[]
}

export interface ExamScoreCardProps {
    result: ExamResultSummary
    showPassFail?: boolean
    showScore?: boolean
}

export interface QuestionResultCardProps {
    result: QuestionResult
    questionNumber: number
    showFeedback?: boolean
}
