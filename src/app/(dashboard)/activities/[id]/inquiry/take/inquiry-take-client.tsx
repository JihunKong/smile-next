'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExamTimer } from '@/components/modes/ExamTimer'
import { submitInquiryQuestion, completeInquiryAttempt } from '../actions'

interface SubmittedQuestion {
  id: string
  content: string
  score: number | null
  bloomsLevel: string | null
  feedback: string | null
}

interface InquiryTakeClientProps {
  activityId: string
  activityName: string
  attemptId: string
  questionsRequired: number
  timePerQuestion: number
  keywordPool1: string[]
  keywordPool2: string[]
  passThreshold: number
  submittedQuestions: SubmittedQuestion[]
}

export function InquiryTakeClient({
  activityId,
  activityName,
  attemptId,
  questionsRequired,
  timePerQuestion,
  keywordPool1,
  keywordPool2,
  passThreshold,
  submittedQuestions: initialQuestions,
}: InquiryTakeClientProps) {
  const router = useRouter()
  const [submittedQuestions, setSubmittedQuestions] = useState<SubmittedQuestion[]>(initialQuestions)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [finalResults, setFinalResults] = useState<{
    passed: boolean
    averageScore: number
    questionsGenerated: number
  } | null>(null)

  const questionsRemaining = questionsRequired - submittedQuestions.length
  const isComplete = questionsRemaining <= 0

  const handleTimeUp = useCallback(() => {
    if (currentQuestion.trim()) {
      handleSubmitQuestion()
    } else {
      // Skip this question
      setTimerKey((k) => k + 1)
    }
  }, [currentQuestion])

  async function handleSubmitQuestion() {
    if (!currentQuestion.trim() || isSubmitting) return

    setIsSubmitting(true)

    const result = await submitInquiryQuestion(attemptId, currentQuestion)

    if (result.success && result.data) {
      const newQuestion: SubmittedQuestion = {
        id: result.data.questionId,
        content: currentQuestion,
        score: result.data.evaluation?.score || null,
        bloomsLevel: result.data.evaluation?.bloomsLevel || null,
        feedback: result.data.evaluation?.feedback || null,
      }
      setSubmittedQuestions([...submittedQuestions, newQuestion])
      setCurrentQuestion('')
      setTimerKey((k) => k + 1) // Reset timer
    } else {
      alert(result.error || 'Failed to submit question')
    }

    setIsSubmitting(false)
  }

  async function handleComplete() {
    setIsSubmitting(true)

    const result = await completeInquiryAttempt(attemptId)

    if (result.success && result.data) {
      setFinalResults(result.data)
      setShowResults(true)
    } else {
      alert(result.error || 'Failed to complete')
    }

    setIsSubmitting(false)
  }

  function getScoreColor(score: number | null): string {
    if (score === null) return 'text-gray-500'
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  function getBloomsBadgeColor(level: string | null): string {
    const colors: Record<string, string> = {
      remember: 'bg-gray-100 text-gray-700',
      understand: 'bg-blue-100 text-blue-700',
      apply: 'bg-green-100 text-green-700',
      analyze: 'bg-yellow-100 text-yellow-700',
      evaluate: 'bg-orange-100 text-orange-700',
      create: 'bg-purple-100 text-purple-700',
    }
    return colors[level || ''] || 'bg-gray-100 text-gray-700'
  }

  if (showResults && finalResults) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            finalResults.passed ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {finalResults.passed ? (
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>

          <h1 className={`text-2xl font-bold mb-2 ${finalResults.passed ? 'text-green-600' : 'text-yellow-600'}`}>
            {finalResults.passed ? 'Great Job!' : 'Good Effort!'}
          </h1>

          <p className="text-gray-600 mb-6">
            You generated {finalResults.questionsGenerated} questions with an average score of {finalResults.averageScore.toFixed(1)}.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-4xl font-bold mb-2" style={{ color: finalResults.passed ? '#16a34a' : '#ca8a04' }}>
              {finalResults.averageScore.toFixed(1)} / 10
            </div>
            <div className="text-gray-600">Average Score</div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/activities/${activityId}`}
              className="block w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              Back to Activity
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Inquiry Mode</p>
            <h1 className="font-semibold text-gray-900">{activityName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Question {submittedQuestions.length + 1} of {questionsRequired}
            </div>

            {!isComplete && (
              <ExamTimer
                key={timerKey}
                totalSeconds={timePerQuestion}
                onTimeUp={handleTimeUp}
                size="md"
              />
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Keyword Pools */}
        {(keywordPool1.length > 0 || keywordPool2.length > 0) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-yellow-100 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">Concept Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {keywordPool1.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-orange-100 rounded-lg p-4">
              <h3 className="font-medium text-orange-800 mb-2">Action Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {keywordPool2.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Question Input */}
        {!isComplete && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Generate Your Question
            </h2>

            <textarea
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Type your question here. Try to connect concepts from both keyword pools..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition resize-none"
            />

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">
                {currentQuestion.length} / 500 characters
              </span>
              <button
                onClick={handleSubmitQuestion}
                disabled={!currentQuestion.trim() || isSubmitting}
                className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Question'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Submitted Questions */}
        {submittedQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your Questions ({submittedQuestions.length}/{questionsRequired})
            </h2>

            <div className="space-y-4">
              {submittedQuestions.map((q, index) => (
                <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                          Q{index + 1}
                        </span>
                        {q.bloomsLevel && (
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getBloomsBadgeColor(q.bloomsLevel)}`}>
                            {q.bloomsLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800">{q.content}</p>
                      {q.feedback && (
                        <p className="text-sm text-gray-600 mt-2 italic">{q.feedback}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${getScoreColor(q.score)}`}>
                        {q.score !== null ? q.score.toFixed(1) : '-'}
                      </span>
                      <p className="text-xs text-gray-500">/ 10</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Complete Button */}
            {isComplete && (
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-4">
                  You have submitted all {questionsRequired} questions!
                </p>
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Processing...' : 'View Results'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
