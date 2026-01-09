'use client'

interface CriteriaScore {
  score: number
  feedback: string
}

interface ParsedFeedback {
  understanding?: CriteriaScore
  ingenuity?: CriteriaScore
  critical_thinking?: CriteriaScore
  real_world?: CriteriaScore
  what_was_done_well?: string
  what_could_improve?: string
  suggestions?: string
  average_score?: number
}

interface AIFeedbackDisplayProps {
  feedbackJson: string
  compact?: boolean
}

function parseAIFeedback(feedbackString: string): ParsedFeedback | null {
  try {
    const parsed = JSON.parse(feedbackString)
    return parsed
  } catch {
    return null
  }
}

function hasValidContent(feedback: ParsedFeedback): boolean {
  // Check if there's any meaningful content to display
  const hasScores = Boolean(
    (feedback.understanding?.score && feedback.understanding.score > 0) ||
    (feedback.ingenuity?.score && feedback.ingenuity.score > 0) ||
    (feedback.critical_thinking?.score && feedback.critical_thinking.score > 0) ||
    (feedback.real_world?.score && feedback.real_world.score > 0)
  )

  const hasFeedbackText = Boolean(
    (feedback.what_was_done_well && feedback.what_was_done_well.trim().length > 0) ||
    (feedback.what_could_improve && feedback.what_could_improve.trim().length > 0)
  )

  return hasScores || hasFeedbackText
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-blue-600'
  if (score >= 4) return 'text-yellow-600'
  return 'text-gray-400'
}

export function AIFeedbackDisplay({ feedbackJson, compact = true }: AIFeedbackDisplayProps) {
  const parsed = parseAIFeedback(feedbackJson)

  // If parsing failed or no valid content, don't render anything
  if (!parsed || !hasValidContent(parsed)) {
    return null
  }

  const criteriaLabels: Record<string, string> = {
    understanding: 'Understanding',
    ingenuity: 'Ingenuity',
    critical_thinking: 'Critical Thinking',
    real_world: 'Real-World Application'
  }

  const criteria = ['understanding', 'ingenuity', 'critical_thinking', 'real_world'] as const

  if (compact) {
    // Compact view: just show average score and brief summary
    return (
      <div className="mt-2 text-xs border-t border-gray-200 pt-2">
        <div className="flex items-center gap-2 text-gray-600">
          <span className="font-medium">AI Evaluation:</span>
          {parsed.average_score !== undefined && parsed.average_score > 0 ? (
            <span className={`font-semibold ${getScoreColor(parsed.average_score)}`}>
              {parsed.average_score.toFixed(1)}/10
            </span>
          ) : null}
        </div>

        {/* Show brief summary if available */}
        {parsed.what_was_done_well && parsed.what_was_done_well.trim() && (
          <p className="mt-1 text-gray-500 italic line-clamp-2">
            {parsed.what_was_done_well}
          </p>
        )}
      </div>
    )
  }

  // Full view: show all criteria and feedback
  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
        <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        AI Evaluation
      </h4>

      {/* 4-Criteria Scores Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {criteria.map((key) => {
          const criterion = parsed[key]
          if (!criterion || criterion.score === 0) return null

          return (
            <div key={key} className="bg-gray-100 rounded px-2 py-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">{criteriaLabels[key]}</span>
                <span className={`text-sm font-semibold ${getScoreColor(criterion.score)}`}>
                  {criterion.score.toFixed(1)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Average Score */}
      {parsed.average_score !== undefined && parsed.average_score > 0 && (
        <div className="flex items-center gap-2 mb-2 text-sm">
          <span className="text-gray-600">Average Score:</span>
          <span className={`font-bold ${getScoreColor(parsed.average_score)}`}>
            {parsed.average_score.toFixed(1)}/10
          </span>
        </div>
      )}

      {/* What was done well */}
      {parsed.what_was_done_well && parsed.what_was_done_well.trim() && (
        <div className="mb-2">
          <span className="text-xs font-medium text-green-700">Strengths:</span>
          <p className="text-xs text-gray-600 mt-0.5">{parsed.what_was_done_well}</p>
        </div>
      )}

      {/* What could improve */}
      {parsed.what_could_improve && parsed.what_could_improve.trim() && (
        <div className="mb-2">
          <span className="text-xs font-medium text-amber-700">Areas for Improvement:</span>
          <p className="text-xs text-gray-600 mt-0.5">{parsed.what_could_improve}</p>
        </div>
      )}

      {/* Suggestions */}
      {parsed.suggestions && parsed.suggestions.trim() && (
        <div>
          <span className="text-xs font-medium text-blue-700">Suggestions:</span>
          <p className="text-xs text-gray-600 mt-0.5">{parsed.suggestions}</p>
        </div>
      )}
    </div>
  )
}
