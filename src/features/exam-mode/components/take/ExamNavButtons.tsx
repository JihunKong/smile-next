/**
 * ExamNavButtons Component
 *
 * Navigation buttons for moving between questions.
 *
 * @see VIBE-0004D
 */

interface ExamNavButtonsProps {
    isFirstQuestion: boolean
    isLastQuestion: boolean
    answeredCount: number
    totalQuestions: number
    onPrevious: () => void
    onNext: () => void
    onSubmit: () => void
}

export function ExamNavButtons({
    isFirstQuestion,
    isLastQuestion,
    answeredCount,
    totalQuestions,
    onPrevious,
    onNext,
    onSubmit,
}: ExamNavButtonsProps) {
    return (
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={onPrevious}
                    disabled={isFirstQuestion}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                </button>

                <div className="flex-1 mx-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">Progress</p>
                    <div className="bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-green-500 h-3 rounded-full transition-all"
                            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {answeredCount} of {totalQuestions} answered
                    </p>
                </div>

                <button
                    onClick={onNext}
                    disabled={isLastQuestion}
                    className={`font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2 ${isLastQuestion
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    Next
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
