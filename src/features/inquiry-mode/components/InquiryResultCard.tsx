'use client'

import type { QuestionWithEvaluation, EnhancedQuestion } from '../types'
import { getScoreColor } from '../utils'
import { BloomsBadge } from './BloomsBadge'

interface InquiryResultCardProps {
  question: QuestionWithEvaluation
  index: number
}

export function InquiryResultCard({
  question,
  index,
}: InquiryResultCardProps) {
  const { evaluation } = question
  const hasStrengths = evaluation && Array.isArray(evaluation.strengths) && evaluation.strengths.length > 0
  const hasImprovements = evaluation && Array.isArray(evaluation.improvements) && evaluation.improvements.length > 0
  const hasEnhancedQuestions = evaluation && Array.isArray(evaluation.enhancedQuestions) && evaluation.enhancedQuestions.length > 0

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
            Q{index + 1}
          </span>
          {evaluation?.bloomsLevel && (
            <BloomsBadge level={evaluation.bloomsLevel} />
          )}
        </div>
        {evaluation && (
          <div className="text-right">
            <span className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
              {evaluation.overallScore.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500"> / 10</span>
          </div>
        )}
      </div>

      {/* Question Content */}
      <p className="text-gray-800 mb-4">{question.content}</p>

      {/* Dimension Scores */}
      {evaluation && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <DimensionScore label="Creativity" score={evaluation.creativityScore} />
          <DimensionScore label="Clarity" score={evaluation.clarityScore} />
          <DimensionScore label="Relevance" score={evaluation.relevanceScore} />
          <DimensionScore label="Innovation" score={evaluation.innovationScore} />
        </div>
      )}

      {/* AI Feedback */}
      {evaluation?.evaluationText && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <h4 className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Feedback
          </h4>
          <p className="text-sm text-blue-700">{evaluation.evaluationText}</p>
        </div>
      )}

      {/* Strengths & Improvements */}
      {(hasStrengths || hasImprovements) && (
        <div className="grid grid-cols-2 gap-3">
          {hasStrengths && (
            <div className="bg-green-50 rounded p-3">
              <h4 className="text-xs font-medium text-green-800 mb-1">Strengths</h4>
              <ul className="text-xs text-green-700 space-y-0.5">
                {(evaluation!.strengths as string[]).slice(0, 3).map((s, i) => (
                  <li key={i}>+ {s}</li>
                ))}
              </ul>
            </div>
          )}
          {hasImprovements && (
            <div className="bg-orange-50 rounded p-3">
              <h4 className="text-xs font-medium text-orange-800 mb-1">Improvements</h4>
              <ul className="text-xs text-orange-700 space-y-0.5">
                {(evaluation!.improvements as string[]).slice(0, 3).map((s, i) => (
                  <li key={i}>- {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Questions */}
      {hasEnhancedQuestions && (
        <div className="mt-3 bg-purple-50 rounded p-3">
          <h4 className="text-xs font-medium text-purple-800 mb-1">
            Try These Higher-Level Questions
          </h4>
          <ul className="text-xs text-purple-700 space-y-1">
            {(evaluation!.enhancedQuestions as EnhancedQuestion[]).slice(0, 2).map((eq, i) => (
              <li key={i}>
                <span className="font-medium capitalize">[{eq.level}]</span> {eq.question}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DimensionScore({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded">
      <div className={`font-medium ${getScoreColor(score)}`}>
        {(score || 0).toFixed(1)}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
