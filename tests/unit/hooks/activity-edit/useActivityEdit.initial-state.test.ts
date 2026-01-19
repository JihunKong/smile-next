import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useActivityEdit } from '@/app/(dashboard)/activities/[id]/edit/hooks/useActivityEdit'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useActivityEdit - Initial State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Return a never-resolving promise to test initial state
    mockFetch.mockImplementation(() => new Promise(() => {}))
  })

  it('starts with loading state true', () => {
    const { result } = renderHook(() => useActivityEdit('activity-123'))
    
    expect(result.current.loading).toBe(true)
    expect(result.current.saving).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.success).toBe(false)
    expect(result.current.activity).toBeNull()
  })

  it('has correct default basicInfo state', () => {
    const { result } = renderHook(() => useActivityEdit('activity-123'))
    
    expect(result.current.basicInfo).toEqual({
      name: '',
      description: '',
      level: '',
      visible: true,
      educationLevel: '',
      schoolSubject: '',
      topic: '',
      hideUsernames: false,
      isAnonymousAuthorAllowed: false,
    })
  })

  it('has correct default examState', () => {
    const { result } = renderHook(() => useActivityEdit('activity-123'))
    
    expect(result.current.examState).toEqual({
      timeLimitMinutes: 60,
      passingThreshold: 70,
      maxAttempts: 1,
      allowReattempts: false,
      showFeedback: true,
      showLeaderboard: true,
      anonymizeLeaderboard: false,
      randomizeQuestions: false,
      randomizeAnswerChoices: false,
      examQuestionCount: 25,
      isPublished: false,
      examInstructions: '',
      examStartDate: '',
      examEndDate: '',
      questionPoolSize: 0,
    })
  })

  it('has correct default openModeState', () => {
    const { result } = renderHook(() => useActivityEdit('activity-123'))
    
    expect(result.current.openModeState).toEqual({
      isPassFailEnabled: false,
      requiredQuestionCount: 1,
      requiredAvgLevel: 2.0,
      requiredAvgScore: 5.0,
      peerRatingsRequired: 0,
      peerResponsesRequired: 0,
      openModeInstructions: '',
    })
  })

  it('has correct default inquiryState', () => {
    const { result } = renderHook(() => useActivityEdit('activity-123'))
    
    expect(result.current.inquiryState).toEqual({
      inquiryShowLeaderboard: true,
      allowHints: false,
      maxHints: 3,
      inquiryIsPublished: false,
      inquiryTheme: '',
      referenceDocument: '',
      minWordCount: 10,
      maxWordCount: 500,
      qualityThreshold: 6.0,
      inquiryMaxAttempts: 3,
    })
  })
})
