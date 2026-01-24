/**
 * QuestionResultList Component
 *
 * Renders a list of question results for exam review.
 *
 * @see VIBE-0004C
 */

import type { QuestionResult } from '@/features/exam-mode/types'
import { QuestionResultCard } from './QuestionResultCard'

interface QuestionResultListProps {
    results: QuestionResult[]
    showFeedback?: boolean
}

export function QuestionResultList({ results, showFeedback = true }: QuestionResultListProps) {
    if (!showFeedback || results.length === 0) {
        return null
    }

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#8C1515' }}>
                <svg className="w-6 h-6 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Question Review
            </h2>

            <div className="space-y-6">
                {results.map((result, index) => (
                    <QuestionResultCard
                        key={result.questionId}
                        result={result}
                        questionNumber={index + 1}
                    />
                ))}
            </div>
        </div>
    )
}
