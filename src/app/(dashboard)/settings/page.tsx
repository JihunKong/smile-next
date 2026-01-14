'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDisplaySettings, Theme, Language, ItemsPerPage } from '@/hooks/useDisplaySettings'

interface UserProfile {
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
  emailDigest: boolean
  emailFrequency: 'daily' | 'weekly' | 'never'
  showOnlineStatus: boolean
  showActivityStatus: boolean
  fontSize: 'small' | 'medium' | 'large'
  reduceMotion: boolean
  additionalSettings?: {
    groupUpdates?: boolean
    activityReminders?: boolean
    questionResponses?: boolean
    showRealName?: boolean
    allowDirectMessages?: boolean
    itemsPerPage?: number
  }
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'account')
  const { settings: displaySettings, setTheme, setLanguage, setItemsPerPage, isLoaded: displaySettingsLoaded } = useDisplaySettings()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  // Account form state
  const [accountForm, setAccountForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    groupUpdates: true,
    activityReminders: true,
    questionResponses: true,
  })

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showRealName: true,
    allowDirectMessages: true,
  })

  // Fetch preferences from API
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const prefs = data.data as UserPreferences
          setPreferences(prefs)
          // Sync with local state
          setNotifications({
            emailNotifications: prefs.emailDigest,
            groupUpdates: prefs.additionalSettings?.groupUpdates ?? true,
            activityReminders: prefs.additionalSettings?.activityReminders ?? true,
            questionResponses: prefs.additionalSettings?.questionResponses ?? true,
          })
          setPrivacy({
            profileVisible: prefs.showOnlineStatus,
            showRealName: prefs.additionalSettings?.showRealName ?? true,
            allowDirectMessages: prefs.additionalSettings?.allowDirectMessages ?? true,
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setIsLoadingPreferences(false)
    }
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile(data.user)
          setAccountForm({
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            username: data.user.username || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    if (session?.user) {
      fetchProfile()
      fetchPreferences()
    }
  }, [session, fetchPreferences])

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        await update()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/password/change', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/auth/login?deleted=true')
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete account' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'password', label: 'Password', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'privacy', label: 'Privacy', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'display', label: 'Display', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'danger', label: 'Danger Zone', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ]

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to access settings.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#2E2D29] mb-8">Settings</h1>

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

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#8C1515] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 mr-3 ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Account Tab */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">Account Information</h2>
                  <form onSubmit={handleAccountSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={accountForm.firstName}
                          onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })}
                          className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={accountForm.lastName}
                          onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })}
                          className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={accountForm.username}
                        onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={session.user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-lg"
                      />
                      <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </span>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                          className="w-5 h-5 text-[#8C1515] border-gray-300 rounded focus:ring-[#8C1515]"
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    className="mt-6 px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    disabled={isLoading}
                    onClick={async () => {
                      setIsLoading(true)
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
                        setIsLoading(false)
                      }
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">Privacy Settings</h2>
                  <div className="space-y-4">
                    {Object.entries(privacy).map(([key, value]) => (
                      <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-700">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </span>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setPrivacy({ ...privacy, [key]: e.target.checked })}
                          className="w-5 h-5 text-[#8C1515] border-gray-300 rounded focus:ring-[#8C1515]"
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    className="mt-6 px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    disabled={isLoading}
                    onClick={async () => {
                      setIsLoading(true)
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
                        setIsLoading(false)
                      }
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}

              {/* Display Tab */}
              {activeTab === 'display' && (
                <div>
                  <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">Display Settings</h2>
                  <div className="space-y-6">
                    {/* Color Theme */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Color Theme
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { value: 'light' as Theme, label: 'Light' },
                          { value: 'dark' as Theme, label: 'Dark' },
                          { value: 'auto' as Theme, label: 'Auto' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setTheme(option.value)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              displaySettings.theme === option.value
                                ? 'bg-[#8C1515] text-white border-[#8C1515]'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#8C1515]'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {displaySettings.theme === 'auto'
                          ? 'Theme will match your system preferences'
                          : `Using ${displaySettings.theme} theme`}
                      </p>
                    </div>

                    {/* Language */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Language
                      </label>
                      <select
                        value={displaySettings.language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="w-full md:w-64 px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent bg-white"
                      >
                        <option value="en">English</option>
                        <option value="es">Espanol</option>
                        <option value="fr">Francais</option>
                        <option value="de">Deutsch</option>
                      </select>
                      <p className="mt-2 text-sm text-gray-500">
                        Select your preferred language for the interface
                      </p>
                    </div>

                    {/* Items Per Page */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Items Per Page
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[10, 25, 50, 100].map((count) => (
                          <button
                            key={count}
                            onClick={() => setItemsPerPage(count as ItemsPerPage)}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              displaySettings.itemsPerPage === count
                                ? 'bg-[#8C1515] text-white border-[#8C1515]'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#8C1515]'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Number of items to show in lists and tables
                      </p>
                    </div>
                  </div>
                  <button
                    className="mt-6 px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    disabled={isLoading}
                    onClick={async () => {
                      setIsLoading(true)
                      try {
                        // Map 'auto' to 'system' for API compatibility
                        const themeValue = displaySettings.theme === 'auto' ? 'system' : displaySettings.theme
                        // Map language to ko/en
                        const langValue = displaySettings.language === 'en' ? 'en' : 'ko'

                        const response = await fetch('/api/user/preferences', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            theme: themeValue,
                            language: langValue,
                            additionalSettings: {
                              itemsPerPage: displaySettings.itemsPerPage,
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
                        setIsLoading(false)
                      }
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div>
                  <h2 className="text-lg font-semibold text-red-600 mb-6">Danger Zone</h2>
                  <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                      All your data, including groups, activities, and questions will be permanently deleted.
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Deleting...' : 'Delete My Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
