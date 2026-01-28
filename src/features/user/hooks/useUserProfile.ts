'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  UserProfile,
  UserStats,
  AccountFormData,
  BadgeData,
  FormMessage,
} from '../types'

/**
 * Return type for useUserProfile hook
 */
export interface UseUserProfileReturn {
  // State
  profile: UserProfile | null
  stats: UserStats
  badges: BadgeData | null
  form: AccountFormData
  isLoading: boolean
  isSaving: boolean
  error: string | null
  message: FormMessage | null

  // Computed values
  initials: string
  memberSinceFormatted: string
  badgeCount: number

  // Actions
  setForm: (form: AccountFormData) => void
  updateForm: (field: keyof AccountFormData, value: string) => void
  saveProfile: () => Promise<void>
  clearMessage: () => void
  refetch: () => Promise<void>
}

/**
 * Hook for managing user profile data including stats and badges
 *
 * Provides state management and API integration for the profile page.
 *
 * @example
 * ```tsx
 * const {
 *   profile,
 *   stats,
 *   form,
 *   updateForm,
 *   saveProfile,
 *   initials,
 *   isLoading
 * } = useUserProfile()
 * ```
 */
export function useUserProfile(): UseUserProfileReturn {
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Stats state with defaults
  const [stats, setStats] = useState<UserStats>({
    totalQuestions: 0,
    totalActivities: 0,
    totalGroups: 0,
    totalPoints: 0,
  })

  // Badges state
  const [badges, setBadges] = useState<BadgeData | null>(null)

  // Form state for editing
  const [form, setForm] = useState<AccountFormData>({
    firstName: '',
    lastName: '',
    username: '',
  })

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Error and message state
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<FormMessage | null>(null)

  /**
   * Fetch all profile data (stats, profile, badges)
   * Uses Promise.allSettled to handle partial failures gracefully
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [statsResult, profileResult, badgesResult] = await Promise.allSettled([
        fetch('/api/user/profile/stats'),
        fetch('/api/user/profile'),
        fetch('/api/user/badges'),
      ])

      let allFailed = true

      // Process stats response
      if (statsResult.status === 'fulfilled' && statsResult.value.ok) {
        const statsData = await statsResult.value.json()
        setStats(statsData)
        allFailed = false
      }

      // Process profile response
      if (profileResult.status === 'fulfilled' && profileResult.value.ok) {
        const profileData = await profileResult.value.json()
        const userProfile = profileData.user as UserProfile
        setProfile(userProfile)

        // Sync form state
        setForm({
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          username: userProfile.username || '',
        })
        allFailed = false
      }

      // Process badges response
      if (badgesResult.status === 'fulfilled' && badgesResult.value.ok) {
        const badgesData = await badgesResult.value.json()
        setBadges(badgesData)
        allFailed = false
      }

      // Set error only if all requests failed
      if (allFailed) {
        setError('Failed to load profile data')
      }
    } catch (err) {
      console.error('Failed to fetch profile data:', err)
      setError('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update a single form field
   */
  const updateForm = useCallback((field: keyof AccountFormData, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  /**
   * Save profile changes
   */
  const saveProfile = useCallback(async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to update profile',
        })
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setIsSaving(false)
    }
  }, [form])

  /**
   * Clear message
   */
  const clearMessage = useCallback(() => {
    setMessage(null)
  }, [])

  // Computed: User initials
  const initials = useMemo(() => {
    if (!profile) return '?'

    const firstInitial = profile.firstName?.[0] || ''
    const lastInitial = profile.lastName?.[0] || ''

    if (firstInitial || lastInitial) {
      return `${firstInitial}${lastInitial}`.toUpperCase()
    }

    // Fallback to email first letter
    return profile.email?.[0]?.toUpperCase() || '?'
  }, [profile])

  // Computed: Member since formatted
  const memberSinceFormatted = useMemo(() => {
    if (!stats.memberSince) return 'N/A'

    return new Date(stats.memberSince).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }, [stats.memberSince])

  // Computed: Badge count
  const badgeCount = useMemo(() => {
    return badges?.earnedBadges?.length || 0
  }, [badges])

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    // State
    profile,
    stats,
    badges,
    form,
    isLoading,
    isSaving,
    error,
    message,

    // Computed values
    initials,
    memberSinceFormatted,
    badgeCount,

    // Actions
    setForm,
    updateForm,
    saveProfile,
    clearMessage,
    refetch: fetchData,
  }
}
