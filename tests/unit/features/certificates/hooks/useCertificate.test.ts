/**
 * useCertificate Hook Tests
 *
 * TDD tests for the useCertificate hook that handles single certificate
 * fetching and mutations.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCertificate } from '@/features/certificates/hooks/useCertificate'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Sample test data
const mockCertificate = {
  id: 'cert-1',
  name: 'Web Development Certificate',
  organizationName: 'Tech Academy',
  programName: 'Full Stack Program',
  certificateStatement: 'This certifies that the student has completed...',
  studentInstructions: 'Complete all activities in order.',
  signatoryName: 'Dr. Jane Smith',
  logoImageUrl: 'https://example.com/logo.png',
  backgroundImageUrl: null,
  qrPosition: 'bottom-right',
  logoPosition: 'top-left',
  status: 'published',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T10:00:00Z',
  createdById: 'user-1',
  _count: { activities: 5, studentCertificates: 100 },
  activities: [
    {
      id: 'ca-1',
      activityId: 'act-1',
      certificateId: 'cert-1',
      sequenceOrder: 0,
      required: true,
      activity: {
        id: 'act-1',
        name: 'Introduction to HTML',
        description: 'Learn the basics of HTML',
        activityType: 'quiz',
        owningGroupId: 'group-1',
      },
    },
    {
      id: 'ca-2',
      activityId: 'act-2',
      certificateId: 'cert-1',
      sequenceOrder: 1,
      required: true,
      activity: {
        id: 'act-2',
        name: 'CSS Fundamentals',
        description: 'Learn CSS styling',
        activityType: 'quiz',
        owningGroupId: 'group-1',
      },
    },
  ],
}

describe('useCertificate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('returns loading=true when id is provided', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useCertificate('cert-1'))

      expect(result.current.loading).toBe(true)
    })

    it('returns loading=false when id is undefined', () => {
      const { result } = renderHook(() => useCertificate(undefined))

      expect(result.current.loading).toBe(false)
    })

    it('returns null certificate initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useCertificate('cert-1'))

      expect(result.current.certificate).toBeNull()
    })

    it('returns null error initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useCertificate('cert-1'))

      expect(result.current.error).toBeNull()
    })
  })

  describe('Data Fetching', () => {
    it('fetches certificate by id on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCertificate,
      })

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith('/api/certificates/cert-1')
    })

    it('populates certificate data on successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCertificate,
      })

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.certificate).not.toBeNull()
      })

      expect(result.current.certificate?.name).toBe('Web Development Certificate')
      expect(result.current.certificate?.activities).toHaveLength(2)
    })

    it('includes activities in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCertificate,
      })

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.certificate?.activities).toHaveLength(2)
      })

      expect(result.current.certificate?.activities?.[0].activity.name).toBe(
        'Introduction to HTML'
      )
    })

    it('does not fetch when id is undefined', () => {
      renderHook(() => useCertificate(undefined))

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('refetches when id changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockCertificate,
      })

      const { result, rerender } = renderHook(
        ({ id }) => useCertificate(id),
        { initialProps: { id: 'cert-1' } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/certificates/cert-1')

      // Change ID
      rerender({ id: 'cert-2' })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/certificates/cert-2')
      })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Mutations', () => {
    it('provides updateCertificate function', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCertificate,
      })

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(typeof result.current.updateCertificate).toBe('function')
    })

    it('updates local state optimistically', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCertificate,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockCertificate, name: 'Updated Name' }),
        })

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.certificate).not.toBeNull()
      })

      act(() => {
        result.current.updateCertificate({ name: 'Updated Name' })
      })

      // Should update immediately (optimistically)
      expect(result.current.certificate?.name).toBe('Updated Name')
    })

    it('provides saving state during mutation', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCertificate,
        })
        .mockImplementationOnce(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.certificate).not.toBeNull()
      })

      expect(result.current.saving).toBe(false)

      act(() => {
        result.current.updateCertificate({ name: 'Updated Name' })
      })

      expect(result.current.saving).toBe(true)
    })

    it('reverts on API error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCertificate,
        })
        .mockRejectedValueOnce(new Error('Update failed'))

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.certificate).not.toBeNull()
      })

      const originalName = result.current.certificate?.name

      await act(async () => {
        try {
          await result.current.updateCertificate({ name: 'Updated Name' })
        } catch {
          // Expected to throw
        }
      })

      // Should revert to original
      expect(result.current.certificate?.name).toBe(originalName)
    })
  })

  describe('Error Handling', () => {
    it('sets error on 404 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Certificate not found' }),
      })

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).not.toBeNull()
      expect(result.current.notFound).toBe(true)
    })

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Network error')
    })

    it('provides refetch function', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCertificate('cert-1'))

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCertificate,
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.certificate).not.toBeNull()
    })
  })
})
