'use client'

import { InquiryFormState } from '../types'

interface Props {
  inquiryState: InquiryFormState
  setInquiryState: React.Dispatch<React.SetStateAction<InquiryFormState>>
}

export function InquiryModeSettings({ inquiryState, setInquiryState }: Props) {
  const updateField = <K extends keyof InquiryFormState>(field: K, value: InquiryFormState[K]) => {
    setInquiryState((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Inquiry Mode Settings
      </h2>

      {/* Theme & Reference */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Theme &amp; Reference
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inquiry Theme
            </label>
            <input
              type="text"
              value={inquiryState.inquiryTheme}
              onChange={(e) => updateField('inquiryTheme', e.target.value)}
              placeholder="e.g., Climate Change, World History"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Document URL
            </label>
            <input
              type="url"
              value={inquiryState.referenceDocument}
              onChange={(e) => updateField('referenceDocument', e.target.value)}
              placeholder="https://example.com/reference.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Optional. Link to reference material.</p>
          </div>
        </div>
      </div>

      {/* Question Parameters */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Question Parameters
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Word Count
            </label>
            <input
              type="number"
              value={inquiryState.minWordCount}
              onChange={(e) => updateField('minWordCount', parseInt(e.target.value) || 5)}
              min={5}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Word Count
            </label>
            <input
              type="number"
              value={inquiryState.maxWordCount}
              onChange={(e) => updateField('maxWordCount', parseInt(e.target.value) || 500)}
              min={50}
              max={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Quality Thresholds */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Quality Thresholds
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Quality Score (0-10)
            </label>
            <input
              type="number"
              value={inquiryState.qualityThreshold}
              onChange={(e) => updateField('qualityThreshold', parseFloat(e.target.value) || 5)}
              min={0}
              max={10}
              step={0.5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Questions below this score may need revision</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Retake Attempts
            </label>
            <input
              type="number"
              value={inquiryState.inquiryMaxAttempts}
              onChange={(e) => updateField('inquiryMaxAttempts', parseInt(e.target.value) || 1)}
              min={1}
              max={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Times a student can retry</p>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Display Settings
        </h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={inquiryState.inquiryShowLeaderboard}
              onChange={(e) => updateField('inquiryShowLeaderboard', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Show leaderboard to students
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={inquiryState.allowHints}
              onChange={(e) => updateField('allowHints', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Allow hints during inquiry
            </span>
          </label>

          {inquiryState.allowHints && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Hints per Question
              </label>
              <input
                type="number"
                value={inquiryState.maxHints}
                onChange={(e) => updateField('maxHints', parseInt(e.target.value) || 1)}
                min={1}
                max={10}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Publishing Status */}
      <div className="bg-white rounded-lg p-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={inquiryState.inquiryIsPublished}
            onChange={(e) => updateField('inquiryIsPublished', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Inquiry is published and visible to students
          </span>
        </label>
        <p className="text-xs text-gray-500 ml-6 mt-1">
          Uncheck this to hide the inquiry while you prepare keywords
        </p>
      </div>
    </div>
  )
}
