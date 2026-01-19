'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  useCaseReview,
  ReviewScenarioCard,
  ReviewScenarioEditModal,
  FactCheckWarningsPanel,
} from '@/features/case-mode'
import type { DetailedScenario } from '@/features/case-mode'

export default function CaseReviewPage() {
  const params = useParams()
  const activityId = params.id as string

  // Local UI state for editing
  const [editingScenario, setEditingScenario] = useState<DetailedScenario | null>(null)

  // Use the extracted review hook
  const {
    activity,
    scenarios,
    configuration,
    warnings,
    loading,
    loadingTitle,
    loadingMessage,
    factCheckProgress,
    factCheckMessage,
    expandedScenarios,
    toggleScenarioExpand,
    toggleActive,
    saveScenario,
    regenerateScenario,
    deleteScenario,
    addNewScenario,
    verifyFacts,
    finalizeActivity,
    dismissWarning,
    setWarnings,
    activeCount,
    minRequired,
    canFinalize,
  } = useCaseReview({ activityId })

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{loadingTitle}</h3>
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Case Scenarios</h1>
            <p className="text-gray-600 mt-2">Activity: <span className="font-semibold">{activity?.name}</span></p>
          </div>
          <div className="flex gap-3">
            <Link href={`/activities/${activityId}/case/configure`} className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg">
              ⚙️ Settings
            </Link>
            <Link href={`/activities/${activityId}/edit`} className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg">
              ← Back
            </Link>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-sm text-gray-600">Total Scenarios:</span>
                <span className="text-lg font-bold text-indigo-600 ml-2">{scenarios.length}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Active:</span>
                <span className="text-lg font-bold text-gray-900 ml-2">{activeCount}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Difficulty:</span>
                <span className="text-lg font-bold text-indigo-600 ml-2">{configuration?.difficulty_level || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Students See:</span>
                <span className="text-lg font-bold text-indigo-600 ml-2">{configuration?.num_cases_to_show || '-'} cases</span>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={addNewScenario} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg" style={{ backgroundColor: '#9333ea' }}>
                + Add Scenario
              </button>
              <button onClick={verifyFacts} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg" style={{ backgroundColor: '#2563eb' }}>
                ✓ Verify Facts
              </button>
              <button
                onClick={finalizeActivity}
                disabled={!canFinalize}
                className={`font-semibold py-2 px-4 rounded-lg ${canFinalize ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 text-white opacity-50 cursor-not-allowed'}`}
                style={canFinalize ? { backgroundColor: '#059669' } : {}}
                title={canFinalize ? '' : `Need at least ${minRequired} active scenarios`}
              >
                ✓✓ Finalize Activity
              </button>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3 text-sm text-blue-700">
              <p><strong>Review & Edit:</strong> Read each scenario, verify factual accuracy, edit content as needed. You can regenerate individual scenarios, reorder them, or deactivate scenarios you don&apos;t want students to see.</p>
              <p className="mt-2"><strong>Manage Pool:</strong> Use &quot;Add Scenario&quot; to expand your pool, or delete button to remove scenarios.</p>
              <p className="mt-2"><strong>When ready:</strong> Click &quot;Finalize Activity&quot; to make it available to students.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fact Check Progress */}
      {factCheckProgress !== null && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full w-6 h-6 border-2 border-blue-600 border-t-transparent flex-shrink-0"></div>
            <div className="ml-4 flex-1">
              <h4 className="text-sm font-semibold text-blue-900">Processing...</h4>
              <p className="text-sm text-blue-800 mt-1">{factCheckMessage}</p>
              <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${factCheckProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarios.map((scenario, index) => (
          <ReviewScenarioCard
            key={scenario.id}
            scenario={scenario}
            displayNumber={index + 1}
            isExpanded={expandedScenarios.has(scenario.id)}
            onToggleExpand={() => toggleScenarioExpand(scenario.id)}
            onEdit={() => setEditingScenario(scenario)}
            onToggleActive={() => toggleActive(scenario.id, !scenario.is_active)}
            onRegenerate={() => regenerateScenario(scenario.scenario_number)}
            onDelete={() => deleteScenario(scenario.id, scenario.scenario_number, scenario.title)}
          />
        ))}
      </div>

      {/* Warnings Panel */}
      <FactCheckWarningsPanel
        warnings={warnings}
        scenarios={scenarios}
        onEditScenario={(scenario) => {
          setEditingScenario(scenario)
        }}
        onDismissWarning={(index) => {
          dismissWarning(index)
        }}
      />

      {/* Edit Modal */}
      <ReviewScenarioEditModal
        scenario={editingScenario}
        isOpen={!!editingScenario}
        onClose={() => setEditingScenario(null)}
        onSave={saveScenario}
      />
    </div>
  )
}
