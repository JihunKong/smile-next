/**
 * useUserSettings Hook Tests
 *
 * TDD tests for the useUserSettings hook that handles user preferences,
 * notifications, privacy settings, and display settings management.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useUserSettings } from '@/features/user/hooks/useUserSettings'
import type { UserPreferences } from '@/features/user/types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Sample test data
const mockPreferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  emailDigest: true,
  emailFrequency: 'daily',
  showOnlineStatus: true,
  showActivityStatus: true,
  fontSize: 'medium',
  reduceMotion: false,
  additionalSettings: {
    groupUpdates: true,
    activityReminders: true,
    questionResponses: true,
    showRealName: true,
    allowDirectMessages: true,
    itemsPerPage: 25,
  },
}

describe('useUserSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('returns loading=true initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useUserSettings())

      expect(result.current.isLoading).toBe(true)
    })

    it('returns null preferences initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserSettings())

      expect(result.current.preferences).toBeNull()
    })

    it('returns null error initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserSettings())

      expect(result.current.error).toBeNull()
    })

    it('returns null message initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserSettings())

      expect(result.current.message).toBeNull()
    })

    it('returns default notification settings', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserSettings())

      expect(result.current.notifications).toEqual({
        emailNotifications: true,
        groupUpdates: true,
        activityReminders: true,
        questionResponses: true,
      })
    })

    it('returns default privacy settings', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserSettings())

      expect(result.current.privacy).toEqual({
        profileVisible: true,
        showRealName: true,
        allowDirectMessages: true,
      })
    })
  })

  describe('Data Fetching', () => {
    it('fetches preferences on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/api/user/preferences')
    })

    it('sets loading=false after fetch completes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('populates preferences on successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.preferences).not.toBeNull()
      })

      expect(result.current.preferences?.theme).toBe('light')
      expect(result.current.preferences?.language).toBe('en')
    })

    it('syncs notification settings from fetched preferences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockPreferences,
            emailDigest: false,
            additionalSettings: {
              ...mockPreferences.additionalSettings,
              groupUpdates: false,
            },
          },
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.notifications.emailNotifications).toBe(false)
      expect(result.current.notifications.groupUpdates).toBe(false)
    })

    it('syncs privacy settings from fetched preferences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            ...mockPreferences,
            showOnlineStatus: false,
            additionalSettings: {
              ...mockPreferences.additionalSettings,
              showRealName: false,
            },
          },
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.privacy.profileVisible).toBe(false)
      expect(result.current.privacy.showRealName).toBe(false)
    })
  })

  describe('Notification Settings', () => {
    it('updates notification setting via setNotifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.setNotifications({
          ...result.current.notifications,
          emailNotifications: false,
        })
      })

      expect(result.current.notifications.emailNotifications).toBe(false)
    })

    it('saves notification settings via saveNotifications', async () => {
      // Initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Save call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveNotifications()
      })

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/user/preferences',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('sets success message on successful save', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveNotifications()
      })

      expect(result.current.message).toEqual({
        type: 'success',
        text: 'Notification preferences saved!',
      })
    })

    it('sets error message on failed save', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Save failed' }),
      })

      await act(async () => {
        await result.current.saveNotifications()
      })

      expect(result.current.message).toEqual({
        type: 'error',
        text: 'Failed to save preferences',
      })
    })
  })

  describe('Privacy Settings', () => {
    it('updates privacy setting via setPrivacy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.setPrivacy({
          ...result.current.privacy,
          profileVisible: false,
        })
      })

      expect(result.current.privacy.profileVisible).toBe(false)
    })

    it('saves privacy settings via savePrivacy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.savePrivacy()
      })

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/user/preferences',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })

    it('sets success message on successful privacy save', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.savePrivacy()
      })

      expect(result.current.message).toEqual({
        type: 'success',
        text: 'Privacy settings saved!',
      })
    })
  })

  describe('Display Settings', () => {
    it('saves display settings via saveDisplaySettings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveDisplaySettings({
          theme: 'dark',
          language: 'ko',
          itemsPerPage: 50,
        })
      })

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/user/preferences',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"theme":"dark"'),
        })
      )
    })

    it('maps auto theme to system for API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveDisplaySettings({
          theme: 'auto' as 'light' | 'dark' | 'auto',
          language: 'en',
          itemsPerPage: 25,
        })
      })

      const lastCallBody = JSON.parse(
        mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1].body
      )
      expect(lastCallBody.theme).toBe('system')
    })

    it('sets success message on successful display save', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveDisplaySettings({
          theme: 'light',
          language: 'en',
          itemsPerPage: 25,
        })
      })

      expect(result.current.message).toEqual({
        type: 'success',
        text: 'Display settings saved!',
      })
    })
  })

  describe('Error Handling', () => {
    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
    })

    it('sets error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).not.toBeNull()
    })

    it('handles save errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.saveNotifications()
      })

      expect(result.current.message).toEqual({
        type: 'error',
        text: 'An error occurred',
      })
    })
  })

  describe('Message Management', () => {
    it('clears message via clearMessage', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveNotifications()
      })

      expect(result.current.message).not.toBeNull()

      act(() => {
        result.current.clearMessage()
      })

      expect(result.current.message).toBeNull()
    })
  })

  describe('Refetch', () => {
    it('provides refetch function to reload preferences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockPreferences, theme: 'dark' },
        }),
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.preferences?.theme).toBe('dark')
    })
  })

  describe('Loading States', () => {
    it('sets isSaving=false after save completes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Initially not saving
      expect(result.current.isSaving).toBe(false)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveNotifications()
      })

      // After save completes, isSaving should be false
      expect(result.current.isSaving).toBe(false)
    })

    it('returns isSaving state in hook', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockPreferences,
        }),
      })

      const { result } = renderHook(() => useUserSettings())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify isSaving is part of the return value
      expect(typeof result.current.isSaving).toBe('boolean')
    })
  })
})
