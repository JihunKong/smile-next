'use client'

import type { NotificationSettings, FormMessage } from '../../types'

interface NotificationsSectionProps {
  notifications: NotificationSettings
  isLoading: boolean
  message: FormMessage | null
  onChange: (settings: NotificationSettings) => void
  onSave: () => Promise<void>
}

const NOTIFICATION_LABELS: Record<keyof NotificationSettings, string> = {
  emailNotifications: 'Email Notifications',
  groupUpdates: 'Group Updates',
  activityReminders: 'Activity Reminders',
  questionResponses: 'Question Responses',
}

/**
 * Notification preferences section for settings page
 *
 * Toggle switches for various notification types.
 */
export function NotificationsSection({
  notifications,
  isLoading,
  message,
  onChange,
  onSave,
}: NotificationsSectionProps) {
  const handleToggle = (key: keyof NotificationSettings) => {
    onChange({
      ...notifications,
      [key]: !notifications[key],
    })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">
        Notification Preferences
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
        {(Object.keys(notifications) as Array<keyof NotificationSettings>).map(
          (key) => (
            <label
              key={key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-700">{NOTIFICATION_LABELS[key]}</span>
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={() => handleToggle(key)}
                className="w-5 h-5 text-[#8C1515] border-gray-300 rounded focus:ring-[#8C1515]"
              />
            </label>
          )
        )}
      </div>

      <button
        className="mt-6 px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        disabled={isLoading}
        onClick={onSave}
      >
        {isLoading ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  )
}
