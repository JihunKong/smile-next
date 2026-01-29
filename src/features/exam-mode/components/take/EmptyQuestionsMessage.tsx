/**
 * EmptyQuestionsMessage Component
 *
 * Displayed when an exam has no questions available.
 *
 * @see VIBE-0010
 */

import Link from 'next/link'

export interface EmptyQuestionsMessageLabels {
  title: string
  message: string
  backToExam: string
  backToActivity: string
}

export const defaultEmptyQuestionsMessageLabels: EmptyQuestionsMessageLabels = {
  title: 'No Questions Available',
  message: 'This exam has no questions available. Please contact your instructor.',
  backToExam: 'Back to Exam Overview',
  backToActivity: 'Back to Activity',
}

interface EmptyQuestionsMessageProps {
  activityId: string
  labels?: Partial<EmptyQuestionsMessageLabels>
}

export function EmptyQuestionsMessage({
  activityId,
  labels: customLabels = {},
}: EmptyQuestionsMessageProps) {
  const labels = { ...defaultEmptyQuestionsMessageLabels, ...customLabels }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 bg-red-100">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-red-600 mb-2">{labels.title}</h1>

        <p className="text-gray-600 mb-6">{labels.message}</p>

        <div className="space-y-3">
          <Link
            href={`/activities/${activityId}/exam`}
            className="block w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
            style={{ backgroundColor: '#8C1515' }}
          >
            {labels.backToExam}
          </Link>
          <Link
            href={`/activities/${activityId}`}
            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            {labels.backToActivity}
          </Link>
        </div>
      </div>
    </div>
  )
}
