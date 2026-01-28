'use client'

import type { SubmittedQuestion } from '../types'
import { getScoreColor, getScoreQualityLabel } from '../utils'
import { BloomsBadge } from './BloomsBadge'

interface QuestionSubmissionCardLabels {
  evaluating: string
  error: string
  outOf: string
  excellent: string
  good: string
  needsImprovement: string
}

interface QuestionSubmissionCardProps {
  question: SubmittedQuestion
  index: number
  showQualityLabel?: boolean
  labels?: QuestionSubmissionCardLabels
}

const defaultLabels: QuestionSubmissionCardLabels = {
  evaluating: 'Evaluating',
  error: 'Error',
  outOf: '/ 10',
  excellent: 'Excellent',
  good: 'Good',
  needsImprovement: 'Needs Improvement',
}

function getQualityLabel(score: number, labels: QuestionSubmissionCardLabels): string {
  if (score >= 8) return labels.excellent
  if (score >= 6) return labels.good
  return labels.needsImprovement
}

export function QuestionSubmissionCard({
  question,
  index,
  showQualityLabel = false,
  labels = defaultLabels,
}: QuestionSubmissionCardProps) {
  const isEvaluating = question.evaluationStatus === 'evaluating'
  const isError = question.evaluationStatus === 'error'
  const showFeedback = question.feedback && !isEvaluating

  const cardClasses = `border rounded-lg p-4 transition-all ${
    isEvaluating
      ? 'border-yellow-300 bg-yellow-50 animate-pulse'
      : isError
        ? 'border-red-300 bg-red-50'
        : 'border-gray-200'
  }`

  return (
    <div className={cardClasses}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Header with question number, status, and Bloom's level */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
              Q{index + 1}
            </span>

            {isEvaluating && (
              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {labels.evaluating}
              </span>
            )}

            {isError && (
              <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium">
                {labels.error}
              </span>
            )}

            {question.bloomsLevel && !isEvaluating && (
              <BloomsBadge level={question.bloomsLevel} />
            )}
          </div>

          {/* Question content */}
          <p className="text-gray-800">{question.content}</p>

          {/* Feedback section */}
          {showFeedback && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{question.feedback}</span>
              </p>
            </div>
          )}
        </div>

        {/* Score section */}
        <div className="text-right min-w-[60px]">
          {isEvaluating ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
              <p className="text-xs text-yellow-600 mt-1">{labels.evaluating}</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-600 mt-1">{labels.error}</p>
            </div>
          ) : (
            <>
              <span className={`text-2xl font-bold ${getScoreColor(question.score)}`}>
                {question.score !== null ? question.score.toFixed(1) : '-'}
              </span>
              <p className="text-xs text-gray-500">{labels.outOf}</p>
              {showQualityLabel && question.score !== null && (
                <div className={`mt-1 text-xs font-medium ${getScoreColor(question.score)}`}>
                  {getQualityLabel(question.score, labels)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
