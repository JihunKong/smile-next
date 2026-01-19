import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActivityEdit } from '@/app/(dashboard)/activities/[id]/edit/hooks/useActivityEdit'
import { createMockActivity, createExamModeActivity, createInquiryModeActivity } from './fixtures'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useActivityEdit - Form Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits Open Mode activity with correct payload', async () => {
    const mockActivity = createMockActivity()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    
    const submitCall = mockFetch.mock.calls[1]
    expect(submitCall[0]).toBe('/api/activities/activity-123/edit')
    expect(submitCall[1].method).toBe('PATCH')
    
    const body = JSON.parse(submitCall[1].body)
    expect(body.name).toBe('Test Activity')
    expect(body.openModeSettings).toBeDefined()
    expect(body.openModeSettings.is_pass_fail_enabled).toBe(true)
    expect(body.openModeSettings.required_question_count).toBe(5)
  })

  it('submits Exam Mode activity with correct payload', async () => {
    const mockActivity = createExamModeActivity()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    const submitCall = mockFetch.mock.calls[1]
    const body = JSON.parse(submitCall[1].body)
    
    expect(body.examSettings).toBeDefined()
    expect(body.examSettings.time_limit_minutes).toBe(45)
    expect(body.examSettings.passing_threshold).toBe(80)
    expect(body.examSettings.randomize_questions).toBe(true)
    expect(body.openModeSettings).toBeUndefined()
  })

  it('submits Inquiry Mode activity with correct payload', async () => {
    const mockActivity = createInquiryModeActivity()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    const submitCall = mockFetch.mock.calls[1]
    const body = JSON.parse(submitCall[1].body)
    
    expect(body.inquirySettings).toBeDefined()
    expect(body.inquirySettings.show_leaderboard).toBe(true)
    expect(body.inquirySettings.allow_hints).toBe(true)
    expect(body.inquirySettings.max_hints).toBe(5)
  })

  it('sets saving to true then false during submission', async () => {
    const mockActivity = createMockActivity()
    const savingStates: boolean[] = []
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      })
      .mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { ok: true, json: async () => ({ success: true }) }
      })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    savingStates.push(result.current.saving)

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(result.current.saving).toBe(false)
    expect(savingStates[0]).toBe(false)
  })

  it('sets success state on successful submission', async () => {
    const mockActivity = createMockActivity()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current?.loading).toBe(false)
    })

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(result.current.success).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('sets error on failed submission', async () => {
    const mockActivity = createMockActivity()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Validation failed' }),
      })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current?.loading).toBe(false)
    })

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(result.current.error).toBe('Validation failed')
    expect(result.current.success).toBe(false)
  })

  it('does not submit if activity is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current?.loading).toBe(false)
    })

    const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent

    await act(async () => {
      await result.current.handleSubmit(mockEvent)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
