import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActivityEdit } from '@/app/(dashboard)/activities/[id]/edit/hooks/useActivityEdit'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useActivityEdit - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets permission error on 403 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('You do not have permission to edit this activity')
    expect(result.current.activity).toBeNull()
  })

  it('sets not found error on 404 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Activity not found')
    expect(result.current.activity).toBeNull()
  })

  it('sets generic error on other failed responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to load activity')
  })

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })
})
