import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActivityEdit } from '@/app/(dashboard)/activities/[id]/edit/hooks/useActivityEdit'
import { createMockActivity, createExamModeActivity, createInquiryModeActivity } from './fixtures'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useActivityEdit - State Setters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('setBasicInfo updates basicInfo state', async () => {
    const mockActivity = createMockActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setBasicInfo((prev) => ({ ...prev, name: 'Updated Name' }))
    })

    expect(result.current.basicInfo.name).toBe('Updated Name')
  })

  it('setExamState updates examState', async () => {
    const mockActivity = createExamModeActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setExamState((prev) => ({ ...prev, timeLimitMinutes: 90 }))
    })

    expect(result.current.examState.timeLimitMinutes).toBe(90)
  })

  it('setOpenModeState updates openModeState', async () => {
    const mockActivity = createMockActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setOpenModeState((prev) => ({ ...prev, requiredQuestionCount: 10 }))
    })

    expect(result.current.openModeState.requiredQuestionCount).toBe(10)
  })

  it('setInquiryState updates inquiryState', async () => {
    const mockActivity = createInquiryModeActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setInquiryState((prev) => ({ ...prev, maxHints: 10 }))
    })

    expect(result.current.inquiryState.maxHints).toBe(10)
  })
})
