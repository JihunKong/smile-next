import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActivityEdit } from '@/app/(dashboard)/activities/[id]/edit/hooks/useActivityEdit'
import { createMockActivity, createExamModeActivity, createInquiryModeActivity } from './fixtures'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useActivityEdit - Data Fetching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches activity on mount with correct URL', async () => {
    const mockActivity = createMockActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/activities/activity-123/edit')
    })
  })

  it('populates activity and basicInfo on successful fetch', async () => {
    const mockActivity = createMockActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.activity).toEqual(mockActivity)
    expect(result.current.basicInfo).toEqual({
      name: 'Test Activity',
      description: 'A test activity description',
      level: 'Intermediate',
      visible: true,
      educationLevel: 'High School',
      schoolSubject: 'Mathematics',
      topic: 'Algebra',
      hideUsernames: false,
      isAnonymousAuthorAllowed: true,
    })
  })

  it('populates openModeState for Open Mode activity', async () => {
    const mockActivity = createMockActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.openModeState).toEqual({
      isPassFailEnabled: true,
      requiredQuestionCount: 5,
      requiredAvgLevel: 3.0,
      requiredAvgScore: 7.0,
      peerRatingsRequired: 2,
      peerResponsesRequired: 3,
      openModeInstructions: 'Complete all questions',
    })
  })

  it('populates examState for Exam Mode activity', async () => {
    const mockActivity = createExamModeActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.examState.timeLimitMinutes).toBe(45)
    expect(result.current.examState.passingThreshold).toBe(80)
    expect(result.current.examState.maxAttempts).toBe(3)
    expect(result.current.examState.allowReattempts).toBe(true)
    expect(result.current.examState.randomizeQuestions).toBe(true)
    expect(result.current.examState.isPublished).toBe(true)
  })

  it('populates inquiryState for Inquiry Mode activity', async () => {
    const mockActivity = createInquiryModeActivity()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivity,
    })

    const { result } = renderHook(() => useActivityEdit('activity-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.inquiryState.inquiryShowLeaderboard).toBe(true)
    expect(result.current.inquiryState.allowHints).toBe(true)
    expect(result.current.inquiryState.maxHints).toBe(5)
    expect(result.current.inquiryState.inquiryIsPublished).toBe(false)
  })

  it('refetches when activityId changes', async () => {
    const mockActivity1 = createMockActivity({ id: 'activity-1', name: 'Activity 1' })
    const mockActivity2 = createMockActivity({ id: 'activity-2', name: 'Activity 2' })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivity2,
      })

    const { result, rerender } = renderHook(
      ({ id }) => useActivityEdit(id),
      { initialProps: { id: 'activity-1' } }
    )

    await waitFor(() => {
      expect(result.current?.basicInfo?.name).toBe('Activity 1')
    })

    rerender({ id: 'activity-2' })

    await waitFor(() => {
      expect(result.current?.basicInfo?.name).toBe('Activity 2')
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
