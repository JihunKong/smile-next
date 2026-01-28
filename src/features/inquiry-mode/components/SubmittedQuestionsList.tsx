'use client'

import type { SubmittedQuestion } from '../types'
import { QuestionSubmissionCard } from './QuestionSubmissionCard'
import { CompletionPrompt } from './CompletionPrompt'
import { calculateAverageScore } from '../utils'

interface SubmittedQuestionsListProps {
  questions: SubmittedQuestion[]
  questionsRequired: number
  isComplete: boolean
  isSubmitting: boolean
  onComplete: () => void
  labels: {
    title: string
    averageScore: string
    card: {
      evaluating: string
      error: string
      outOf: string
      excellent: string
      good: string
      needsImprovement: string
    }
    complete: {
      title: string
      description: string
      processing: string
      button: string
    }
  }
}

export function SubmittedQuestionsList({
  questions,
  questionsRequired,
  isComplete,
  isSubmitting,
  onComplete,
  labels,
}: SubmittedQuestionsListProps) {
  if (questions.length === 0) {
    return null
  }

  const averageScore = calculateAverageScore(questions.map(q => q.score))

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {labels.title
            .replace('{count}', String(questions.length))
            .replace('{total}', String(questionsRequired))}
        </h2>
        {questions.length > 0 && (
          <div className="text-sm text-gray-500">
            {labels.averageScore}{' '}
            <span className="font-semibold text-gray-900">
              {averageScore.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionSubmissionCard
            key={question.id}
            question={question}
            index={index}
            showQualityLabel
            labels={labels.card}
          />
        ))}
      </div>

      {isComplete && (
        <CompletionPrompt
          questionsRequired={questionsRequired}
          isSubmitting={isSubmitting}
          onComplete={onComplete}
          labels={labels.complete}
        />
      )}
    </div>
  )
}
