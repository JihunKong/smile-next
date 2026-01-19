'use client'

import type { FactCheckWarning, DetailedScenario } from '../types'

interface FactCheckWarningsPanelProps {
  warnings: FactCheckWarning[]
  scenarios: DetailedScenario[]
  onEditScenario: (scenario: DetailedScenario) => void
  onDismissWarning: (index: number) => void
}

/**
 * Panel displaying fact-check warnings with edit actions.
 */
export function FactCheckWarningsPanel({
  warnings,
  scenarios,
  onEditScenario,
  onDismissWarning,
}: FactCheckWarningsPanelProps) {
  if (warnings.length === 0) return null

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return { bg: 'bg-red-50', border: 'border-red-500', badge: 'bg-red-100 text-red-800' }
      case 'medium':
        return { bg: 'bg-yellow-50', border: 'border-yellow-500', badge: 'bg-yellow-100 text-yellow-800' }
      case 'low':
        return { bg: 'bg-blue-50', border: 'border-blue-500', badge: 'bg-blue-100 text-blue-800' }
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-500', badge: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="mt-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-yellow-900 mb-4">
          ⚠️ Fact Verification Warnings
        </h2>
        <div className="space-y-3">
          {warnings.map((warning, index) => {
            const colors = getSeverityColor(warning.severity)

            return (
              <div key={index} className={`bg-white ${colors.border} border-l-4 p-4 rounded`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className={`${colors.badge} text-xs font-semibold px-2 py-1 rounded`}>
                      Scenario #{warning.scenario_number} | {warning.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">&quot;{warning.claim}&quot;</p>
                    <p className="text-sm text-gray-700 mb-2"><strong>Issue:</strong> {warning.issue}</p>
                    <p className="text-sm text-gray-600 mb-3"><strong>Suggestion:</strong> {warning.suggested_correction}</p>
                    <button
                      onClick={() => {
                        const scenario = scenarios.find((s) => s.scenario_number === warning.scenario_number)
                        if (scenario) {
                          onEditScenario(scenario)
                          onDismissWarning(index)
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 px-4 rounded-lg"
                      style={{ backgroundColor: '#4f46e5' }}
                    >
                      Edit Scenario #{warning.scenario_number}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
