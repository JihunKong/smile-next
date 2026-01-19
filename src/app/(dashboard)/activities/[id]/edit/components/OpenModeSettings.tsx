'use client'

import { OpenModeFormState } from '../types'

interface Props {
  openModeState: OpenModeFormState
  setOpenModeState: React.Dispatch<React.SetStateAction<OpenModeFormState>>
}

export function OpenModeSettings({ openModeState, setOpenModeState }: Props) {
  const updateField = <K extends keyof OpenModeFormState>(field: K, value: OpenModeFormState[K]) => {
    setOpenModeState((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Open Mode Settings
      </h2>

      {/* Instructions */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions for Students
        </label>
        <textarea
          value={openModeState.openModeInstructions}
          onChange={(e) => updateField('openModeInstructions', e.target.value)}
          rows={3}
          placeholder="Provide detailed instructions for students..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Pass/Fail Toggle */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={openModeState.isPassFailEnabled}
            onChange={(e) => updateField('isPassFailEnabled', e.target.checked)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            Enable Pass/Fail Requirements
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          When enabled, students must meet all requirements to pass this activity.
        </p>
      </div>

      {/* Pass/Fail Requirements (only visible when enabled) */}
      {openModeState.isPassFailEnabled && (
        <div className="bg-white rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Pass/Fail Requirements
          </h3>

          {/* Core Requirements */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Questions
              </label>
              <input
                type="number"
                value={openModeState.requiredQuestionCount}
                onChange={(e) => updateField('requiredQuestionCount', Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                min={1}
                max={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">1-100 questions</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Bloom&apos;s Level
              </label>
              <input
                type="number"
                value={openModeState.requiredAvgLevel}
                onChange={(e) => updateField('requiredAvgLevel', Math.max(1, Math.min(6, parseFloat(e.target.value) || 1)))}
                min={1}
                max={6}
                step={0.5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">1.0-6.0 (avg level)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min AI Score
              </label>
              <input
                type="number"
                value={openModeState.requiredAvgScore}
                onChange={(e) => updateField('requiredAvgScore', Math.max(1, Math.min(10, parseFloat(e.target.value) || 1)))}
                min={1}
                max={10}
                step={0.5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">1.0-10.0 (avg score)</p>
            </div>
          </div>

          {/* Peer Interaction Requirements */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Peer Interaction (Optional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peer Ratings Required
                </label>
                <input
                  type="number"
                  value={openModeState.peerRatingsRequired}
                  onChange={(e) => updateField('peerRatingsRequired', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">0 = not required</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peer Responses Required
                </label>
                <input
                  type="number"
                  value={openModeState.peerResponsesRequired}
                  onChange={(e) => updateField('peerResponsesRequired', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">0 = not required</p>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-green-800">
              <strong>How Pass/Fail Works:</strong> Students must meet ALL enabled requirements to pass.
              If peer interactions are required but no peer questions exist, students will see a &quot;waiting for peers&quot; status.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
