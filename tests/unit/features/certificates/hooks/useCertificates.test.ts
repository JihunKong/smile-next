/**
 * useCertificates Hook Tests
 *
 * TDD tests for the useCertificates hook that handles certificate list
 * fetching, filtering, sorting, and pagination.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCertificates } from '@/features/certificates/hooks/useCertificates'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Sample test data
const mockCertificates = [
  {
    id: 'cert-1',
    name: 'Web Development Certificate',
    organizationName: 'Tech Academy',
    programName: 'Full Stack Program',
    certificateStatement: null,
    logoImageUrl: null,
    status: 'published',
    createdAt: '2024-01-15T10:00:00Z',
    _count: { activities: 5, studentCertificates: 100 },
    isEnrolled: false,
  },
  {
    id: 'cert-2',
    name: 'Data Science Fundamentals',
    organizationName: 'Data Institute',
    programName: null,
    certificateStatement: null,
    logoImageUrl: 'https://example.com/logo.png',
    status: 'published',
    createdAt: '2024-01-20T10:00:00Z',
    _count: { activities: 8, studentCertificates: 50 },
    isEnrolled: true,
    enrollmentStatus: 'enrolled',
  },
  {
    id: 'cert-3',
    name: 'AI Basics',
    organizationName: 'AI Lab',
    programName: 'AI Program',
    certificateStatement: null,
    logoImageUrl: null,
    status: 'draft',
    createdAt: '2024-01-10T10:00:00Z',
    _count: { activities: 3, studentCertificates: 0 },
    isEnrolled: false,
  },
]

const mockPagination = {
  page: 1,
  limit: 12,
  total: 3,
  totalPages: 1,
}

describe('useCertificates', () => {
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

      const { result } = renderHook(() => useCertificates())

      expect(result.current.loading).toBe(true)
    })

    it('returns empty certificates array initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useCertificates())

      expect(result.current.certificates).toEqual([])
    })

    it('returns null error initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useCertificates())

      expect(result.current.error).toBeNull()
    })

    it('returns default filter values', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useCertificates())

      expect(result.current.search).toBe('')
      expect(result.current.sortBy).toBe('newest')
      expect(result.current.page).toBe(1)
    })
  })

  describe('Data Fetching', () => {
    it('fetches certificates on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/certificates/browse')
      )
    })

    it('sets loading=false after fetch completes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() => useCertificates())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('populates certificates array on successful fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.certificates).toHaveLength(3)
      })

      expect(result.current.certificates[0].name).toBe('Web Development Certificate')
      expect(result.current.certificates[1].name).toBe('Data Science Fundamentals')
    })

    it('handles empty response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: [],
          pagination: { ...mockPagination, total: 0, totalPages: 0 },
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.certificates).toEqual([])
      expect(result.current.totalPages).toBe(0)
    })

    it('sets totalPages from pagination response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: { ...mockPagination, totalPages: 5 },
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.totalPages).toBe(5)
      })
    })
  })

  describe('Search Filtering', () => {
    it('updates search value via setSearch', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setSearch('web')
      })

      expect(result.current.search).toBe('web')
    })

    it('includes search query in API request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          certificates: mockCertificates.slice(0, 1),
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() => useCertificates({ initialSearch: 'web' }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=web')
      )
    })

    it('resets page to 1 when search changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: { ...mockPagination, page: 2 },
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Set page to 2
      act(() => {
        result.current.setPage(2)
      })

      expect(result.current.page).toBe(2)

      // Change search - should reset page
      act(() => {
        result.current.setSearch('data')
      })

      expect(result.current.page).toBe(1)
    })
  })

  describe('Sorting', () => {
    it('updates sortBy value via setSortBy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setSortBy('name')
      })

      expect(result.current.sortBy).toBe('name')
    })

    it('includes sort option in API request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() => useCertificates({ initialSort: 'popular' }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=popular')
      )
    })

    it('resets page to 1 when sort changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setPage(3)
      })

      act(() => {
        result.current.setSortBy('name')
      })

      expect(result.current.page).toBe(1)
    })
  })

  describe('Pagination', () => {
    it('updates page value via setPage', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: { ...mockPagination, totalPages: 5 },
        }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setPage(2)
      })

      expect(result.current.page).toBe(2)
    })

    it('includes page in API request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      renderHook(() => useCertificates())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=1')
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('sets error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Network error')
    })

    it('sets error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).not.toBeNull()
    })

    it('provides refetch function to retry', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
      expect(result.current.certificates).toHaveLength(3)
    })

    it('clears error on successful refetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCertificates())

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Initial Options', () => {
    it('accepts initialSearch option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() =>
        useCertificates({ initialSearch: 'test' })
      )

      expect(result.current.search).toBe('test')
    })

    it('accepts initialSort option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          certificates: mockCertificates,
          pagination: mockPagination,
        }),
      })

      const { result } = renderHook(() =>
        useCertificates({ initialSort: 'popular' })
      )

      expect(result.current.sortBy).toBe('popular')
    })
  })
})
