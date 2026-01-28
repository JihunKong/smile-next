/**
 * useUserProfile Hook Tests
 *
 * TDD tests for the useUserProfile hook that handles user profile,
 * stats, and badges fetching, as well as profile updates.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useUserProfile } from '@/features/user/hooks/useUserProfile'
import type { UserProfile, UserStats } from '@/features/user/types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Sample test data
const mockProfile: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  email: 'john@example.com',
  avatarUrl: 'https://example.com/avatar.jpg',
}

const mockStats: UserStats = {
  totalQuestions: 25,
  totalActivities: 10,
  totalGroups: 3,
  totalPoints: 500,
  memberSince: '2024-01-01T00:00:00Z',
  levelInfo: {
    current: {
      tier: {
        name: 'SMILE Explorer',
        icon: '🌟',
      },
    },
  },
}

const mockBadges = {
  earnedBadges: [
    { id: 'badge-1' },
    { id: 'badge-2' },
  ],
}

describe('useUserProfile', () => {
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

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.isLoading).toBe(true)
    })

    it('returns null profile initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.profile).toBeNull()
    })

    it('returns default stats initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.stats).toEqual({
        totalQuestions: 0,
        totalActivities: 0,
        totalGroups: 0,
        totalPoints: 0,
      })
    })

    it('returns null badges initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.badges).toBeNull()
    })

    it('returns null error initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.error).toBeNull()
    })

    it('returns default form state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.form).toEqual({
        firstName: '',
        lastName: '',
        username: '',
      })
    })
  })

  describe('Data Fetching', () => {
    it('fetches profile, stats, and badges on mount', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenCalledWith('/api/user/profile/stats')
      expect(mockFetch).toHaveBeenCalledWith('/api/user/profile')
      expect(mockFetch).toHaveBeenCalledWith('/api/user/badges')
    })

    it('sets loading=false after fetch completes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('populates profile on successful fetch', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.profile).not.toBeNull()
      })

      expect(result.current.profile?.firstName).toBe('John')
      expect(result.current.profile?.lastName).toBe('Doe')
      expect(result.current.profile?.email).toBe('john@example.com')
    })

    it('populates stats on successful fetch', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.stats.totalPoints).toBe(500)
      })

      expect(result.current.stats.totalQuestions).toBe(25)
      expect(result.current.stats.totalActivities).toBe(10)
      expect(result.current.stats.totalGroups).toBe(3)
    })

    it('populates badges on successful fetch', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.badges).not.toBeNull()
      })

      expect(result.current.badges?.earnedBadges).toHaveLength(2)
    })

    it('syncs form state from fetched profile', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.form.firstName).toBe('John')
      })

      expect(result.current.form.lastName).toBe('Doe')
      expect(result.current.form.username).toBe('johndoe')
    })

    it('handles null profile values in form', async () => {
      const profileWithNulls = {
        ...mockProfile,
        firstName: null,
        lastName: null,
        username: null,
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: profileWithNulls }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.form.firstName).toBe('')
      expect(result.current.form.lastName).toBe('')
      expect(result.current.form.username).toBe('')
    })
  })

  describe('Form Management', () => {
    it('updates form via setForm', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.setForm({
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janesmith',
        })
      })

      expect(result.current.form.firstName).toBe('Jane')
      expect(result.current.form.lastName).toBe('Smith')
      expect(result.current.form.username).toBe('janesmith')
    })

    it('updates individual form field via updateForm', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updateForm('firstName', 'Jane')
      })

      expect(result.current.form.firstName).toBe('Jane')
      expect(result.current.form.lastName).toBe('Doe') // Unchanged
    })
  })

  describe('Profile Update', () => {
    it('saves profile via saveProfile', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock the PUT request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveProfile()
      })

      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/user/profile',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
          }),
        })
      )
    })

    it('sets success message on successful save', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveProfile()
      })

      expect(result.current.message).toEqual({
        type: 'success',
        text: 'Profile updated successfully!',
      })
    })

    it('sets error message on failed save', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Username already taken' }),
      })

      await act(async () => {
        await result.current.saveProfile()
      })

      expect(result.current.message).toEqual({
        type: 'error',
        text: 'Username already taken',
      })
    })

    it('uses default error message when API error is empty', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      await act(async () => {
        await result.current.saveProfile()
      })

      expect(result.current.message).toEqual({
        type: 'error',
        text: 'Failed to update profile',
      })
    })

    it('handles network errors during save', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.saveProfile()
      })

      expect(result.current.message).toEqual({
        type: 'error',
        text: 'An error occurred',
      })
    })
  })

  describe('Computed Values', () => {
    it('computes initials from profile', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.profile).not.toBeNull()
      })

      expect(result.current.initials).toBe('JD')
    })

    it('uses email first letter when names are null', async () => {
      const profileWithNulls = {
        ...mockProfile,
        firstName: null,
        lastName: null,
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: profileWithNulls }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.profile).not.toBeNull()
      })

      expect(result.current.initials).toBe('J') // From john@example.com
    })

    it('returns ? when no profile', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.initials).toBe('?')
    })

    it('computes memberSince date string', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.stats.memberSince).toBeDefined()
      })

      expect(result.current.memberSinceFormatted).toBe('January 2024')
    })

    it('returns N/A when memberSince is not set', async () => {
      const statsWithoutDate = { ...mockStats, memberSince: undefined }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => statsWithoutDate,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.memberSinceFormatted).toBe('N/A')
    })

    it('computes badge count', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.badges).not.toBeNull()
      })

      expect(result.current.badgeCount).toBe(2)
    })

    it('returns 0 badge count when no badges', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useUserProfile())

      expect(result.current.badgeCount).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('sets error when stats fetch fails', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Stats fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Profile should still load even if stats failed
      expect(result.current.profile).not.toBeNull()
    })

    it('handles all requests failing gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load profile data')
    })
  })

  describe('Message Management', () => {
    it('clears message via clearMessage', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveProfile()
      })

      expect(result.current.message).not.toBeNull()

      act(() => {
        result.current.clearMessage()
      })

      expect(result.current.message).toBeNull()
    })
  })

  describe('Refetch', () => {
    it('provides refetch function to reload all data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const updatedStats = { ...mockStats, totalPoints: 1000 }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.stats.totalPoints).toBe(1000)
    })
  })

  describe('Loading States', () => {
    it('sets isSaving=false after save completes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStats,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockProfile }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockBadges,
        })

      const { result } = renderHook(() => useUserProfile())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isSaving).toBe(false)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.saveProfile()
      })

      expect(result.current.isSaving).toBe(false)
    })
  })
})
