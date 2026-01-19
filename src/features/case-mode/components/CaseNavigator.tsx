'use client'

import type { CaseScenario, ScenarioResponse } from '../types'

interface CaseNavigatorProps {
  scenarios: CaseScenario[]
  currentIndex: number
  responses: Record<string, ScenarioResponse>
  onNavigate: (index: number) => Promise<void>
}

/**
 * Quick navigation grid for jumping between case scenarios.
 * Shows completion status for each case.
 */
export function CaseNavigator({ scenarios, currentIndex, responses, onNavigate }: CaseNavigatorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">케이스 빠른 이동</h3>
      <div className="flex gap-2 flex-wrap">
        {scenarios.map((scenario, index) => {
          const hasResponse = responses[scenario.id]?.issues || responses[scenario.id]?.solution
          return (
            <button
              key={scenario.id}
              onClick={() => onNavigate(index)}
              className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                index === currentIndex
                  ? 'bg-indigo-600 text-white'
                  : hasResponse
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}
