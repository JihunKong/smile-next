/**
 * ExamTimer Component
 *
 * Displays the exam countdown timer with visual indicators for warning states.
 *
 * @see VIBE-0004D, VIBE-0010
 */

export interface ExamTimerLabels {
    timeRemaining: string
    question: string
    of: string
}

export const defaultExamTimerLabels: ExamTimerLabels = {
    timeRemaining: 'Time Remaining',
    question: 'Question',
    of: 'of',
}

interface ExamTimerProps {
    formattedTime: string
    remainingSeconds: number
    timerPercentage: number
    isWarning?: boolean
    isCritical?: boolean
    questionNumber: number
    totalQuestions: number
    labels?: Partial<ExamTimerLabels>
}

export function ExamTimer({
    formattedTime,
    remainingSeconds,
    timerPercentage,
    isWarning = false,
    isCritical = false,
    questionNumber,
    totalQuestions,
    labels: customLabels = {},
}: ExamTimerProps) {
    const labels = { ...defaultExamTimerLabels, ...customLabels }

    const timerColorClass = isCritical
        ? 'text-red-600'
        : isWarning
            ? 'text-yellow-600'
            : 'text-red-600'

    const progressColorClass = isCritical
        ? 'bg-red-600'
        : isWarning
            ? 'bg-yellow-500'
            : 'bg-red-600'

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b-4 border-red-500 px-4 py-3">
            <div className="container mx-auto max-w-4xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <svg className={`w-8 h-8 ${timerColorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <div className="text-xs text-gray-500">{labels.timeRemaining}</div>
                            <div className={`text-2xl font-bold ${timerColorClass}`}>
                                {formattedTime}
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600">
                        {labels.question} <span className="font-semibold">{questionNumber}</span> {labels.of} <span>{totalQuestions}</span>
                    </div>
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${progressColorClass}`}
                        style={{ width: `${timerPercentage}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
