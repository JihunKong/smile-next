/**
 * ExamFeedback Component
 *
 * Displays the AI Coaching feedback section for exam results.
 * Shows personalized guidance based on performance.
 *
 * @see VIBE-0004C
 */

interface ExamFeedbackProps {
    enabled: boolean
    feedback?: string | null
}

export function ExamFeedback({ enabled, feedback }: ExamFeedbackProps) {
    if (!enabled) return null

    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-2xl p-8 mb-6 border-2 border-purple-300">
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        AI Coaching Feedback
                    </h2>
                    <p className="text-gray-600">Personalized guidance based on your performance</p>
                </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-inner">
                {feedback ? (
                    <p className="text-gray-700">{feedback}</p>
                ) : (
                    <p className="text-gray-600 text-center">
                        AI coaching feedback will be generated here based on your exam performance.
                    </p>
                )}
            </div>
        </div>
    )
}
