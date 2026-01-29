/**
 * QuestionNav Component
 *
 * Displays question navigation dots/buttons with status indicators.
 *
 * @see VIBE-0004D, VIBE-0010
 */

export interface QuestionNavLabels {
    progress: string
    of: string
    answered: string
    questionTitle: string
    flagged: string
}

export const defaultQuestionNavLabels: QuestionNavLabels = {
    progress: 'Progress',
    of: 'of',
    answered: 'answered',
    questionTitle: 'Question',
    flagged: '(Flagged)',
}

interface QuestionNavProps {
    questions: { id: string }[]
    currentIndex: number
    answers: Record<string, string[]>
    flaggedQuestions: Set<string>
    onSelectQuestion: (index: number) => void
    labels?: Partial<QuestionNavLabels>
}

export function QuestionNav({
    questions,
    currentIndex,
    answers,
    flaggedQuestions,
    onSelectQuestion,
    labels: customLabels = {},
}: QuestionNavProps) {
    const labels = { ...defaultQuestionNavLabels, ...customLabels }
    const answeredCount = Object.keys(answers).filter((qId) => answers[qId]?.length > 0).length

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">{labels.progress}</span>
                    <span>
                        <span className="font-semibold">{answeredCount}</span>{' '}
                        {labels.of} {questions.length} {labels.answered}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{
                            width: `${(answeredCount / questions.length) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* Question Navigator */}
            <div className="flex flex-wrap gap-2">
                {questions.map((q, index) => {
                    const isAnswered = answers[q.id]?.length > 0
                    const isFlagged = flaggedQuestions.has(q.id)
                    const isCurrent = index === currentIndex

                    return (
                        <button
                            key={q.id}
                            onClick={() => onSelectQuestion(index)}
                            className={`w-10 h-10 rounded-full border-2 transition-colors flex items-center justify-center text-sm font-medium ${isCurrent
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : isAnswered
                                        ? 'bg-green-500 text-white border-green-600'
                                        : 'bg-yellow-100 text-yellow-800 border-yellow-400'
                                }`}
                            title={`${labels.questionTitle} ${index + 1}${isFlagged ? ` ${labels.flagged}` : ''}`}
                        >
                            {index + 1}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
