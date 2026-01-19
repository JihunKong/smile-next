'use client'

import type { DetailedScenario } from '../types'

interface ReviewScenarioCardProps {
  scenario: DetailedScenario
  displayNumber: number
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onToggleActive: () => void
  onRegenerate: () => void
  onDelete: () => void
}

/**
 * Card component for review page with detailed scenario information.
 */
export function ReviewScenarioCard({
  scenario,
  displayNumber,
  isExpanded,
  onToggleExpand,
  onEdit,
  onToggleActive,
  onRegenerate,
  onDelete,
}: ReviewScenarioCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${!scenario.is_active ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-indigo-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
              {displayNumber}
            </span>
            <span className="text-lg font-bold text-indigo-600">Scenario #{displayNumber}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${scenario.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {scenario.is_active ? 'Active' : 'Inactive'}
            </span>
            {scenario.created_by_ai && !scenario.edited_by_creator && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">AI</span>
            )}
            {scenario.edited_by_creator && (
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">Edited</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{scenario.title}</h3>
          <p className="text-sm text-gray-600">
            {scenario.domain}
            {scenario.innovation_name && ` | ${scenario.innovation_name}`}
          </p>
        </div>
      </div>

      {/* Scenario Content */}
      <div className="mb-4">
        {!isExpanded ? (
          <p className="text-base text-gray-700 line-clamp-3">{scenario.scenario_content.substring(0, 200)}...</p>
        ) : (
          <div className="text-base text-gray-800 whitespace-pre-wrap border-l-4 border-indigo-300 pl-4 py-2 bg-gray-50 rounded leading-relaxed">
            {scenario.scenario_content}
          </div>
        )}
        <button onClick={onToggleExpand} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold mt-2">
          {isExpanded ? '▲ Collapse' : '▼ Read Full Scenario'}
        </button>
      </div>

      {/* Expected Answers Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-red-50 p-3 rounded">
          <span className="font-semibold text-red-800">Flaws:</span>
          <span className="text-red-700 ml-1">{scenario.expected_flaws?.length || 0}</span>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <span className="font-semibold text-green-800">Solutions:</span>
          <span className="text-green-700 ml-1">{scenario.expected_solutions?.length || 0}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm" style={{ backgroundColor: '#4f46e5' }}>
          Edit
        </button>
        <button onClick={onToggleActive} className={`flex-1 font-semibold py-2 px-4 rounded-lg text-sm ${scenario.is_active ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' : 'bg-green-600 hover:bg-green-700 text-white'}`} style={scenario.is_active ? {} : { backgroundColor: '#059669' }}>
          {scenario.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={onRegenerate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg text-sm" style={{ backgroundColor: '#2563eb' }} title="Regenerate">
          ↻
        </button>
        <button onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg text-sm" style={{ backgroundColor: '#dc2626' }} title="Delete">
          ✕
        </button>
      </div>
    </div>
  )
}
