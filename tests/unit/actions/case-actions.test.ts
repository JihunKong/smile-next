/**
 * Unit Tests for Case Mode Server Actions
 *
 * Tests all 5 server actions in case/actions.ts:
 * - startCaseAttempt
 * - saveCaseResponse
 * - submitCaseAttempt
 * - getCaseAttemptStatus
 * - updateCaseCheatingStats
 *
 * @see VIBE-0002A
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock Prisma before importing actions
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    activity: {
      findUnique: vi.fn(),
    },
    caseAttempt: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock auth
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
}))

// Mock evaluation service
vi.mock('@/lib/services/caseEvaluationService', () => ({
  evaluateCaseAttempt: vi.fn(),
}))

// Import after mocks are set up
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { evaluateCaseAttempt } from '@/lib/services/caseEvaluationService'
import {
  startCaseAttempt,
  saveCaseResponse,
  submitCaseAttempt,
  getCaseAttemptStatus,
  updateCaseCheatingStats,
} from '@/app/(dashboard)/activities/[id]/case/actions'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockUserId = 'user-123'
const mockActivityId = 'activity-456'
const mockAttemptId = 'attempt-789'

const mockSession = {
  user: { id: mockUserId, email: 'test@example.com' },
}

const mockCaseSettings = {
  scenarios: [
    { id: 'scenario-1', title: 'Scenario 1', content: 'Content 1' },
    { id: 'scenario-2', title: 'Scenario 2', content: 'Content 2' },
  ],
  timePerCase: 10,
  totalTimeLimit: 60,
  maxAttempts: 2,
  passThreshold: 6.0,
}

const mockActivity = {
  id: mockActivityId,
  mode: 3, // Case mode
  isDeleted: false,
  openModeSettings: mockCaseSettings,
  owningGroup: {
    members: [{ userId: mockUserId }],
  },
}

const mockAttempt = {
  id: mockAttemptId,
  userId: mockUserId,
  activityId: mockActivityId,
  status: 'in_progress',
  responses: {},
  startedAt: new Date('2026-01-18T10:00:00Z'),
  completedAt: null,
  totalScore: null,
  passed: null,
  tabSwitchCount: 0,
  copyAttempts: 0,
  pasteAttempts: 0,
  cheatingFlags: [],
}

const mockCompletedAttempt = {
  ...mockAttempt,
  status: 'completed',
  completedAt: new Date('2026-01-18T11:00:00Z'),
  totalScore: 7.5,
  passed: true,
}

const mockEvaluationResult = {
  scenarioResults: [
    {
      scenarioId: 'scenario-1',
      title: 'Scenario 1',
      evaluation: {
        understanding: 7,
        ingenuity: 8,
        criticalThinking: 7,
        realWorldApplication: 8,
        overallScore: 7.5,
        flawIdentified: false,
        feedback: 'Good analysis of the problem.',
        strengths: ['Clear identification of issues'],
        improvements: ['Consider more alternatives'],
      },
    },
    {
      scenarioId: 'scenario-2',
      title: 'Scenario 2',
      evaluation: {
        understanding: 8,
        ingenuity: 7,
        criticalThinking: 8,
        realWorldApplication: 7,
        overallScore: 7.5,
        flawIdentified: false,
        feedback: 'Strong solution approach.',
        strengths: ['Practical solutions'],
        improvements: ['More detail on implementation'],
      },
    },
  ],
  overallScore: 7.5,
  passed: true,
  passThreshold: 6.0,
}

// ============================================================================
// startCaseAttempt Tests
// ============================================================================

describe('startCaseAttempt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await startCaseAttempt(mockActivityId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when activity not found', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue(null)

    const result = await startCaseAttempt(mockActivityId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Activity not found')
  })

  it('returns error when user not a member of the group', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue({
      ...mockActivity,
      owningGroup: { members: [] }, // User is not a member
    })

    const result = await startCaseAttempt(mockActivityId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not a member of this group')
  })

  it('returns existing in-progress attempt', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue(mockActivity)
    ;(prisma.caseAttempt.findFirst as Mock).mockResolvedValue(mockAttempt)

    const result = await startCaseAttempt(mockActivityId)

    expect(result.success).toBe(true)
    expect(result.data?.attemptId).toBe(mockAttemptId)
    // Should not create a new attempt
    expect(prisma.caseAttempt.create).not.toHaveBeenCalled()
  })

  it('returns error when max attempts reached', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue(mockActivity)
    ;(prisma.caseAttempt.findFirst as Mock).mockResolvedValue(null)
    ;(prisma.caseAttempt.count as Mock).mockResolvedValue(2) // maxAttempts is 2

    const result = await startCaseAttempt(mockActivityId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Maximum attempts reached')
  })

  it('creates new attempt when none exists and has remaining attempts', async () => {
    const newAttemptId = 'new-attempt-123'
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue(mockActivity)
    ;(prisma.caseAttempt.findFirst as Mock).mockResolvedValue(null)
    ;(prisma.caseAttempt.count as Mock).mockResolvedValue(0) // No attempts yet
    ;(prisma.caseAttempt.create as Mock).mockResolvedValue({
      id: newAttemptId,
      userId: mockUserId,
      activityId: mockActivityId,
      status: 'in_progress',
    })

    const result = await startCaseAttempt(mockActivityId)

    expect(result.success).toBe(true)
    expect(result.data?.attemptId).toBe(newAttemptId)
    expect(prisma.caseAttempt.create).toHaveBeenCalledWith({
      data: {
        userId: mockUserId,
        activityId: mockActivityId,
        responses: {},
        status: 'in_progress',
      },
    })
  })

  it('handles database errors gracefully', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

    const result = await startCaseAttempt(mockActivityId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to start case attempt')
  })
})

// ============================================================================
// saveCaseResponse Tests
// ============================================================================

describe('saveCaseResponse', () => {
  const mockResponse = {
    issues: 'Identified issues: budget overrun, timeline slip',
    solution: 'Proposed solution: restructure the project phases',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await saveCaseResponse(mockAttemptId, 'scenario-1', mockResponse)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when attempt not found', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(null)

    const result = await saveCaseResponse(mockAttemptId, 'scenario-1', mockResponse)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Attempt not found')
  })

  it('returns error when attempt belongs to different user', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue({
      ...mockAttempt,
      userId: 'different-user-id',
    })

    const result = await saveCaseResponse(mockAttemptId, 'scenario-1', mockResponse)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Attempt not found')
  })

  it('returns error when attempt already completed', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(mockCompletedAttempt)

    const result = await saveCaseResponse(mockAttemptId, 'scenario-1', mockResponse)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Attempt already completed')
  })

  it('saves response and merges with existing responses', async () => {
    const existingResponses = {
      'scenario-1': { issues: 'Old issues', solution: 'Old solution' },
    }
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue({
      ...mockAttempt,
      responses: existingResponses,
    })
    ;(prisma.caseAttempt.update as Mock).mockResolvedValue({})

    const newResponse = {
      issues: 'New issues for scenario 2',
      solution: 'New solution for scenario 2',
    }

    const result = await saveCaseResponse(mockAttemptId, 'scenario-2', newResponse)

    expect(result.success).toBe(true)
    expect(prisma.caseAttempt.update).toHaveBeenCalledWith({
      where: { id: mockAttemptId },
      data: {
        responses: {
          'scenario-1': { issues: 'Old issues', solution: 'Old solution' },
          'scenario-2': newResponse,
        },
      },
    })
  })

  it('handles database errors gracefully', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
    ;(prisma.caseAttempt.update as Mock).mockRejectedValue(new Error('DB Error'))

    const result = await saveCaseResponse(mockAttemptId, 'scenario-1', mockResponse)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to save response')
  })
})

// ============================================================================
// submitCaseAttempt Tests
// ============================================================================

describe('submitCaseAttempt', () => {
  const mockAttemptWithActivity = {
    ...mockAttempt,
    responses: {
      'scenario-1': { issues: 'Issues 1', solution: 'Solution 1' },
      'scenario-2': { issues: 'Issues 2', solution: 'Solution 2' },
    },
    activity: {
      openModeSettings: mockCaseSettings,
      schoolSubject: 'Business',
      educationLevel: 'Graduate',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await submitCaseAttempt(mockAttemptId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Not authenticated')
  })

  it('returns error when attempt not found', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(null)

    const result = await submitCaseAttempt(mockAttemptId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Attempt not found')
  })

  it('returns error when attempt already submitted', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue({
      ...mockAttemptWithActivity,
      status: 'completed',
    })

    const result = await submitCaseAttempt(mockAttemptId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Already submitted')
  })

  it('evaluates attempt with AI service and stores results', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(mockAttemptWithActivity)
    ;(evaluateCaseAttempt as Mock).mockResolvedValue(mockEvaluationResult)
    ;(prisma.caseAttempt.update as Mock).mockResolvedValue({})

    const result = await submitCaseAttempt(mockAttemptId)

    expect(result.success).toBe(true)
    expect(result.data?.totalScore).toBe(7.5)
    expect(result.data?.passed).toBe(true)
    expect(result.data?.scenarioScores).toHaveLength(2)

    // Verify evaluation service was called
    expect(evaluateCaseAttempt).toHaveBeenCalledWith(
      mockCaseSettings.scenarios,
      mockAttemptWithActivity.responses,
      {
        subject: 'Business',
        educationLevel: 'Graduate',
      }
    )

    // Verify attempt was updated
    expect(prisma.caseAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockAttemptId },
        data: expect.objectContaining({
          status: 'completed',
          totalScore: 7.5,
          passed: true,
        }),
      })
    )
  })

  it('calculates time spent correctly', async () => {
    // Create attempt that started 30 minutes ago
    const startTime = new Date(Date.now() - 30 * 60 * 1000)
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue({
      ...mockAttemptWithActivity,
      startedAt: startTime,
    })
    ;(evaluateCaseAttempt as Mock).mockResolvedValue(mockEvaluationResult)
    ;(prisma.caseAttempt.update as Mock).mockResolvedValue({})

    await submitCaseAttempt(mockAttemptId)

    expect(prisma.caseAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          timeSpentSeconds: expect.any(Number),
        }),
      })
    )

    // Get the actual timeSpentSeconds from the call
    const updateCall = (prisma.caseAttempt.update as Mock).mock.calls[0][0]
    const timeSpent = updateCall.data.timeSpentSeconds
    // Should be approximately 1800 seconds (30 minutes), allow some tolerance
    expect(timeSpent).toBeGreaterThanOrEqual(1795)
    expect(timeSpent).toBeLessThanOrEqual(1810)
  })

  it('handles AI service errors gracefully', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(mockAttemptWithActivity)
    ;(evaluateCaseAttempt as Mock).mockRejectedValue(new Error('AI Service Error'))

    const result = await submitCaseAttempt(mockAttemptId)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to submit attempt')
  })
})

// ============================================================================
// getCaseAttemptStatus Tests
// ============================================================================

describe('getCaseAttemptStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when not authenticated', async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await getCaseAttemptStatus(mockActivityId)

    expect(result).toBeNull()
  })

  it('returns not_started status when no attempts exist', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue({
      openModeSettings: mockCaseSettings,
    })
    ;(prisma.caseAttempt.findMany as Mock).mockResolvedValue([])

    const result = await getCaseAttemptStatus(mockActivityId)

    expect(result?.status).toBe('not_started')
    expect(result?.attemptsUsed).toBe(0)
    expect(result?.maxAttempts).toBe(2)
    expect(result?.allAttempts).toEqual([])
  })

  it('returns in_progress status with scenario completion info', async () => {
    const inProgressAttempt = {
      id: mockAttemptId,
      status: 'in_progress',
      startedAt: new Date(),
      completedAt: null,
      totalScore: null,
      passed: null,
      timeSpentSeconds: null,
      responses: {
        'scenario-1': { issues: 'Issues', solution: 'Solution' },
      },
    }
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue({
      openModeSettings: mockCaseSettings,
    })
    ;(prisma.caseAttempt.findMany as Mock).mockResolvedValue([inProgressAttempt])

    const result = await getCaseAttemptStatus(mockActivityId)

    expect(result?.status).toBe('in_progress')
    expect(result?.attemptId).toBe(mockAttemptId)
    expect(result?.scenariosCompleted).toBe(1)
    expect(result?.totalScenarios).toBe(2)
  })

  it('returns completed status with best score when all attempts completed', async () => {
    const completedAttempts = [
      {
        id: 'attempt-1',
        status: 'completed',
        startedAt: new Date('2026-01-17T10:00:00Z'),
        completedAt: new Date('2026-01-17T11:00:00Z'),
        totalScore: 6.5,
        passed: true,
        timeSpentSeconds: 3600,
        responses: {},
      },
      {
        id: 'attempt-2',
        status: 'completed',
        startedAt: new Date('2026-01-18T10:00:00Z'),
        completedAt: new Date('2026-01-18T11:00:00Z'),
        totalScore: 8.0,
        passed: true,
        timeSpentSeconds: 3000,
        responses: {},
      },
    ]
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue({
      openModeSettings: mockCaseSettings,
    })
    ;(prisma.caseAttempt.findMany as Mock).mockResolvedValue(completedAttempts)

    const result = await getCaseAttemptStatus(mockActivityId)

    expect(result?.status).toBe('completed')
    expect(result?.bestScore).toBe(8.0) // Best of the two attempts
    expect(result?.attemptsUsed).toBe(2)
    expect(result?.maxAttempts).toBe(2)
    expect(result?.allAttempts).toHaveLength(2)
  })

  it('includes all attempts in history', async () => {
    const allAttempts = [
      {
        id: 'attempt-1',
        status: 'completed',
        startedAt: new Date('2026-01-17T10:00:00Z'),
        completedAt: new Date('2026-01-17T11:00:00Z'),
        totalScore: 6.5,
        passed: true,
        timeSpentSeconds: 3600,
        responses: {},
      },
    ]
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockResolvedValue({
      openModeSettings: mockCaseSettings,
    })
    ;(prisma.caseAttempt.findMany as Mock).mockResolvedValue(allAttempts)

    const result = await getCaseAttemptStatus(mockActivityId)

    expect(result?.allAttempts).toBeDefined()
    expect(result?.allAttempts?.[0]).toEqual({
      id: 'attempt-1',
      status: 'completed',
      startedAt: allAttempts[0].startedAt,
      completedAt: allAttempts[0].completedAt,
      score: 6.5,
      passed: true,
      timeSpentSeconds: 3600,
    })
  })

  it('handles database errors gracefully', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

    const result = await getCaseAttemptStatus(mockActivityId)

    expect(result).toBeNull()
  })
})

// ============================================================================
// updateCaseCheatingStats Tests
// ============================================================================

describe('updateCaseCheatingStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when not authenticated', async () => {
    ;(auth as Mock).mockResolvedValue(null)

    const result = await updateCaseCheatingStats(mockAttemptId, {
      tabSwitchCount: 1,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('You must be logged in')
  })

  it('returns error when attempt not found', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(null)

    const result = await updateCaseCheatingStats(mockAttemptId, {
      tabSwitchCount: 1,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Attempt not found')
  })

  it('returns error when attempt belongs to different user', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue({
      ...mockAttempt,
      userId: 'different-user-id',
    })

    const result = await updateCaseCheatingStats(mockAttemptId, {
      tabSwitchCount: 1,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Attempt not found')
  })

  it('returns error when attempt already completed', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(mockCompletedAttempt)

    const result = await updateCaseCheatingStats(mockAttemptId, {
      tabSwitchCount: 1,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('This case study has already been completed')
  })

  it('updates cheating stats with new counts', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
    ;(prisma.caseAttempt.update as Mock).mockResolvedValue({})

    const result = await updateCaseCheatingStats(mockAttemptId, {
      tabSwitchCount: 3,
      copyAttempts: 2,
      pasteAttempts: 1,
    })

    expect(result.success).toBe(true)
    expect(prisma.caseAttempt.update).toHaveBeenCalledWith({
      where: { id: mockAttemptId },
      data: {
        tabSwitchCount: 3,
        copyAttempts: 2,
        pasteAttempts: 1,
        cheatingFlags: [],
      },
    })
  })

  it('merges new cheating flags with existing ones', async () => {
    const existingFlags = [
      { type: 'tab_switch', timestamp: '2026-01-18T10:00:00Z' },
    ]
    const newFlags = [
      { type: 'copy_attempt', timestamp: '2026-01-18T10:05:00Z' },
      { type: 'paste_attempt', timestamp: '2026-01-18T10:06:00Z' },
    ]
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue({
      ...mockAttempt,
      cheatingFlags: existingFlags,
    })
    ;(prisma.caseAttempt.update as Mock).mockResolvedValue({})

    const result = await updateCaseCheatingStats(mockAttemptId, {
      cheatingFlags: newFlags,
    })

    expect(result.success).toBe(true)
    expect(prisma.caseAttempt.update).toHaveBeenCalledWith({
      where: { id: mockAttemptId },
      data: {
        tabSwitchCount: 0, // Uses existing value from attempt
        copyAttempts: 0,
        pasteAttempts: 0,
        cheatingFlags: [...existingFlags, ...newFlags],
      },
    })
  })

  it('preserves existing counts when not provided', async () => {
    const existingAttempt = {
      ...mockAttempt,
      tabSwitchCount: 5,
      copyAttempts: 3,
      pasteAttempts: 2,
    }
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(existingAttempt)
    ;(prisma.caseAttempt.update as Mock).mockResolvedValue({})

    // Only update tabSwitchCount
    const result = await updateCaseCheatingStats(mockAttemptId, {
      tabSwitchCount: 6,
    })

    expect(result.success).toBe(true)
    expect(prisma.caseAttempt.update).toHaveBeenCalledWith({
      where: { id: mockAttemptId },
      data: {
        tabSwitchCount: 6, // Updated
        copyAttempts: 3, // Preserved
        pasteAttempts: 2, // Preserved
        cheatingFlags: [],
      },
    })
  })

  it('handles database errors gracefully', async () => {
    ;(auth as Mock).mockResolvedValue(mockSession)
    ;(prisma.caseAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
    ;(prisma.caseAttempt.update as Mock).mockRejectedValue(new Error('DB Error'))

    const result = await updateCaseCheatingStats(mockAttemptId, {
      tabSwitchCount: 1,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to update stats')
  })
})
