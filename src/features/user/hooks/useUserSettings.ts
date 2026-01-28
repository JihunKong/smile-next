'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  UserPreferences,
  NotificationSettings,
  PrivacySettings,
  FormMessage,
} from '../types'

/**
 * Display settings for save operation
 */
interface DisplaySettingsInput {
  theme: 'light' | 'dark' | 'auto'
  language: string
  itemsPerPage: number
}

/**
 * Return type for useUserSettings hook
 */
export interface UseUserSettingsReturn {
  // State
  preferences: UserPreferences | null
  notifications: NotificationSettings
  privacy: PrivacySettings
  isLoading: boolean
  isSaving: boolean
  error: string | null
  message: FormMessage | null

  // Actions
  setNotifications: (settings: NotificationSettings) => void
  setPrivacy: (settings: PrivacySettings) => void
  saveNotifications: () => Promise<void>
  savePrivacy: () => Promise<void>
  saveDisplaySettings: (settings: DisplaySettingsInput) => Promise<void>
  clearMessage: () => void
  refetch: () => Promise<void>
}

/**
 * Hook for managing user settings (preferences, notifications, privacy, display)
 *
 * Provides state management and API integration for the settings page.
 *
 * @example
 * ```tsx
 * const {
 *   notifications,
 *   setNotifications,
 *   saveNotifications,
 *   isLoading,
 *   message
 * } = useUserSettings()
 * ```
 */
export function useUserSettings(): UseUserSettingsReturn {
  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    groupUpdates: true,
    activityReminders: true,
    questionResponses: true,
  })

  // Privacy settings state
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisible: true,
    showRealName: true,
    allowDirectMessages: true,
  })

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Error and message state
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<FormMessage | null>(null)

  /**
   * Fetch preferences from API
   */
  const fetchPreferences = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/preferences')

      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()

      if (data.success && data.data) {
        const prefs = data.data as UserPreferences
        setPreferences(prefs)

        // Sync notification settings
        setNotifications({
          emailNotifications: prefs.emailDigest,
          groupUpdates: prefs.additionalSettings?.groupUpdates ?? true,
          activityReminders: prefs.additionalSettings?.activityReminders ?? true,
          questionResponses: prefs.additionalSettings?.questionResponses ?? true,
        })

        // Sync privacy settings
        setPrivacy({
          profileVisible: prefs.showOnlineStatus,
          showRealName: prefs.additionalSettings?.showRealName ?? true,
          allowDirectMessages: prefs.additionalSettings?.allowDirectMessages ?? true,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Save notification settings
   */
  const saveNotifications = useCallback(async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailDigest: notifications.emailNotifications,
          additionalSettings: {
            groupUpdates: notifications.groupUpdates,
            activityReminders: notifications.activityReminders,
            questionResponses: notifications.questionResponses,
          },
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification preferences saved!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsSaving(false)
    }
  }, [notifications])

  /**
   * Save privacy settings
   */
  const savePrivacy = useCallback(async () => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showOnlineStatus: privacy.profileVisible,
          showActivityStatus: privacy.profileVisible,
          additionalSettings: {
            showRealName: privacy.showRealName,
            allowDirectMessages: privacy.allowDirectMessages,
          },
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Privacy settings saved!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsSaving(false)
    }
  }, [privacy])

  /**
   * Save display settings (theme, language, items per page)
   */
  const saveDisplaySettings = useCallback(async (settings: DisplaySettingsInput) => {
    setIsSaving(true)

    try {
      // Map 'auto' to 'system' for API compatibility
      const themeValue = settings.theme === 'auto' ? 'system' : settings.theme
      // Map language to ko/en
      const langValue = settings.language === 'en' ? 'en' : 'ko'

      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: themeValue,
          language: langValue,
          additionalSettings: {
            itemsPerPage: settings.itemsPerPage,
          },
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Display settings saved!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * Clear message
   */
  const clearMessage = useCallback(() => {
    setMessage(null)
  }, [])

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  return {
    // State
    preferences,
    notifications,
    privacy,
    isLoading,
    isSaving,
    error,
    message,

    // Actions
    setNotifications,
    setPrivacy,
    saveNotifications,
    savePrivacy,
    saveDisplaySettings,
    clearMessage,
    refetch: fetchPreferences,
  }
}
