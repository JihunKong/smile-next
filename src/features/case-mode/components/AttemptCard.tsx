'use client'

import Link from 'next/link'

interface CaseResponse {
  understanding_score: number
  ingenuity_score: number
  critical_thinking_score: number
  real_world_score: number
}

interface Attempt {
  id: string
  attempt_number: number
  total_score: number
  passed: boolean
  started_at: string
  submitted_at: string
  responses: CaseResponse[]
}

interface AttemptCardProps {
  attempt: Attempt
  activityId: string
  isBest: boolean
}

function calculateAvgCriteria(responses: CaseResponse[], field: keyof CaseResponse): string {
  if (!responses || responses.length === 0) return 'N/A'
  const sum = responses.reduce((acc, resp) => acc + (resp[field] || 0), 0)
  return (sum / responses.length).toFixed(1)
}

export function AttemptCard({ attempt, activityId, isBest }: AttemptCardProps) {
  const startDate = new Date(attempt.started_at)
  const submitDate = new Date(attempt.submitted_at)
  const timeSpent = Math.round((submitDate.getTime() - startDate.getTime()) / 1000)
  const minutes = Math.floor(timeSpent / 60)
  const seconds = timeSpent % 60

  return (
    <div
      className={`border rounded-lg p-6 ${
        attempt.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-900">
            Attempt {attempt.attempt_number}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              attempt.passed
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <i className={`fas fa-${attempt.passed ? 'check' : 'times'}-circle mr-1`}></i>
            {attempt.passed ? 'Passed' : 'Not Passed'}
          </span>
          {isBest && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold ml-2">
              <i className="fas fa-star mr-1"></i>Best
            </span>
          )}
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
            {attempt.total_score.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">out of 10.0</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-600">Understanding</p>
          <p className="font-semibold text-yellow-700">
            {calculateAvgCriteria(attempt.responses, 'understanding_score')}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Ingenuity</p>
          <p className="font-semibold text-purple-700">
            {calculateAvgCriteria(attempt.responses, 'ingenuity_score')}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Critical Thinking</p>
          <p className="font-semibold text-blue-700">
            {calculateAvgCriteria(attempt.responses, 'critical_thinking_score')}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Real-World</p>
          <p className="font-semibold text-green-700">
            {calculateAvgCriteria(attempt.responses, 'real_world_score')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
        <div className="flex items-center gap-4">
          <span>
            <i className="fas fa-calendar mr-1"></i>
            {submitDate.toLocaleDateString()}
          </span>
          <span>
            <i className="fas fa-clock mr-1"></i>
            {minutes}m {seconds}s
          </span>
          <span>
            <i className="fas fa-clipboard-list mr-1"></i>
            {attempt.responses?.length || 0} cases
          </span>
        </div>
        <Link
          href={`/activities/${activityId}/case/${attempt.id}/results`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
          style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
        >
          View Details
          <i className="fas fa-arrow-right ml-2"></i>
        </Link>
      </div>
    </div>
  )
}
