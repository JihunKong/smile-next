/**
 * QuestionDisplay Component
 *
 * Displays the current question with answer choices.
 *
 * @see VIBE-0004D, VIBE-0010
 */

import type { Question } from '@/features/exam-mode/types'
import { AnswerChoice } from './AnswerChoice'

export interface QuestionDisplayLabels {
    of: string
    contentProtected: string
}

export const defaultQuestionDisplayLabels: QuestionDisplayLabels = {
    of: 'of',
    contentProtected: 'Content Protected',
}

interface QuestionDisplayProps {
    question: Question
    questionNumber: number
    totalQuestions: number
    selectedAnswer: string[]
    choiceShuffle: number[]
    isFlagged: boolean
    onSelectAnswer: (originalIndex: number) => void
    onToggleFlag: () => void
    labels?: Partial<QuestionDisplayLabels>
}

export function QuestionDisplay({
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    choiceShuffle,
    isFlagged,
    onSelectAnswer,
    onToggleFlag,
    labels: customLabels = {},
}: QuestionDisplayProps) {
    const labels = { ...defaultQuestionDisplayLabels, ...customLabels }

    return (
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6 exam-content relative">
            {/* Content Protection Notice */}
            <div className="absolute top-3 right-3 text-xs text-gray-400 opacity-50 pointer-events-none">
                {labels.contentProtected}
            </div>

            {/* Question Number Badge */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-600">{questionNumber}</span>
                    </div>
                    <span className="text-sm text-gray-500">{labels.of} {totalQuestions}</span>
                </div>
                <button
                    onClick={onToggleFlag}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                >
                    {isFlagged ? (
                        <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Question Content */}
            <div className="mb-8 question-text">
                <p className="text-xl text-gray-900 leading-relaxed" id="question-content" data-testid="question">
                    {question.content}
                </p>
            </div>

            {/* Answer Choices */}
            <div className="space-y-3" id="choices-container">
                {choiceShuffle.map((originalIndex, displayIndex) => {
                    const choice = question.choices[originalIndex]
                    const isSelected = selectedAnswer.includes(originalIndex.toString())
                    const letter = String.fromCharCode(65 + displayIndex)

                    return (
                        <AnswerChoice
                            key={displayIndex}
                            choice={choice}
                            letter={letter}
                            isSelected={isSelected}
                            onSelect={() => onSelectAnswer(originalIndex)}
                        />
                    )
                })}
            </div>
        </div>
    )
}
