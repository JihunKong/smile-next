'use client'

import type { CaseScenario } from '../types'
import { ScenarioCard } from './ScenarioCard'
import { useScenarioDragDrop } from '../hooks/useScenarioDragDrop'

interface ScenarioListProps {
  scenarios: CaseScenario[]
  onAdd: () => void
  onEdit: (scenario: CaseScenario) => void
  onDelete: (scenarioId: string) => void
  onReorder: (scenarios: CaseScenario[]) => void
  onSaveReorder: () => void
  onShowGenerate: () => void
}

/**
 * List of case scenarios with drag-and-drop reordering support.
 */
export function ScenarioList({
  scenarios,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  onSaveReorder,
  onShowGenerate,
}: ScenarioListProps) {
  const { handleDragStart, handleDragOver, handleDragEnd, isDragging } = useScenarioDragDrop({
    scenarios,
    onReorder,
    onDragEnd: onSaveReorder,
  })

  if (scenarios.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Scenarios (0)
          </h2>
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-4">No scenarios yet. Add scenarios manually or use AI generation.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg"
              style={{ backgroundColor: '#4f46e5' }}
            >
              Add Manually
            </button>
            <button
              onClick={onShowGenerate}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg"
              style={{ backgroundColor: '#9333ea' }}
            >
              Generate with AI
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Scenarios ({scenarios.length})
        </h2>
        <button
          onClick={onAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center"
          style={{ backgroundColor: '#4f46e5' }}
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Scenario
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500 mb-4">
          Drag scenarios to reorder. Click edit to modify content.
        </p>
        {scenarios.map((scenario, index) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            index={index}
            onEdit={() => onEdit(scenario)}
            onDelete={() => onDelete(scenario.id)}
            isDragging={isDragging(index)}
            dragHandleProps={{
              draggable: true,
              onDragStart: () => handleDragStart(index),
              onDragOver: (e) => handleDragOver(e, index),
              onDragEnd: handleDragEnd,
            }}
          />
        ))}
      </div>
    </div>
  )
}
