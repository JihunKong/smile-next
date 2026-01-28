'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDisplaySettings } from '@/hooks/useDisplaySettings'
import { useUserSettings, useUserProfile } from '@/features/user'
import type { SettingsTabId, PasswordFormData, FormMessage } from '@/features/user'
import {
  SettingsNav,
  AccountSection,
  PasswordSection,
  NotificationsSection,
  PrivacySection,
  DisplaySection,
  DangerZoneSection,
} from '@/features/user/components/settings'

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as SettingsTabId | null

  // Tab state
  const [activeTab, setActiveTab] = useState<SettingsTabId>(tabFromUrl || 'account')

  // Hooks
  const {
    notifications,
    privacy,
    isSaving: isSettingsSaving,
    message: settingsMessage,
    setNotifications,
    setPrivacy,
    saveNotifications,
    savePrivacy,
    saveDisplaySettings,
    clearMessage: clearSettingsMessage,
  } = useUserSettings()

  const {
    form: accountForm,
    isSaving: isProfileSaving,
    message: profileMessage,
    updateForm: updateAccountForm,
    saveProfile,
    clearMessage: clearProfileMessage,
  } = useUserProfile()

  const {
    settings: displaySettings,
    setTheme,
    setLanguage,
    setItemsPerPage,
  } = useDisplaySettings()

  // Local state for password and danger zone
  const [passwordMessage, setPasswordMessage] = useState<FormMessage | null>(null)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [dangerMessage, setDangerMessage] = useState<FormMessage | null>(null)
  const [isDangerLoading, setIsDangerLoading] = useState(false)

  // Get the current message based on active tab
  const getCurrentMessage = useCallback((): FormMessage | null => {
    switch (activeTab) {
      case 'account':
        return profileMessage
      case 'password':
        return passwordMessage
      case 'notifications':
      case 'privacy':
      case 'display':
        return settingsMessage
      case 'danger':
        return dangerMessage
      default:
        return null
    }
  }, [activeTab, profileMessage, passwordMessage, settingsMessage, dangerMessage])

  // Password change handler
  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordLoading(true)
    setPasswordMessage(null)

    try {
      const response = await fetch('/api/auth/password/change', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' })
      } else {
        setPasswordMessage({ type: 'error', text: result.error || 'Failed to change password' })
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  // Account submit handler
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveProfile()
    await updateSession()
  }

  // Delete account handler
  const handleDeleteAccount = async () => {
    setIsDangerLoading(true)
    setDangerMessage(null)

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/auth/login?deleted=true')
      } else {
        const data = await response.json()
        setDangerMessage({ type: 'error', text: data.error || 'Failed to delete account' })
      }
    } catch {
      setDangerMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsDangerLoading(false)
    }
  }

  // Display settings save handler
  const handleDisplaySave = async () => {
    await saveDisplaySettings({
      theme: displaySettings.theme,
      language: displaySettings.language,
      itemsPerPage: displaySettings.itemsPerPage,
    })
  }

  // Not signed in
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to access settings.</p>
      </div>
    )
  }

  const currentMessage = getCurrentMessage()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#2E2D29] mb-8">Settings</h1>

        {/* Global message display */}
        {currentMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              currentMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {currentMessage.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {activeTab === 'account' && (
                <AccountSection
                  form={accountForm}
                  email={session.user?.email || ''}
                  isLoading={isProfileSaving}
                  message={null} // Message shown globally
                  onFormChange={updateAccountForm}
                  onSubmit={handleAccountSubmit}
                />
              )}

              {activeTab === 'password' && (
                <PasswordSection
                  isLoading={isPasswordLoading}
                  message={null} // Message shown globally
                  onSubmit={handlePasswordSubmit}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsSection
                  notifications={notifications}
                  isLoading={isSettingsSaving}
                  message={null} // Message shown globally
                  onChange={setNotifications}
                  onSave={saveNotifications}
                />
              )}

              {activeTab === 'privacy' && (
                <PrivacySection
                  privacy={privacy}
                  isLoading={isSettingsSaving}
                  message={null} // Message shown globally
                  onChange={setPrivacy}
                  onSave={savePrivacy}
                />
              )}

              {activeTab === 'display' && (
                <DisplaySection
                  settings={{
                    theme: displaySettings.theme,
                    language: displaySettings.language as 'en' | 'es' | 'fr' | 'de',
                    itemsPerPage: displaySettings.itemsPerPage as 10 | 25 | 50 | 100,
                  }}
                  isLoading={isSettingsSaving}
                  message={null} // Message shown globally
                  onThemeChange={setTheme}
                  onLanguageChange={setLanguage}
                  onItemsPerPageChange={setItemsPerPage}
                  onSave={handleDisplaySave}
                />
              )}

              {activeTab === 'danger' && (
                <DangerZoneSection
                  isLoading={isDangerLoading}
                  message={null} // Message shown globally
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
