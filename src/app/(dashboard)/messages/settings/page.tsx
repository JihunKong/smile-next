'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { LoadingState } from '@/components/ui'

interface NotificationSettings {
  question_liked: boolean
  question_responded: boolean
  response_liked: boolean
  badge_earned: boolean
  level_up: boolean
  streak_milestone: boolean
  group_invitation: boolean
  group_new_member: boolean
  group_new_question: boolean
  group_new_activity: boolean
  mention: boolean
}

interface MessagePreferences {
  enableUserMessages: boolean
  enableNotifications: boolean
  allowAnonymousMessages: boolean
  allowMessagesFrom: 'everyone' | 'groups_only' | 'none'
  notificationSettings: NotificationSettings
}

const defaultNotificationSettings: NotificationSettings = {
  question_liked: true,
  question_responded: true,
  response_liked: true,
  badge_earned: true,
  level_up: true,
  streak_milestone: true,
  group_invitation: true,
  group_new_member: true,
  group_new_question: true,
  group_new_activity: true,
  mention: true,
}

const defaultPreferences: MessagePreferences = {
  enableUserMessages: true,
  enableNotifications: true,
  allowAnonymousMessages: true,
  allowMessagesFrom: 'everyone',
  notificationSettings: defaultNotificationSettings,
}

export default function MessageSettingsPage() {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<MessagePreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/messages/preferences')
        if (response.ok) {
          const data = await response.json()
          setPreferences({
            ...defaultPreferences,
            ...data.preferences,
            notificationSettings: {
              ...defaultNotificationSettings,
              ...data.preferences?.notificationSettings,
            },
          })
        }
      } catch (error) {
        console.error('Failed to fetch preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchPreferences()
    }
  }, [session])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/messages/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleNotification = (key: keyof NotificationSettings) => {
    setPreferences((prev) => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key]: !prev.notificationSettings[key],
      },
    }))
  }

  const toggleAllNotifications = (enabled: boolean) => {
    const newSettings: NotificationSettings = {} as NotificationSettings
    Object.keys(defaultNotificationSettings).forEach((key) => {
      newSettings[key as keyof NotificationSettings] = enabled
    })
    setPreferences((prev) => ({
      ...prev,
      notificationSettings: newSettings,
    }))
  }

  const notificationLabels: Record<keyof NotificationSettings, string> = {
    question_liked: 'When someone likes your question',
    question_responded: 'When someone responds to your question',
    response_liked: 'When someone likes your response',
    badge_earned: 'When you earn a badge',
    level_up: 'When you level up',
    streak_milestone: 'When you reach a streak milestone',
    group_invitation: 'When you receive a group invitation',
    group_new_member: 'When a new member joins your group',
    group_new_question: 'When a new question is posted in your group',
    group_new_activity: 'When a new activity is created in your group',
    mention: 'When someone mentions you',
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view settings.</p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingState fullPage message="Loading settings..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/messages" className="text-[#8C1515] hover:underline text-sm mb-2 inline-block">
              ← Back to Messages
            </Link>
            <h1 className="text-2xl font-bold text-[#2E2D29]">Notification Settings</h1>
          </div>
        </div>

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

        {/* Master Toggle */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#2E2D29]">Enable Notifications</h3>
              <p className="text-sm text-gray-500">
                Master switch for all notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.enableNotifications}
                onChange={(e) =>
                  setPreferences({ ...preferences, enableNotifications: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8C1515]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8C1515]"></div>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#2E2D29]">Notification Types</h3>
            <div className="space-x-2">
              <button
                onClick={() => toggleAllNotifications(true)}
                className="text-sm text-[#8C1515] hover:underline"
              >
                Enable All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => toggleAllNotifications(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                Disable All
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {(Object.keys(notificationLabels) as Array<keyof NotificationSettings>).map((key) => (
              <label
                key={key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <span className="text-gray-700">{notificationLabels[key]}</span>
                <input
                  type="checkbox"
                  checked={preferences.notificationSettings[key]}
                  onChange={() => toggleNotification(key)}
                  disabled={!preferences.enableNotifications}
                  className="w-5 h-5 text-[#8C1515] border-gray-300 rounded focus:ring-[#8C1515] disabled:opacity-50"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-[#2E2D29] mb-4">Privacy Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-gray-700">Allow Direct Messages</span>
                <p className="text-sm text-gray-500">Let other users send you messages</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.enableUserMessages}
                onChange={(e) =>
                  setPreferences({ ...preferences, enableUserMessages: e.target.checked })
                }
                className="w-5 h-5 text-[#8C1515] border-gray-300 rounded focus:ring-[#8C1515]"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-gray-700">Allow Anonymous Messages</span>
                <p className="text-sm text-gray-500">Receive messages from anonymous senders</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.allowAnonymousMessages}
                onChange={(e) =>
                  setPreferences({ ...preferences, allowAnonymousMessages: e.target.checked })
                }
                className="w-5 h-5 text-[#8C1515] border-gray-300 rounded focus:ring-[#8C1515]"
              />
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <label className="block text-gray-700 mb-2">Who can message you</label>
              <select
                value={preferences.allowMessagesFrom}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    allowMessagesFrom: e.target.value as 'everyone' | 'groups_only' | 'none',
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent text-gray-900"
              >
                <option value="everyone">Everyone</option>
                <option value="groups_only">Group members only</option>
                <option value="none">No one</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
