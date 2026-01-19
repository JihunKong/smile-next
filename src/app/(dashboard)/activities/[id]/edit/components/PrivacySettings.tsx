'use client'

import { BasicInfoState } from '../types'

interface Props {
  basicInfo: BasicInfoState
  setBasicInfo: React.Dispatch<React.SetStateAction<BasicInfoState>>
}

export function PrivacySettings({ basicInfo, setBasicInfo }: Props) {
  const updateField = <K extends keyof BasicInfoState>(field: K, value: BasicInfoState[K]) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Privacy Settings
      </h2>
      <div className="space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={basicInfo.visible}
            onChange={(e) => updateField('visible', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Activity is visible to group members
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={basicInfo.hideUsernames}
            onChange={(e) => updateField('hideUsernames', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Hide usernames from other students
          </span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={basicInfo.isAnonymousAuthorAllowed}
            onChange={(e) => updateField('isAnonymousAuthorAllowed', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Allow students to post anonymously
          </span>
        </label>
      </div>
    </div>
  )
}
