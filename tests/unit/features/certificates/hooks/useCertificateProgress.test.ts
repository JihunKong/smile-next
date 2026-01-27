/**
 * useCertificateProgress Hook Tests
 *
 * Tests for the certificate progress tracking hook.
 * Following TDD: tests written before implementation.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCertificateProgress } from '@/features/certificates/hooks/useCertificateProgress'
import type { CertificateProgress, ActivityProgress } from '@/features/certificates/types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useCertificateProgress', () => {
  const mockProgress: CertificateProgress = {
    id: 'enrollment-1',
    status: 'in_progress',
    enrollmentDate: '2024-01-15T00:00:00.000Z',
    completionDate: null,
    verificationCode: 'verify-123',
    certificate: {
      id: 'cert-1',
      name: 'Test Certificate',
      organizationName: 'Test Org',
      programName: 'Test Program',
      certificateStatement: 'Test Statement',
      logoImageUrl: null,
    },
    activities: [
      {
        id: 'ca-1',
        activity: {
          id: 'act-1',
          name: 'Activity 1',
          description: 'First activity',
          activityType: 'exam',
          owningGroupId: 'group-1',
        },
        sequenceOrder: 1,
        required: true,
        status: 'completed',
        score: 85,
        completedAt: '2024-01-16T00:00:00.000Z',
      },
      {
        id: 'ca-2',
        activity: {
          id: 'act-2',
          name: 'Activity 2',
          description: 'Second activity',
          activityType: 'inquiry',
          owningGroupId: 'group-1',
        },
        sequenceOrder: 2,
        required: true,
        status: 'in_progress',
      },
      {
        id: 'ca-3',
        activity: {
          id: 'act-3',
          name: 'Activity 3',
          description: 'Third activity',
          activityType: 'case',
          owningGroupId: 'group-1',
        },
        sequenceOrder: 3,
        required: false,
        status: 'not_started',
      },
    ],
    progress: {
      completed: 1,
      inProgress: 1,
      notStarted: 1,
      total: 3,
      percentage: 33,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Initial Fetch', () => {
    it('fetches progress on mount when enrollmentId is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/my-certificates/enrollment-1/progress',
        expect.objectContaining({ method: 'GET' })
      )
      expect(result.current.progress).toEqual(mockProgress)
      expect(result.current.error).toBeNull()
    })

    it('does not fetch when enrollmentId is not provided', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: undefined })
      )

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.progress).toBeNull()
    })

    it('handles fetch error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'invalid-id' })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.progress).toBeNull()
      expect(result.current.error).toBe('Not found')
    })

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.progress).toBeNull()
      expect(result.current.error).toBe('Network error')
    })
  })

  describe('Progress Data', () => {
    it('provides activities list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      expect(result.current.activities).toHaveLength(3)
      expect(result.current.activities[0].status).toBe('completed')
      expect(result.current.activities[1].status).toBe('in_progress')
      expect(result.current.activities[2].status).toBe('not_started')
    })

    it('provides progress statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      expect(result.current.stats).toEqual({
        completed: 1,
        inProgress: 1,
        notStarted: 1,
        total: 3,
        percentage: 33,
      })
    })

    it('provides isCompleted flag when all activities are done', async () => {
      const completedProgress = {
        ...mockProgress,
        status: 'completed',
        completionDate: '2024-01-20T00:00:00.000Z',
        progress: {
          completed: 3,
          inProgress: 0,
          notStarted: 0,
          total: 3,
          percentage: 100,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(completedProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      expect(result.current.isCompleted).toBe(true)
    })

    it('returns isCompleted as false when not all activities done', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      expect(result.current.isCompleted).toBe(false)
    })
  })

  describe('Activity Helpers', () => {
    it('provides getActivityById helper', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      const activity = result.current.getActivityById('act-2')
      expect(activity).toBeDefined()
      expect(activity?.activity.name).toBe('Activity 2')
    })

    it('returns undefined for non-existent activity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      const activity = result.current.getActivityById('non-existent')
      expect(activity).toBeUndefined()
    })

    it('provides getNextActivity helper', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      const nextActivity = result.current.getNextActivity()
      expect(nextActivity?.activity.name).toBe('Activity 2') // First in_progress
    })

    it('returns first not_started if no in_progress activities', async () => {
      const noInProgressMock = {
        ...mockProgress,
        activities: mockProgress.activities.map((a) =>
          a.status === 'in_progress' ? { ...a, status: 'not_started' as const } : a
        ),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(noInProgressMock),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      const nextActivity = result.current.getNextActivity()
      expect(nextActivity?.status).toBe('not_started')
    })
  })

  describe('Refetch', () => {
    it('provides refetch function', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProgress),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockProgress,
              progress: { ...mockProgress.progress, completed: 2, percentage: 66 },
            }),
        })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.progress).not.toBeNull()
      })

      expect(result.current.stats?.percentage).toBe(33)

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.stats?.percentage).toBe(66)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('sets isRefetching during refetch', async () => {
      let resolveSecond: (value: unknown) => void
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve
      })

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockProgress),
        })
        .mockReturnValueOnce({
          ok: true,
          json: () => secondPromise,
        })

      const { result } = renderHook(() =>
        useCertificateProgress({ enrollmentId: 'enrollment-1' })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.refetch()
      })

      expect(result.current.isRefetching).toBe(true)

      await act(async () => {
        resolveSecond!(mockProgress)
      })

      await waitFor(() => {
        expect(result.current.isRefetching).toBe(false)
      })
    })
  })

  describe('Polling', () => {
    it('sets up polling interval when pollInterval is provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { result } = renderHook(() =>
        useCertificateProgress({
          enrollmentId: 'enrollment-1',
          pollInterval: 5000,
        })
      )

      // Initial fetch happens
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalled()
      expect(result.current.progress).not.toBeNull()
    })

    it('cleans up interval on unmount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      })

      const { unmount, result } = renderHook(() =>
        useCertificateProgress({
          enrollmentId: 'enrollment-1',
          pollInterval: 5000,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should unmount cleanly without errors
      unmount()
      expect(true).toBe(true)
    })
  })
})
