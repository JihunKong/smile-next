// CaseResultCard Component
// Displays an individual case result with scenario, response, feedback, and scores
// Used in results page to show each case scenario result

import type { CaseScenario, ScenarioResponse, ScenarioEvaluation } from '../types'
import { getScoreColor, getScoreBgColor } from './ScoreDisplay'

// ============================================================================
// Icons
// ============================================================================

const CheckIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LightbulbIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

// ============================================================================
// CaseResultCard Component
// ============================================================================

export interface CaseResultCardProps {
  /** The case scenario definition */
  scenario: CaseScenario
  /** The student's response to the scenario */
  response: ScenarioResponse
  /** The AI evaluation of the response */
  evaluation: ScenarioEvaluation
  /** The 1-based index of this case (for display) */
  index: number
}

/**
 * Displays a single case result including:
 * - Scenario content
 * - Student's identified issues and proposed solutions
 * - AI feedback (strengths, improvements, suggestions)
 * - Individual criterion scores
 */
export function CaseResultCard({
  scenario,
  response,
  evaluation,
  index,
}: CaseResultCardProps) {
  const studentResponse = response || { issues: '', solution: '' }
  const eval_ = evaluation || {
    score: 0,
    feedback: 'No evaluation available',
    understanding: 0,
    ingenuity: 0,
    criticalThinking: 0,
    realWorldApplication: 0,
    strengths: [],
    improvements: [],
  }

  return (
    <div className="border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Case {index + 1}: {scenario.title}
        </h3>
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
          {scenario.domain || 'General'}
        </span>
      </div>

      {/* Scenario Content */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-2">Scenario:</p>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{scenario.content}</p>
      </div>

      {/* Student Responses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Your Identified Flaws:</p>
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {studentResponse.issues || <em className="text-gray-500">No response</em>}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Your Proposed Solutions:</p>
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {studentResponse.solution || <em className="text-gray-500">No response</em>}
            </p>
          </div>
        </div>
      </div>

      {/* AI Evaluation Feedback */}
      <div className="space-y-3 mb-4">
        {/* Strengths */}
        {eval_.strengths && eval_.strengths.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-1">
              {CheckIcon}
              What Was Done Well:
            </p>
            <ul className="text-sm text-green-800 space-y-1">
              {eval_.strengths.map((strength: string, i: number) => (
                <li key={i}>- {strength}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {eval_.improvements && eval_.improvements.length > 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-1">
              {LightbulbIcon}
              What Could Improve:
            </p>
            <ul className="text-sm text-yellow-800 space-y-1">
              {eval_.improvements.map((improvement: string, i: number) => (
                <li key={i}>- {improvement}</li>
              ))}
            </ul>
          </div>
        )}

        {/* General Feedback */}
        {eval_.feedback && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
              {LightbulbIcon}
              Suggestions for Real-World Application:
            </p>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{eval_.feedback}</p>
          </div>
        )}
      </div>

      {/* Individual Scores */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className={`text-center p-3 rounded ${getScoreBgColor(eval_.understanding)}`}>
          <p className="text-xs text-gray-600 mb-1">Understanding</p>
          <p className={`text-lg font-bold ${getScoreColor(eval_.understanding)}`}>
            {eval_.understanding?.toFixed(1) || 'N/A'}
          </p>
        </div>
        <div className={`text-center p-3 rounded ${getScoreBgColor(eval_.ingenuity)}`}>
          <p className="text-xs text-gray-600 mb-1">Ingenuity</p>
          <p className={`text-lg font-bold ${getScoreColor(eval_.ingenuity)}`}>
            {eval_.ingenuity?.toFixed(1) || 'N/A'}
          </p>
        </div>
        <div className={`text-center p-3 rounded ${getScoreBgColor(eval_.criticalThinking)}`}>
          <p className="text-xs text-gray-600 mb-1">Critical Thinking</p>
          <p className={`text-lg font-bold ${getScoreColor(eval_.criticalThinking)}`}>
            {eval_.criticalThinking?.toFixed(1) || 'N/A'}
          </p>
        </div>
        <div className={`text-center p-3 rounded ${getScoreBgColor(eval_.realWorldApplication)}`}>
          <p className="text-xs text-gray-600 mb-1">Real-World</p>
          <p className={`text-lg font-bold ${getScoreColor(eval_.realWorldApplication)}`}>
            {eval_.realWorldApplication?.toFixed(1) || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
