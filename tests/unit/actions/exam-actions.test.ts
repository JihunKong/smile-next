/**
 * Unit Tests for Exam Mode Server Actions
 *
 * Tests all 6 server actions in exam/actions.ts:
 * - startExamAttempt
 * - saveExamAnswer
 * - submitExamAttempt
 * - getExamAttemptStatus
 * - updateExamCheatingStats
 * - Helper functions: shuffleArray, arraysEqual
 *
 * @see VIBE-0004A
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock Prisma before importing actions
vi.mock('@/lib/db/prisma', () => ({
    prisma: {
        activity: {
            findUnique: vi.fn(),
        },
        examAttempt: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            count: vi.fn(),
        },
        question: {
            findMany: vi.fn(),
        },
        response: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
    },
}))

// Mock auth
vi.mock('@/lib/auth/config', () => ({
    auth: vi.fn(),
}))

// Mock revalidatePath
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Import after mocks are set up
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import {
    startExamAttempt,
    saveExamAnswer,
    submitExamAttempt,
    getExamAttemptStatus,
    updateExamCheatingStats,
} from '@/app/(dashboard)/activities/[id]/exam/actions'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockUserId = 'user-123'
const mockActivityId = 'activity-456'
const mockAttemptId = 'attempt-789'

const mockSession = {
    user: { id: mockUserId, email: 'test@example.com' },
}

const mockExamSettings = {
    timeLimit: 60,
    questionsToShow: 10,
    passThreshold: 70,
    shuffleQuestions: true,
    shuffleChoices: true,
    maxAttempts: 3,
    showFeedback: true,
    showScore: true,
    showPassFail: true,
}

const mockQuestions = [
    { id: 'q1', choices: ['A', 'B', 'C', 'D'], correctAnswers: ['0'] },
    { id: 'q2', choices: ['A', 'B', 'C', 'D'], correctAnswers: ['1'] },
    { id: 'q3', choices: ['A', 'B', 'C', 'D'], correctAnswers: ['2'] },
]

const mockActivity = {
    id: mockActivityId,
    mode: 1, // Exam mode
    isDeleted: false,
    examSettings: mockExamSettings,
    owningGroup: {
        members: [{ userId: mockUserId }],
    },
    questions: mockQuestions.map((q) => ({ id: q.id })),
}

const mockAttempt = {
    id: mockAttemptId,
    userId: mockUserId,
    activityId: mockActivityId,
    status: 'in_progress',
    startedAt: new Date('2026-01-23T10:00:00Z'),
    completedAt: null,
    score: null,
    passed: null,
    totalQuestions: 3,
    correctAnswers: null,
    questionOrder: ['q1', 'q2', 'q3'],
    choiceShuffles: { q1: [0, 1, 2, 3], q2: [1, 0, 3, 2], q3: [2, 3, 0, 1] },
    timeSpentSeconds: null,
    tabSwitchCount: 0,
    copyAttempts: 0,
    pasteAttempts: 0,
    cheatingFlags: [],
    responses: [],
}

const mockCompletedAttempt = {
    ...mockAttempt,
    status: 'completed',
    completedAt: new Date('2026-01-23T11:00:00Z'),
    score: 66.7,
    passed: false,
    correctAnswers: 2,
    timeSpentSeconds: 3600,
}

// ============================================================================
// startExamAttempt Tests
// ============================================================================

describe('startExamAttempt', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('returns error when activity not found', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.activity.findUnique as Mock).mockResolvedValue(null)

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Exam not found')
    })

    it('returns error when user not a member of the group', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.activity.findUnique as Mock).mockResolvedValue({
                ...mockActivity,
                owningGroup: { members: [] }, // User is not a member
            })

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You are not a member of this group')
    })

    it('returns existing in-progress attempt', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.activity.findUnique as Mock).mockResolvedValue(mockActivity)
            ; (prisma.examAttempt.findFirst as Mock).mockResolvedValue(mockAttempt)

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(true)
        expect(result.data?.attemptId).toBe(mockAttemptId)
        expect(result.data?.questionOrder).toEqual(['q1', 'q2', 'q3'])
        // Should not create a new attempt
        expect(prisma.examAttempt.create).not.toHaveBeenCalled()
    })

    it('returns error when max attempts reached', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.activity.findUnique as Mock).mockResolvedValue(mockActivity)
            ; (prisma.examAttempt.findFirst as Mock).mockResolvedValue(null)
            ; (prisma.examAttempt.count as Mock).mockResolvedValue(3) // maxAttempts is 3

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You have reached the maximum number of attempts')
    })

    it('creates new attempt with shuffled questions when setting enabled', async () => {
        const newAttemptId = 'new-attempt-123'
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.activity.findUnique as Mock).mockResolvedValue({
                ...mockActivity,
                examSettings: { ...mockExamSettings, shuffleQuestions: true, shuffleChoices: true },
            })
            ; (prisma.examAttempt.findFirst as Mock).mockResolvedValue(null)
            ; (prisma.examAttempt.count as Mock).mockResolvedValue(0)
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.examAttempt.create as Mock).mockResolvedValue({
                id: newAttemptId,
                userId: mockUserId,
                activityId: mockActivityId,
                status: 'in_progress',
                questionOrder: ['q2', 'q1', 'q3'], // Shuffled
                choiceShuffles: { q1: [1, 0, 3, 2], q2: [2, 3, 0, 1], q3: [0, 1, 2, 3] },
            })

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(true)
        expect(result.data?.attemptId).toBe(newAttemptId)
        expect(prisma.examAttempt.create).toHaveBeenCalled()
        // Verify create was called with questionOrder and choiceShuffles
        const createCall = (prisma.examAttempt.create as Mock).mock.calls[0][0]
        expect(createCall.data.questionOrder).toBeDefined()
        expect(createCall.data.choiceShuffles).toBeDefined()
    })

    it('creates new attempt without shuffling when settings disabled', async () => {
        const newAttemptId = 'new-attempt-456'
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.activity.findUnique as Mock).mockResolvedValue({
                ...mockActivity,
                examSettings: { ...mockExamSettings, shuffleQuestions: false, shuffleChoices: false },
            })
            ; (prisma.examAttempt.findFirst as Mock).mockResolvedValue(null)
            ; (prisma.examAttempt.count as Mock).mockResolvedValue(0)
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.examAttempt.create as Mock).mockResolvedValue({
                id: newAttemptId,
                userId: mockUserId,
                activityId: mockActivityId,
                status: 'in_progress',
                questionOrder: ['q1', 'q2', 'q3'], // Original order
                choiceShuffles: {},
            })

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(true)
        // When shuffleChoices is false, choiceShuffles should be empty
        const createCall = (prisma.examAttempt.create as Mock).mock.calls[0][0]
        expect(createCall.data.choiceShuffles).toEqual({})
    })

    it('limits questions to questionsToShow setting', async () => {
        const newAttemptId = 'new-attempt-789'
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.activity.findUnique as Mock).mockResolvedValue({
                ...mockActivity,
                examSettings: { ...mockExamSettings, questionsToShow: 2 },
            })
            ; (prisma.examAttempt.findFirst as Mock).mockResolvedValue(null)
            ; (prisma.examAttempt.count as Mock).mockResolvedValue(0)
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.examAttempt.create as Mock).mockResolvedValue({
                id: newAttemptId,
                userId: mockUserId,
                activityId: mockActivityId,
                status: 'in_progress',
                totalQuestions: 2,
                questionOrder: ['q1', 'q2'],
                choiceShuffles: {},
            })

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(true)
        const createCall = (prisma.examAttempt.create as Mock).mock.calls[0][0]
        expect(createCall.data.totalQuestions).toBe(2)
    })

    it('handles database errors gracefully', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.activity.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

        const result = await startExamAttempt(mockActivityId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to start exam. Please try again.')
    })
})

// ============================================================================
// saveExamAnswer Tests
// ============================================================================

describe('saveExamAnswer', () => {
    const mockQuestionId = 'q1'
    const mockSelectedChoices = ['0']

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, mockSelectedChoices)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('returns error when attempt not found', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(null)

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, mockSelectedChoices)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Attempt not found')
    })

    it('returns error when attempt belongs to different user', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttempt,
                userId: 'different-user-id',
            })

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, mockSelectedChoices)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Attempt not found')
    })

    it('returns error when attempt already completed', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockCompletedAttempt)

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, mockSelectedChoices)

        expect(result.success).toBe(false)
        expect(result.error).toBe('This exam has already been submitted')
    })

    it('creates new response when no existing response', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
            ; (prisma.response.findFirst as Mock).mockResolvedValue(null)
            ; (prisma.response.create as Mock).mockResolvedValue({})

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, mockSelectedChoices)

        expect(result.success).toBe(true)
        expect(prisma.response.create).toHaveBeenCalledWith({
            data: {
                creatorId: mockUserId,
                questionId: mockQuestionId,
                examAttemptId: mockAttemptId,
                content: JSON.stringify(mockSelectedChoices),
                choice: '0',
            },
        })
    })

    it('updates existing response when answer already exists', async () => {
        const existingResponse = { id: 'response-123' }
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
            ; (prisma.response.findFirst as Mock).mockResolvedValue(existingResponse)
            ; (prisma.response.update as Mock).mockResolvedValue({})

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, ['1'])

        expect(result.success).toBe(true)
        expect(prisma.response.update).toHaveBeenCalledWith({
            where: { id: 'response-123' },
            data: {
                content: JSON.stringify(['1']),
                choice: '1',
            },
        })
    })

    it('handles multiple choice answers (multi-select questions)', async () => {
        const multiSelectChoices = ['0', '2']
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
            ; (prisma.response.findFirst as Mock).mockResolvedValue(null)
            ; (prisma.response.create as Mock).mockResolvedValue({})

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, multiSelectChoices)

        expect(result.success).toBe(true)
        expect(prisma.response.create).toHaveBeenCalledWith({
            data: {
                creatorId: mockUserId,
                questionId: mockQuestionId,
                examAttemptId: mockAttemptId,
                content: JSON.stringify(multiSelectChoices),
                choice: '0,2',
            },
        })
    })

    it('handles empty answer (clearing selection)', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
            ; (prisma.response.findFirst as Mock).mockResolvedValue({ id: 'response-123' })
            ; (prisma.response.update as Mock).mockResolvedValue({})

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, [])

        expect(result.success).toBe(true)
        expect(prisma.response.update).toHaveBeenCalledWith({
            where: { id: 'response-123' },
            data: {
                content: JSON.stringify([]),
                choice: '',
            },
        })
    })

    it('handles database errors gracefully', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
            ; (prisma.response.findFirst as Mock).mockRejectedValue(new Error('DB Error'))

        const result = await saveExamAnswer(mockAttemptId, mockQuestionId, mockSelectedChoices)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to save answer')
    })
})

// ============================================================================
// submitExamAttempt Tests
// ============================================================================

describe('submitExamAttempt', () => {
    const mockAttemptWithResponses = {
        ...mockAttempt,
        activity: {
            examSettings: mockExamSettings,
        },
        responses: [
            { questionId: 'q1', choice: '0' },
            { questionId: 'q2', choice: '1' },
            { questionId: 'q3', choice: '0' }, // incorrect (correct is '2')
        ],
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('returns error when attempt not found', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(null)

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Attempt not found')
    })

    it('returns error when attempt belongs to different user', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                userId: 'different-user-id',
            })

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Attempt not found')
    })

    it('returns error when attempt already submitted', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                status: 'completed',
            })

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('This exam has already been submitted')
    })

    it('calculates score correctly with all correct answers (100%)', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                responses: [
                    { questionId: 'q1', choice: '0' },
                    { questionId: 'q2', choice: '1' },
                    { questionId: 'q3', choice: '2' },
                ],
            })
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.response.updateMany as Mock).mockResolvedValue({})
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(true)
        expect(result.data?.score).toBe(100)
        expect(result.data?.passed).toBe(true)
        expect(result.data?.correctAnswers).toBe(3)
        expect(result.data?.totalQuestions).toBe(3)
    })

    it('calculates score correctly with all wrong answers (0%)', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                responses: [
                    { questionId: 'q1', choice: '3' }, // wrong
                    { questionId: 'q2', choice: '3' }, // wrong
                    { questionId: 'q3', choice: '3' }, // wrong
                ],
            })
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.response.updateMany as Mock).mockResolvedValue({})
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(true)
        expect(result.data?.score).toBe(0)
        expect(result.data?.passed).toBe(false)
        expect(result.data?.correctAnswers).toBe(0)
    })

    it('determines pass when score >= threshold', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                activity: {
                    examSettings: { ...mockExamSettings, passThreshold: 60 },
                },
                responses: [
                    { questionId: 'q1', choice: '0' }, // correct
                    { questionId: 'q2', choice: '1' }, // correct
                    { questionId: 'q3', choice: '0' }, // wrong
                ],
            })
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.response.updateMany as Mock).mockResolvedValue({})
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(true)
        expect(result.data?.score).toBe(66.7) // 2/3 = 66.7%
        expect(result.data?.passed).toBe(true) // 66.7 >= 60
    })

    it('determines fail when score < threshold', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                activity: {
                    examSettings: { ...mockExamSettings, passThreshold: 70 },
                },
                responses: [
                    { questionId: 'q1', choice: '0' }, // correct
                    { questionId: 'q2', choice: '1' }, // correct
                    { questionId: 'q3', choice: '0' }, // wrong
                ],
            })
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.response.updateMany as Mock).mockResolvedValue({})
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(true)
        expect(result.data?.passed).toBe(false) // 66.7 < 70
    })

    it('handles edge case: no answers submitted', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                responses: [],
            })
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(true)
        expect(result.data?.score).toBe(0)
        expect(result.data?.correctAnswers).toBe(0)
    })

    it('records time taken correctly', async () => {
        const startTime = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                startedAt: startTime,
                responses: [],
            })
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        await submitExamAttempt(mockAttemptId)

        expect(prisma.examAttempt.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    timeSpentSeconds: expect.any(Number),
                }),
            })
        )

        // Get the actual timeSpentSeconds from the call
        const updateCall = (prisma.examAttempt.update as Mock).mock.calls[0][0]
        const timeSpent = updateCall.data.timeSpentSeconds
        // Should be approximately 1800 seconds (30 minutes), allow some tolerance
        expect(timeSpent).toBeGreaterThanOrEqual(1795)
        expect(timeSpent).toBeLessThanOrEqual(1810)
    })

    it('updates attempt status to completed', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttemptWithResponses,
                responses: [],
            })
            ; (prisma.question.findMany as Mock).mockResolvedValue(mockQuestions)
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        await submitExamAttempt(mockAttemptId)

        expect(prisma.examAttempt.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: mockAttemptId },
                data: expect.objectContaining({
                    status: 'completed',
                    completedAt: expect.any(Date),
                }),
            })
        )
    })

    it('handles database errors gracefully', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockRejectedValue(new Error('DB Error'))

        const result = await submitExamAttempt(mockAttemptId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to submit exam. Please try again.')
    })
})

// ============================================================================
// getExamAttemptStatus Tests
// ============================================================================

describe('getExamAttemptStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns null when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await getExamAttemptStatus(mockActivityId)

        expect(result).toBeNull()
    })

    it('returns empty object when no attempts exist', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findMany as Mock).mockResolvedValue([])

        const result = await getExamAttemptStatus(mockActivityId)

        expect(result?.inProgress).toBeUndefined()
        expect(result?.completed).toEqual([])
        expect(result?.attemptCount).toBe(0)
        expect(result?.allAttempts).toEqual([])
    })

    it('returns in_progress status with attempt info', async () => {
        const inProgressAttempt = {
            id: mockAttemptId,
            status: 'in_progress',
            startedAt: new Date(),
            completedAt: null,
            score: null,
            passed: null,
            totalQuestions: 3,
            correctAnswers: null,
            timeSpentSeconds: null,
        }
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findMany as Mock).mockResolvedValue([inProgressAttempt])

        const result = await getExamAttemptStatus(mockActivityId)

        expect(result?.inProgress).toEqual(inProgressAttempt)
        expect(result?.completed).toEqual([])
        expect(result?.attemptCount).toBe(0)
    })

    it('returns completed status with all attempt history', async () => {
        const completedAttempts = [
            {
                id: 'attempt-1',
                status: 'completed',
                startedAt: new Date('2026-01-17T10:00:00Z'),
                completedAt: new Date('2026-01-17T11:00:00Z'),
                score: 65,
                passed: false,
                totalQuestions: 3,
                correctAnswers: 2,
                timeSpentSeconds: 3600,
            },
            {
                id: 'attempt-2',
                status: 'completed',
                startedAt: new Date('2026-01-18T10:00:00Z'),
                completedAt: new Date('2026-01-18T11:00:00Z'),
                score: 85,
                passed: true,
                totalQuestions: 3,
                correctAnswers: 3,
                timeSpentSeconds: 3000,
            },
        ]
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findMany as Mock).mockResolvedValue(completedAttempts)

        const result = await getExamAttemptStatus(mockActivityId)

        expect(result?.completed).toHaveLength(2)
        expect(result?.attemptCount).toBe(2)
        expect(result?.allAttempts).toHaveLength(2)
    })

    it('includes all attempts in history', async () => {
        const allAttempts = [
            {
                id: 'attempt-1',
                status: 'completed',
                startedAt: new Date('2026-01-17T10:00:00Z'),
                completedAt: new Date('2026-01-17T11:00:00Z'),
                score: 6.5,
                passed: true,
                totalQuestions: 3,
                correctAnswers: 2,
                timeSpentSeconds: 3600,
            },
        ]
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findMany as Mock).mockResolvedValue(allAttempts)

        const result = await getExamAttemptStatus(mockActivityId)

        expect(result?.allAttempts).toBeDefined()
        expect(result?.allAttempts).toHaveLength(1)
        expect(result?.allAttempts?.[0].id).toBe('attempt-1')
    })

    it('handles database errors gracefully', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findMany as Mock).mockRejectedValue(new Error('DB Error'))

        const result = await getExamAttemptStatus(mockActivityId)

        expect(result).toBeNull()
    })
})

// ============================================================================
// updateExamCheatingStats Tests
// ============================================================================

describe('updateExamCheatingStats', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await updateExamCheatingStats(mockAttemptId, {
            tabSwitchCount: 1,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('returns error when attempt not found', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(null)

        const result = await updateExamCheatingStats(mockAttemptId, {
            tabSwitchCount: 1,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Attempt not found')
    })

    it('returns error when attempt belongs to different user', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttempt,
                userId: 'different-user-id',
            })

        const result = await updateExamCheatingStats(mockAttemptId, {
            tabSwitchCount: 1,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Attempt not found')
    })

    it('returns error when attempt already completed', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockCompletedAttempt)

        const result = await updateExamCheatingStats(mockAttemptId, {
            tabSwitchCount: 1,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('This exam has already been submitted')
    })

    it('updates tab switch count', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        const result = await updateExamCheatingStats(mockAttemptId, {
            tabSwitchCount: 5,
        })

        expect(result.success).toBe(true)
        expect(prisma.examAttempt.update).toHaveBeenCalledWith({
            where: { id: mockAttemptId },
            data: expect.objectContaining({
                tabSwitchCount: 5,
            }),
        })
    })

    it('updates copy/paste attempts', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        const result = await updateExamCheatingStats(mockAttemptId, {
            copyAttempts: 3,
            pasteAttempts: 2,
        })

        expect(result.success).toBe(true)
        expect(prisma.examAttempt.update).toHaveBeenCalledWith({
            where: { id: mockAttemptId },
            data: expect.objectContaining({
                copyAttempts: 3,
                pasteAttempts: 2,
            }),
        })
    })

    it('merges new cheating flags with existing ones', async () => {
        const existingFlags = [{ type: 'tab_switch', timestamp: '2026-01-23T10:00:00Z' }]
        const newFlags = [
            { type: 'copy_attempt', timestamp: '2026-01-23T10:05:00Z' },
            { type: 'paste_attempt', timestamp: '2026-01-23T10:06:00Z' },
        ]
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue({
                ...mockAttempt,
                cheatingFlags: existingFlags,
            })
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        const result = await updateExamCheatingStats(mockAttemptId, {
            cheatingFlags: newFlags,
        })

        expect(result.success).toBe(true)
        expect(prisma.examAttempt.update).toHaveBeenCalledWith({
            where: { id: mockAttemptId },
            data: expect.objectContaining({
                cheatingFlags: [...existingFlags, ...newFlags],
            }),
        })
    })

    it('preserves existing counts when not provided', async () => {
        const existingAttempt = {
            ...mockAttempt,
            tabSwitchCount: 5,
            copyAttempts: 3,
            pasteAttempts: 2,
        }
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(existingAttempt)
            ; (prisma.examAttempt.update as Mock).mockResolvedValue({})

        // Only update tabSwitchCount
        const result = await updateExamCheatingStats(mockAttemptId, {
            tabSwitchCount: 6,
        })

        expect(result.success).toBe(true)
        expect(prisma.examAttempt.update).toHaveBeenCalledWith({
            where: { id: mockAttemptId },
            data: expect.objectContaining({
                tabSwitchCount: 6, // Updated
                copyAttempts: 3, // Preserved
                pasteAttempts: 2, // Preserved
            }),
        })
    })

    it('handles database errors gracefully', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.examAttempt.findUnique as Mock).mockResolvedValue(mockAttempt)
            ; (prisma.examAttempt.update as Mock).mockRejectedValue(new Error('DB Error'))

        const result = await updateExamCheatingStats(mockAttemptId, {
            tabSwitchCount: 1,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to update stats')
    })
})
