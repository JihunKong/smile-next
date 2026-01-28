'use client'

import Link from 'next/link'
import type { InquiryCompletionResult } from '../types'

interface InquiryCompletionModalProps {
  result: InquiryCompletionResult
  activityId: string
  attemptId: string
  labels: {
    greatJob: string
    goodEffort: string
    summary: string
    averageScore: string
    viewResults: string
    backToActivity: string
  }
}

export function InquiryCompletionModal({
  result,
  activityId,
  attemptId,
  labels,
}: InquiryCompletionModalProps) {
  const { passed, averageScore, questionsGenerated } = result

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
          passed ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {passed ? (
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-yellow-600'}`}>
          {passed ? labels.greatJob : labels.goodEffort}
        </h1>

        {/* Summary */}
        <p className="text-gray-600 mb-6">
          {labels.summary.replace('{count}', String(questionsGenerated)).replace('{score}', averageScore.toFixed(1))}
        </p>

        {/* Score Display */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-4xl font-bold mb-2" style={{ color: passed ? '#16a34a' : '#ca8a04' }}>
            {averageScore.toFixed(1)} / 10
          </div>
          <div className="text-gray-600">{labels.averageScore}</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href={`/activities/${activityId}/inquiry/${attemptId}/results`}
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {labels.viewResults}
          </Link>
          <Link
            href={`/activities/${activityId}`}
            className="block w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          >
            {labels.backToActivity}
          </Link>
        </div>
      </div>
    </div>
  )
}
