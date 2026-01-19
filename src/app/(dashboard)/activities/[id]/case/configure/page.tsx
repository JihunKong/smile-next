'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  useCaseSettings,
  ScenarioList,
  ScenarioEditor,
  AIGenerationPanel,
} from '@/features/case-mode'
import type { CaseScenario } from '@/features/case-mode'

export default function CaseConfigurePage() {
  const params = useParams()
  const activityId = params.id as string

  // Local UI state
  const [editingScenario, setEditingScenario] = useState<CaseScenario | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGenerateSection, setShowGenerateSection] = useState(false)

  // Use the extracted settings hook
  const {
    activity,
    scenarios,
    settings,
    sourceMaterial,
    loading,
    saving,
    generating,
    generationProgress,
    generationMessage,
    error,
    success,
    updateSetting,
    setSourceMaterial,
    saveSettings,
    generateScenarios,
    addScenario,
    updateScenario,
    deleteScenario,
    reorderScenarios,
    saveReorderedScenarios,
  } = useCaseSettings({ activityId })

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state (no activity)
  if (error && !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href={`/activities/${activityId}`} className="text-indigo-600 hover:underline">
            Back to Activity
          </Link>
        </div>
      </div>
    )
  }

  if (!activity) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configure Case Mode</h1>
              <p className="text-gray-600 mt-2">Activity: <span className="font-semibold">{activity.name}</span></p>
            </div>
            <Link href={`/activities/${activityId}/edit`} className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg inline-flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Activity
            </Link>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About Case Mode</h3>
                <p className="mt-2 text-sm text-blue-700">
                  Case Mode presents students with realistic business scenarios containing embedded ethical/logical flaws. Students analyze cases and propose solutions. AI evaluates responses on 4 criteria.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {success && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"><p className="text-green-700">{success}</p></div>}
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-700">{error}</p></div>}

        {/* Configuration Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuration Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cases Shown to Students <span className="text-red-500">*</span></label>
              <select value={settings.numCasesToShow} onChange={(e) => updateSetting('numCasesToShow', parseInt(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="1">1 case</option><option value="2">2 cases (recommended)</option><option value="3">3 cases</option><option value="4">4 cases</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Students will see this many randomly selected cases from your pool.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level <span className="text-red-500">*</span></label>
              <select value={settings.difficultyLevel} onChange={(e) => updateSetting('difficultyLevel', e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="basic">Basic (Simple scenarios, obvious flaws)</option>
                <option value="intermediate">Intermediate (Moderate complexity)</option>
                <option value="professional">Professional (Complex, subtle flaws)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Per Case (minutes) <span className="text-red-500">*</span></label>
              <input type="number" value={settings.timePerCase} onChange={(e) => updateSetting('timePerCase', Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))} min={1} max={60} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <p className="text-sm text-gray-500 mt-1">Hard cutoff - cases auto-submit when time expires.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Time Limit (minutes) <span className="text-red-500">*</span></label>
              <input type="number" value={settings.totalTimeLimit} onChange={(e) => updateSetting('totalTimeLimit', Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))} min={1} max={180} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pass Threshold (0-10 scale) <span className="text-red-500">*</span></label>
              <input type="number" value={settings.passThreshold} onChange={(e) => updateSetting('passThreshold', Math.max(1, Math.min(10, parseFloat(e.target.value) || 1)))} min={1} max={10} step={0.5} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <p className="text-sm text-gray-500 mt-1">Students must score at least this average across 4 criteria to pass.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Attempts <span className="text-red-500">*</span></label>
              <select value={settings.maxAttempts} onChange={(e) => updateSetting('maxAttempts', parseInt(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (<option key={n} value={n}>{n} attempt{n > 1 ? 's' : ''} {n === 1 ? '(no retakes)' : ''}</option>))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.anonymizeLeaderboard} onChange={(e) => updateSetting('anonymizeLeaderboard', e.target.checked)} className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
              <span className="ml-3 text-sm font-medium text-gray-700">Anonymize student names on leaderboard</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-8">When enabled, student names are masked for privacy (e.g., &quot;J. Kim *8472&quot;).</p>
          </div>
        </div>

        {/* AI Generation */}
        <AIGenerationPanel
          sourceMaterial={sourceMaterial}
          onSourceMaterialChange={setSourceMaterial}
          onGenerate={generateScenarios}
          generating={generating}
          generationProgress={generationProgress}
          generationMessage={generationMessage}
          isExpanded={showGenerateSection}
          onToggleExpand={() => setShowGenerateSection(!showGenerateSection)}
        />

        {/* Scenario Management */}
        <ScenarioList
          scenarios={scenarios}
          onAdd={() => setShowAddModal(true)}
          onEdit={setEditingScenario}
          onDelete={deleteScenario}
          onReorder={reorderScenarios}
          onSaveReorder={saveReorderedScenarios}
          onShowGenerate={() => setShowGenerateSection(true)}
        />

        {/* Preview Section */}
        {scenarios.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </h2>
            <p className="text-sm text-gray-600 mb-4">This is how scenarios will appear to students (first {settings.numCasesToShow} shown randomly):</p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-indigo-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-indigo-600">{scenarios.length}</p><p className="text-sm text-gray-600">Total Scenarios</p></div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-indigo-600">{settings.timePerCase}</p><p className="text-sm text-gray-600">Min Per Case</p></div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-indigo-600">{settings.passThreshold}</p><p className="text-sm text-gray-600">Pass Threshold</p></div>
              </div>
              <div className="space-y-2">
                {scenarios.slice(0, settings.numCasesToShow).map((scenario, index) => (
                  <div key={scenario.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{index + 1}</span>
                    <span className="font-medium text-gray-800">{scenario.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t bg-white rounded-lg shadow-md p-6">
          <p className="text-sm text-gray-600">
            <svg className="w-4 h-4 inline mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {settings.isPublished ? 'Case study is published and visible to students.' : 'Save as draft to continue editing, or publish to make available to students.'}
          </p>
          <div className="flex gap-3">
            <Link href={`/activities/${activityId}/edit`} className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg">Cancel</Link>
            <button onClick={() => saveSettings(false)} disabled={saving} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center disabled:opacity-50" style={{ backgroundColor: '#4b5563' }}>
              {saving ? <><div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent mr-2"></div>Saving...</> : <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Save as Draft
              </>}
            </button>
            <button onClick={() => saveSettings(true)} disabled={saving || scenarios.length < settings.numCasesToShow} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center" style={{ backgroundColor: saving || scenarios.length < settings.numCasesToShow ? undefined : '#059669' }} title={scenarios.length < settings.numCasesToShow ? `Need at least ${settings.numCasesToShow} scenarios to publish` : ''}>
              {saving ? <><div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent mr-2"></div>Publishing...</> : <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save &amp; Publish
              </>}
            </button>
          </div>
        </div>

        {/* Review Link */}
        {scenarios.length > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-800 font-medium">{scenarios.length} scenarios ready for review</span>
              </div>
              <Link href={`/activities/${activityId}/case/review`} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center" style={{ backgroundColor: '#4f46e5' }}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Review &amp; Edit Scenarios
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ScenarioEditor
        scenario={editingScenario}
        isOpen={!!editingScenario || showAddModal}
        onClose={() => { setEditingScenario(null); setShowAddModal(false) }}
        onSave={async (title, content, domain) => { await addScenario(title, content, domain); setShowAddModal(false) }}
        onUpdate={async (scenario) => { await updateScenario(scenario); setEditingScenario(null) }}
        isSaving={saving}
      />
    </div>
  )
}
