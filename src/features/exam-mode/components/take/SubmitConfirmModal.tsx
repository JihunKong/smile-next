/**
 * SubmitConfirmModal Component
 *
 * Modal for confirming exam submission with summary statistics.
 *
 * @see VIBE-0004D
 */

interface SubmitConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    answeredCount: number
    totalQuestions: number
    flaggedCount: number
    remainingTime: string
    isSubmitting: boolean
}

export function SubmitConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    answeredCount,
    totalQuestions,
    flaggedCount,
    remainingTime,
    isSubmitting,
}: SubmitConfirmModalProps) {
    const unansweredCount = totalQuestions - answeredCount

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 z-[99999]"
            style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 animate-modal-appear">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Exam?</h2>
                    <p className="text-gray-600">Are you sure you want to submit? This action cannot be undone.</p>
                </div>

                {/* Unanswered Questions Warning Banner */}
                {unansweredCount > 0 && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="font-bold text-yellow-800">Warning: Unanswered Questions</p>
                                <p className="text-sm text-yellow-700">
                                    You have <span className="font-bold">{unansweredCount}</span> unanswered question(s).
                                    <strong> They will be marked as incorrect.</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submission Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Questions:</span>
                        <span className="font-semibold">{totalQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Answered:</span>
                        <span className="font-semibold text-green-600">{answeredCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Unanswered:</span>
                        <span className="font-semibold text-red-600">{unansweredCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Flagged for Review:</span>
                        <span className="font-semibold text-yellow-600">{flaggedCount}</span>
                    </div>
                </div>

                <p className="text-xs text-gray-500 text-center mb-6">
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time Remaining: <span className="font-semibold">{remainingTime}</span>
                </p>

                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all pulse-grow disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {unansweredCount > 0 ? `Submit with ${unansweredCount} Unanswered` : 'Submit'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
