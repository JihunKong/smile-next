/**
 * QuestionResultCard Component
 *
 * Displays a single question result with answer choices,
 * correct/incorrect highlighting, and explanation.
 *
 * @see VIBE-0004C
 */

import type { QuestionResult } from '@/features/exam-mode/types'

interface QuestionResultCardProps {
    result: QuestionResult
    questionNumber: number
}

export function QuestionResultCard({ result, questionNumber }: QuestionResultCardProps) {
    // Render choice with proper styling
    const renderChoice = (
        choice: string,
        displayIndex: number,
        originalIndex: number
    ) => {
        const isCorrectAnswer = originalIndex === result.correctAnswerIndex
        const isStudentAnswer = originalIndex === result.studentAnswerIndex
        const letter = String.fromCharCode(65 + displayIndex)

        return (
            <div
                key={displayIndex}
                className={`flex items-start space-x-3 p-3 rounded-lg ${isCorrectAnswer
                        ? 'bg-green-100 border border-green-300'
                        : isStudentAnswer
                            ? 'bg-red-100 border border-red-300'
                            : 'bg-gray-50'
                    }`}
            >
                <span className="font-bold text-gray-700">{letter}.</span>
                <span className="flex-1 text-gray-800">{choice}</span>
                {isCorrectAnswer && (
                    <span className="text-green-600 font-semibold flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Correct Answer
                    </span>
                )}
                {isStudentAnswer && !isCorrectAnswer && (
                    <span className="text-red-600 font-semibold flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Your Answer
                    </span>
                )}
            </div>
        )
    }

    return (
        <div
            className={`border-l-4 ${result.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                } rounded-r-lg p-6`}
        >
            {/* Question Number and Status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-10 h-10 rounded-full ${result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                            } flex items-center justify-center`}
                    >
                        <span className="text-white font-bold">{questionNumber}</span>
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${result.isCorrect
                                ? 'bg-green-200 text-green-800'
                                : 'bg-red-200 text-red-800'
                            }`}
                    >
                        {result.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                </div>
            </div>

            {/* Question Content */}
            <div className="mb-4">
                <p className="text-lg text-gray-900 font-medium mb-4">{result.questionContent}</p>

                {/* Answer Choices */}
                <div className="space-y-2">
                    {result.shuffleMap ? (
                        // If shuffle map exists, show choices in shuffled order
                        result.shuffleMap.map((originalIndex, displayPosition) =>
                            renderChoice(result.choices[originalIndex], displayPosition, originalIndex)
                        )
                    ) : (
                        // No shuffle map, show in original order
                        result.choices.map((choice, choiceIndex) =>
                            renderChoice(choice, choiceIndex, choiceIndex)
                        )
                    )}
                </div>
            </div>

            {/* Explanation (if available) */}
            {result.explanation && (
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 mt-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Explanation
                    </p>
                    <p className="text-sm text-blue-800">{result.explanation}</p>
                </div>
            )}
        </div>
    )
}
