/**
 * ExamScoreCard Component
 *
 * Displays the exam score with pass/fail status and visual indicators.
 * Used on the exam results page.
 *
 * @see VIBE-0004C
 */

interface ExamScoreCardProps {
    score: number
    passed: boolean
    activityName: string
    showPassFail?: boolean
    showScore?: boolean
}

export function ExamScoreCard({
    score,
    passed,
    activityName,
    showPassFail = true,
    showScore = true,
}: ExamScoreCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            {/* Pass/Fail Status */}
            {showPassFail && (
                <div className="text-center mb-8">
                    <div
                        className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'
                            }`}
                    >
                        {passed ? (
                            <svg className="w-16 h-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-16 h-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <h1 className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                        {passed ? 'Congratulations!' : 'Keep Trying!'}
                    </h1>
                    <p className="text-xl text-gray-600">{activityName}</p>
                </div>
            )}

            {!showPassFail && (
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                        <svg className="w-16 h-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-2 text-blue-600">Exam Submitted!</h1>
                    <p className="text-xl text-gray-600">{activityName}</p>
                </div>
            )}

            {/* Score Display */}
            {showScore && (
                <div className="text-center mb-8">
                    <div
                        className="inline-block rounded-lg p-8 shadow-lg"
                        style={{
                            backgroundColor: showPassFail ? (passed ? '#047857' : '#dc2626') : '#1e40af',
                            border: `3px solid ${showPassFail ? (passed ? '#065f46' : '#991b1b') : '#1e3a8a'}`,
                        }}
                    >
                        <div className="text-6xl font-bold text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                            {score.toFixed(1)}%
                        </div>
                        <div className="text-lg text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                            Your Score
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
