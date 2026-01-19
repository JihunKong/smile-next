'use client'

import { BasicInfoState, modeLabels } from '../types'

interface Props {
  basicInfo: BasicInfoState
  setBasicInfo: React.Dispatch<React.SetStateAction<BasicInfoState>>
  activityMode: number
  modeLocked: boolean
}

export function BasicInfoForm({ basicInfo, setBasicInfo, activityMode, modeLocked }: Props) {
  const updateField = <K extends keyof BasicInfoState>(field: K, value: BasicInfoState[K]) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Basic Information
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Activity Name *
          </label>
          <input
            type="text"
            value={basicInfo.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={basicInfo.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type
              {modeLocked && (
                <span className="ml-2 text-yellow-600" title="Mode locked">
                  (Locked)
                </span>
              )}
            </label>
            <input
              type="text"
              value={modeLabels[activityMode] || 'Unknown'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
            {modeLocked && (
              <p className="text-xs text-yellow-600 mt-1">
                Mode cannot be changed after questions or attempts exist
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <input
              type="text"
              value={basicInfo.level}
              onChange={(e) => updateField('level', e.target.value)}
              placeholder="e.g., Beginner, Intermediate"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Education Level
            </label>
            <input
              type="text"
              value={basicInfo.educationLevel}
              onChange={(e) => updateField('educationLevel', e.target.value)}
              placeholder="e.g., High School"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={basicInfo.schoolSubject}
              onChange={(e) => updateField('schoolSubject', e.target.value)}
              placeholder="e.g., Mathematics"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <input
              type="text"
              value={basicInfo.topic}
              onChange={(e) => updateField('topic', e.target.value)}
              placeholder="e.g., Algebra"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
