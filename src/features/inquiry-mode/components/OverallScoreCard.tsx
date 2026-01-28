import { getScoreColor } from '../utils'

interface OverallScoreCardProps {
  passed: boolean
  avgScore: number
  questionsCount: number
  passThreshold: number
  labels: {
    passedTitle: string
    failedTitle: string
    questionsGenerated: string
    passThresholdLabel: string
    statusLabel: string
    passed: string
    needsImprovement: string
    average: string
  }
}

export function OverallScoreCard({
  passed,
  avgScore,
  questionsCount,
  passThreshold,
  labels,
}: OverallScoreCardProps) {
  return (
    <div className={`rounded-lg shadow-md p-6 mb-6 ${
      passed ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {passed ? (
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
          )}
          <div>
            <h2 className={`text-xl font-bold ${passed ? 'text-green-800' : 'text-yellow-800'}`}>
              {passed ? labels.passedTitle : labels.failedTitle}
            </h2>
            <p className={passed ? 'text-green-600' : 'text-yellow-600'}>
              {labels.questionsGenerated.replace('{count}', String(questionsCount))}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>
            {avgScore.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">/ 10 {labels.average}</div>
        </div>
      </div>

      <div className="text-sm text-gray-600 mt-2">
        {labels.passThresholdLabel}: {passThreshold} | {labels.statusLabel}: {passed ? labels.passed : labels.needsImprovement}
      </div>
    </div>
  )
}
