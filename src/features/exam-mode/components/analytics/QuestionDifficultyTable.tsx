/**
 * QuestionDifficultyTable Component
 *
 * Displays question difficulty analysis with success rates,
 * difficulty badges, and most common wrong answers.
 *
 * @see VIBE-0004C
 */

import type { QuestionAnalytics } from '@/features/exam-mode/types'

interface QuestionDifficultyTableProps {
    analytics: QuestionAnalytics[]
}

export function QuestionDifficultyTable({ analytics }: QuestionDifficultyTableProps) {
    if (analytics.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <i className="fas fa-brain mr-2 text-red-700"></i>
                    Question Difficulty Analysis
                </h2>
                <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-inbox text-4xl mb-3"></i>
                    <p>No question data available yet</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <i className="fas fa-brain mr-2 text-red-700"></i>
                Question Difficulty Analysis
                <span className="ml-3 text-sm font-normal text-gray-600">
                    (Sorted by difficulty - hardest first)
                </span>
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Question
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Success Rate
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Difficulty
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                                Responses
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                Most Common Wrong Answer
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {analytics.map((qa) => (
                            <tr
                                key={qa.questionId}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <td className="py-3 px-4">
                                    <div className="flex items-start">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold mr-3 flex-shrink-0 mt-1">
                                            {qa.questionNumber}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900 line-clamp-2">{qa.questionText}</p>
                                            <p className="text-xs text-green-600 mt-1">
                                                <i className="fas fa-check-circle mr-1"></i>
                                                Correct: {qa.correctAnswer}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span
                                            className={`text-lg font-bold ${qa.successRate >= 80
                                                    ? 'text-green-700'
                                                    : qa.successRate >= 50
                                                        ? 'text-yellow-500'
                                                        : 'text-red-700'
                                                }`}
                                        >
                                            {qa.successRate.toFixed(1)}%
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {qa.correctCount}/{qa.totalResponses}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {qa.difficulty === 'Easy' && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                            <i className="fas fa-smile mr-1"></i>Easy
                                        </span>
                                    )}
                                    {qa.difficulty === 'Medium' && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                            <i className="fas fa-meh mr-1"></i>Medium
                                        </span>
                                    )}
                                    {qa.difficulty === 'Difficult' && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                            <i className="fas fa-frown mr-1"></i>Difficult
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <div className="text-sm text-gray-700">
                                        <i className="fas fa-check text-green-600"></i> {qa.correctCount}
                                        <span className="mx-2 text-gray-400">|</span>
                                        <i className="fas fa-times text-red-600"></i> {qa.incorrectCount}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    {qa.mostCommonWrongAnswer ? (
                                        <div className="text-sm">
                                            <p className="text-gray-900">{qa.mostCommonWrongAnswer.answer}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {qa.mostCommonWrongAnswer.count} students (
                                                {qa.mostCommonWrongAnswer.percentage.toFixed(1)}%)
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">All answered correctly</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
