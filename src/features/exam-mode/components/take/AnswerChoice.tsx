/**
 * AnswerChoice Component
 *
 * Displays a single answer choice with selection state styling.
 *
 * @see VIBE-0004D
 */

interface AnswerChoiceProps {
    choice: string
    letter: string
    isSelected: boolean
    onSelect: () => void
}

export function AnswerChoice({
    choice,
    letter,
    isSelected,
    onSelect,
}: AnswerChoiceProps) {
    return (
        <button
            onClick={onSelect}
            className={`answer-choice w-full text-left border-2 rounded-lg p-4 cursor-pointer transition-all ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
        >
            <div className="flex items-center space-x-3">
                <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}
                >
                    {isSelected ? (
                        <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    ) : null}
                </div>
                <div className="flex-1 choice-text">
                    <span className="font-medium text-gray-900">{letter}.</span>
                    <span className="text-gray-800 ml-2">{choice}</span>
                </div>
            </div>
        </button>
    )
}
