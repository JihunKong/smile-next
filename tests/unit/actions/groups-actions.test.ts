/**
 * Unit Tests for Groups Server Actions
 *
 * Tests all 8 server actions in groups/actions.ts:
 * - createGroup
 * - joinGroupWithPasscode
 * - joinGroupWithInviteCode
 * - leaveGroup
 * - updateMemberRole
 * - removeMember
 * - regenerateInviteCode
 * - deleteGroup
 *
 * @see VIBE-0006A
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// Mock Prisma before importing actions
vi.mock('@/lib/db/prisma', () => ({
    prisma: {
        group: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        groupUser: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}))

// Mock auth
vi.mock('@/lib/auth/config', () => ({
    auth: vi.fn(),
}))

// Mock Next.js cache utilities
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

// Import after mocks are set up
import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import {
    createGroup,
    joinGroupWithPasscode,
    joinGroupWithInviteCode,
    leaveGroup,
    updateMemberRole,
    removeMember,
    regenerateInviteCode,
    deleteGroup,
} from '@/app/(dashboard)/groups/actions'
import { GroupRoles } from '@/types/groups'

// ============================================================================
// Test Fixtures
// ============================================================================

const mockUserId = 'user-123'
const mockTargetUserId = 'user-456'
const mockGroupId = 'group-789'

const mockSession = {
    user: { id: mockUserId, email: 'test@example.com' },
}

const mockGroup = {
    id: mockGroupId,
    name: 'Test Group',
    description: 'A test group',
    isPrivate: true,
    requirePasscode: true,
    passcode: '1234',
    inviteCode: 'ABCD1234',
    isDeleted: false,
    creatorId: mockUserId,
}

const mockOwnerMembership = {
    userId: mockUserId,
    groupId: mockGroupId,
    role: GroupRoles.OWNER,
}

const mockCoOwnerMembership = {
    userId: mockUserId,
    groupId: mockGroupId,
    role: GroupRoles.CO_OWNER,
}

const mockAdminMembership = {
    userId: mockUserId,
    groupId: mockGroupId,
    role: GroupRoles.ADMIN,
}

const mockMemberMembership = {
    userId: mockUserId,
    groupId: mockGroupId,
    role: GroupRoles.MEMBER,
}

const mockTargetMemberMembership = {
    userId: mockTargetUserId,
    groupId: mockGroupId,
    role: GroupRoles.MEMBER,
}

const mockTargetAdminMembership = {
    userId: mockTargetUserId,
    groupId: mockGroupId,
    role: GroupRoles.ADMIN,
}

// Helper to create FormData
function createFormData(data: Record<string, string>): FormData {
    const formData = new FormData()
    for (const [key, value] of Object.entries(data)) {
        formData.append(key, value)
    }
    return formData
}

// ============================================================================
// createGroup Tests
// ============================================================================

describe('createGroup', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const formData = createFormData({ name: 'Test Group' })
        const result = await createGroup(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in to create a group')
    })

    it('returns error when name is missing', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)

        const formData = createFormData({ name: '' })
        const result = await createGroup(formData)

        expect(result.success).toBe(false)
        expect(result.error).toContain('required')
    })

    it('returns error when passcode required but not provided', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)

        const formData = createFormData({
            name: 'Test Group',
            requirePasscode: 'true',
        })
        const result = await createGroup(formData)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Passcode is required')
    })

    it('creates group with user as owner', async () => {
        const newGroupId = 'new-group-id'
            ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.create as Mock).mockResolvedValue({
                id: newGroupId,
            })

        const formData = createFormData({
            name: 'Test Group',
            description: 'A test group',
            isPrivate: 'true',
        })
        const result = await createGroup(formData)

        expect(result.success).toBe(true)
        expect(result.data?.groupId).toBe(newGroupId)
        expect(prisma.group.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Test Group',
                    creatorId: mockUserId,
                    members: {
                        create: {
                            userId: mockUserId,
                            role: GroupRoles.OWNER,
                        },
                    },
                }),
            })
        )
    })

    it('generates invite code on creation', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.create as Mock).mockResolvedValue({
                id: 'new-group-id',
            })

        const formData = createFormData({ name: 'Test Group' })
        await createGroup(formData)

        expect(prisma.group.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    inviteCode: expect.stringMatching(/^[A-Z0-9]{8}$/),
                }),
            })
        )
    })

    it('handles database errors gracefully', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.create as Mock).mockRejectedValue(new Error('DB Error'))

        const formData = createFormData({ name: 'Test Group' })
        const result = await createGroup(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to create group. Please try again.')
    })
})

// ============================================================================
// joinGroupWithPasscode Tests
// ============================================================================

describe('joinGroupWithPasscode', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await joinGroupWithPasscode(mockGroupId, '1234')

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in to join a group')
    })

    it('returns error when group not found', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.findUnique as Mock).mockResolvedValue(null)

        const result = await joinGroupWithPasscode(mockGroupId, '1234')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Group not found')
    })

    it('returns error when already a member', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.findUnique as Mock).mockResolvedValue({
                ...mockGroup,
                members: [{ userId: mockUserId }],
            })

        const result = await joinGroupWithPasscode(mockGroupId, '1234')

        expect(result.success).toBe(false)
        expect(result.error).toBe('You are already a member of this group')
    })

    it('returns error when passcode is invalid', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.findUnique as Mock).mockResolvedValue({
                ...mockGroup,
                members: [],
            })

        const result = await joinGroupWithPasscode(mockGroupId, 'wrong')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid passcode')
    })

    it('creates membership with MEMBER role on valid passcode', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.findUnique as Mock).mockResolvedValue({
                ...mockGroup,
                members: [],
            })
            ; (prisma.groupUser.create as Mock).mockResolvedValue({})

        const result = await joinGroupWithPasscode(mockGroupId, '1234')

        expect(result.success).toBe(true)
        expect(prisma.groupUser.create).toHaveBeenCalledWith({
            data: {
                userId: mockUserId,
                groupId: mockGroupId,
                role: GroupRoles.MEMBER,
            },
        })
    })
})

// ============================================================================
// joinGroupWithInviteCode Tests
// ============================================================================

describe('joinGroupWithInviteCode', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await joinGroupWithInviteCode('ABCD1234')

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in to join a group')
    })

    it('returns error when invite code is invalid', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.findUnique as Mock).mockResolvedValue(null)

        const result = await joinGroupWithInviteCode('INVALID')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid invite code')
    })

    it('returns error when already a member', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.findUnique as Mock).mockResolvedValue({
                ...mockGroup,
                members: [{ userId: mockUserId }],
            })

        const result = await joinGroupWithInviteCode('ABCD1234')

        expect(result.success).toBe(false)
        expect(result.error).toBe('You are already a member of this group')
    })

    it('creates membership on valid invite code', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.group.findUnique as Mock).mockResolvedValue({
                ...mockGroup,
                members: [],
            })
            ; (prisma.groupUser.create as Mock).mockResolvedValue({})

        const result = await joinGroupWithInviteCode('ABCD1234')

        expect(result.success).toBe(true)
        expect(result.data?.groupId).toBe(mockGroupId)
    })
})

// ============================================================================
// leaveGroup Tests
// ============================================================================

describe('leaveGroup', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await leaveGroup(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('returns error when not a member', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(null)

        const result = await leaveGroup(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You are not a member of this group')
    })

    it('prevents owner from leaving', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockOwnerMembership)

        const result = await leaveGroup(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Owners cannot leave')
    })

    it('removes non-owner membership', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockMemberMembership)
            ; (prisma.groupUser.delete as Mock).mockResolvedValue({})

        const result = await leaveGroup(mockGroupId)

        expect(result.success).toBe(true)
        expect(prisma.groupUser.delete).toHaveBeenCalled()
    })
})

// ============================================================================
// updateMemberRole Tests
// ============================================================================

describe('updateMemberRole', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await updateMemberRole(mockGroupId, mockTargetUserId, GroupRoles.ADMIN)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('returns error when actor not a member', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(null)

        const result = await updateMemberRole(mockGroupId, mockTargetUserId, GroupRoles.ADMIN)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You are not a member of this group')
    })

    it('returns error when target not a member', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock)
                .mockResolvedValueOnce(mockOwnerMembership) // Actor
                .mockResolvedValueOnce(null) // Target

        const result = await updateMemberRole(mockGroupId, mockTargetUserId, GroupRoles.ADMIN)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Target user is not a member of this group')
    })

    it('enforces role hierarchy', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock)
                .mockResolvedValueOnce(mockAdminMembership) // Actor (Admin)
                .mockResolvedValueOnce(mockTargetAdminMembership) // Target (Admin)

        const result = await updateMemberRole(mockGroupId, mockTargetUserId, GroupRoles.MEMBER)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You do not have permission to make this change')
    })

    it('allows owner to change member role', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock)
                .mockResolvedValueOnce(mockOwnerMembership) // Actor (Owner)
                .mockResolvedValueOnce(mockTargetMemberMembership) // Target (Member)
            ; (prisma.groupUser.update as Mock).mockResolvedValue({})

        const result = await updateMemberRole(mockGroupId, mockTargetUserId, GroupRoles.ADMIN)

        expect(result.success).toBe(true)
        expect(prisma.groupUser.update).toHaveBeenCalledWith({
            where: {
                userId_groupId: {
                    userId: mockTargetUserId,
                    groupId: mockGroupId,
                },
            },
            data: { role: GroupRoles.ADMIN },
        })
    })
})

// ============================================================================
// removeMember Tests
// ============================================================================

describe('removeMember', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await removeMember(mockGroupId, mockTargetUserId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('prevents removing owner', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock)
                .mockResolvedValueOnce(mockOwnerMembership) // Actor
                .mockResolvedValueOnce({ ...mockOwnerMembership, userId: mockTargetUserId }) // Target is owner

        const result = await removeMember(mockGroupId, mockTargetUserId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Cannot remove the group owner')
    })

    it('prevents removing higher-ranked members', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock)
                .mockResolvedValueOnce(mockAdminMembership) // Actor (Admin)
                .mockResolvedValueOnce({ ...mockCoOwnerMembership, userId: mockTargetUserId }) // Target (CO_OWNER)

        const result = await removeMember(mockGroupId, mockTargetUserId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You can only remove members with lower roles')
    })

    it('allows admin to remove member', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock)
                .mockResolvedValueOnce(mockAdminMembership) // Actor (Admin)
                .mockResolvedValueOnce(mockTargetMemberMembership) // Target (Member)
            ; (prisma.groupUser.delete as Mock).mockResolvedValue({})

        const result = await removeMember(mockGroupId, mockTargetUserId)

        expect(result.success).toBe(true)
        expect(prisma.groupUser.delete).toHaveBeenCalled()
    })
})

// ============================================================================
// regenerateInviteCode Tests
// ============================================================================

describe('regenerateInviteCode', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await regenerateInviteCode(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('returns error when not authorized (member)', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockMemberMembership)

        const result = await regenerateInviteCode(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You do not have permission to regenerate invite code')
    })

    it('returns error when not authorized (admin)', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockAdminMembership)

        const result = await regenerateInviteCode(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You do not have permission to regenerate invite code')
    })

    it('allows co-owner to regenerate code', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockCoOwnerMembership)
            ; (prisma.group.update as Mock).mockResolvedValue({})

        const result = await regenerateInviteCode(mockGroupId)

        expect(result.success).toBe(true)
        expect(result.data?.inviteCode).toMatch(/^[A-Z0-9]{8}$/)
        expect(prisma.group.update).toHaveBeenCalled()
    })

    it('allows owner to regenerate code', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockOwnerMembership)
            ; (prisma.group.update as Mock).mockResolvedValue({})

        const result = await regenerateInviteCode(mockGroupId)

        expect(result.success).toBe(true)
        expect(result.data?.inviteCode).toBeDefined()
    })
})

// ============================================================================
// deleteGroup Tests
// ============================================================================

describe('deleteGroup', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns error when not authenticated', async () => {
        ; (auth as Mock).mockResolvedValue(null)

        const result = await deleteGroup(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('You must be logged in')
    })

    it('returns error when not owner', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockCoOwnerMembership)

        const result = await deleteGroup(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Only the owner can delete this group')
    })

    it('soft deletes group when owner', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockOwnerMembership)
            ; (prisma.group.update as Mock).mockResolvedValue({})

        const result = await deleteGroup(mockGroupId)

        expect(result.success).toBe(true)
        expect(prisma.group.update).toHaveBeenCalledWith({
            where: { id: mockGroupId },
            data: {
                isDeleted: true,
                dateDeleted: expect.any(Date),
            },
        })
    })

    it('handles database errors gracefully', async () => {
        ; (auth as Mock).mockResolvedValue(mockSession)
            ; (prisma.groupUser.findUnique as Mock).mockResolvedValue(mockOwnerMembership)
            ; (prisma.group.update as Mock).mockRejectedValue(new Error('DB Error'))

        const result = await deleteGroup(mockGroupId)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Failed to delete group. Please try again.')
    })
})
