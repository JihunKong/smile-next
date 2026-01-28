'use client'

import type { PrivacySettings, FormMessage } from '../../types'

interface PrivacySectionProps {
  privacy: PrivacySettings
  isLoading: boolean
  message: FormMessage | null
  onChange: (settings: PrivacySettings) => void
  onSave: () => Promise<void>
}

const PRIVACY_LABELS: Record<keyof PrivacySettings, string> = {
  profileVisible: 'Profile Visible',
  showRealName: 'Show Real Name',
  allowDirectMessages: 'Allow Direct Messages',
}

/**
 * Privacy settings section for settings page
 *
 * Toggle switches for privacy-related preferences.
 */
export function PrivacySection({
  privacy,
  isLoading,
  message,
  onChange,
  onSave,
}: PrivacySectionProps) {
  const handleToggle = (key: keyof PrivacySettings) => {
    onChange({
      ...privacy,
      [key]: !privacy[key],
    })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">
        Privacy Settings
      </h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        {(Object.keys(privacy) as Array<keyof PrivacySettings>).map((key) => (
          <label
            key={key}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-700">{PRIVACY_LABELS[key]}</span>
            <input
              type="checkbox"
              checked={privacy[key]}
              onChange={() => handleToggle(key)}
              className="w-5 h-5 text-[#8C1515] border-gray-300 rounded focus:ring-[#8C1515]"
            />
          </label>
        ))}
      </div>

      <button
        className="mt-6 px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        disabled={isLoading}
        onClick={onSave}
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
