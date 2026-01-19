// EvaluationBreakdown Component
// Displays the 4-criteria evaluation grid for case mode
// Used in results page to show average scores across all criteria

import { getScoreColor, getBarColor } from './ScoreDisplay'

// ============================================================================
// Criterion Card (internal component)
// ============================================================================

interface CriterionCardProps {
  name: string
  description: string
  score: number
  icon: React.ReactNode
  iconColor: string
}

function CriterionCard({ name, description, score, icon, iconColor }: CriterionCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className={iconColor}>{icon}</span>
          {name}
        </h3>
        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score.toFixed(1)}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getBarColor(score)}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// Icons
// ============================================================================

const PuzzleIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
)

const LightbulbIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const CpuIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

const GlobeIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// ============================================================================
// EvaluationBreakdown Component
// ============================================================================

export interface EvaluationBreakdownProps {
  /** Understanding the Case Issue score (0-10) */
  understanding: number
  /** Ingenuity in Solution Suggestion score (0-10) */
  ingenuity: number
  /** Critical Thinking Depth score (0-10) */
  criticalThinking: number
  /** Real-World Application score (0-10) */
  realWorld: number
}

/**
 * Displays the 4-criteria evaluation breakdown in a 2x2 grid.
 * Each criterion shows the name, description, score, and progress bar.
 */
export function EvaluationBreakdown({
  understanding,
  ingenuity,
  criticalThinking,
  realWorld,
}: EvaluationBreakdownProps) {
  const criteria = [
    {
      name: 'Understanding',
      description: 'Understanding the Case Issue',
      score: understanding,
      icon: PuzzleIcon,
      iconColor: 'text-yellow-500',
    },
    {
      name: 'Ingenuity',
      description: 'Ingenuity in Solution Suggestion',
      score: ingenuity,
      icon: LightbulbIcon,
      iconColor: 'text-purple-500',
    },
    {
      name: 'Critical Thinking',
      description: 'Critical Thinking Depth',
      score: criticalThinking,
      icon: CpuIcon,
      iconColor: 'text-blue-500',
    },
    {
      name: 'Real-World Application',
      description: 'Real-World Application',
      score: realWorld,
      icon: GlobeIcon,
      iconColor: 'text-green-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {criteria.map((criterion) => (
        <CriterionCard key={criterion.name} {...criterion} />
      ))}
    </div>
  )
}
