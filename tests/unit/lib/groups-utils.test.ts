/**
 * Unit Tests for Groups Utility Functions
 *
 * Tests all 8 utility functions in lib/groups/utils.ts:
 * - generateInviteCode
 * - getRoleLabel
 * - getRoleBadgeColor
 * - canManageGroup
 * - canChangeUserRole
 * - formatMemberCount
 * - getGradientColors
 * - getGroupInitials
 *
 * @see VIBE-0006A
 */
import { describe, it, expect } from 'vitest'
import {
    generateInviteCode,
    getRoleLabel,
    getRoleBadgeColor,
    canManageGroup,
    canChangeUserRole,
    formatMemberCount,
    getGradientColors,
    getGroupInitials,
} from '@/lib/groups/utils'
import { GroupRoles } from '@/types/groups'

// ============================================================================
// generateInviteCode Tests
// ============================================================================

describe('generateInviteCode', () => {
    it('generates 8 character codes', () => {
        const code = generateInviteCode()
        expect(code).toHaveLength(8)
    })

    it('uses only allowed characters', () => {
        const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        // Test 100 codes to ensure randomness is within bounds
        for (let i = 0; i < 100; i++) {
            const code = generateInviteCode()
            for (const char of code) {
                expect(allowedChars).toContain(char)
            }
        }
    })

    it('excludes confusing characters (0, O, 1, I)', () => {
        const forbiddenChars = '0O1I'
        for (let i = 0; i < 100; i++) {
            const code = generateInviteCode()
            for (const char of forbiddenChars) {
                expect(code).not.toContain(char)
            }
        }
    })

    it('generates uppercase codes only', () => {
        for (let i = 0; i < 50; i++) {
            const code = generateInviteCode()
            expect(code).toBe(code.toUpperCase())
        }
    })
})

// ============================================================================
// getRoleLabel Tests
// ============================================================================

describe('getRoleLabel', () => {
    it('returns correct labels for each role', () => {
        expect(getRoleLabel(GroupRoles.MEMBER)).toBe('Member')
        expect(getRoleLabel(GroupRoles.ADMIN)).toBe('Admin')
        expect(getRoleLabel(GroupRoles.CO_OWNER)).toBe('Co-Owner')
        expect(getRoleLabel(GroupRoles.OWNER)).toBe('Owner')
    })

    it('returns Unknown for invalid role', () => {
        // @ts-expect-error - Testing invalid input
        expect(getRoleLabel(99)).toBe('Unknown')
    })
})

// ============================================================================
// getRoleBadgeColor Tests
// ============================================================================

describe('getRoleBadgeColor', () => {
    it('returns yellow colors for OWNER', () => {
        const color = getRoleBadgeColor(GroupRoles.OWNER)
        expect(color).toContain('yellow')
    })

    it('returns blue colors for CO_OWNER', () => {
        const color = getRoleBadgeColor(GroupRoles.CO_OWNER)
        expect(color).toContain('blue')
    })

    it('returns purple colors for ADMIN', () => {
        const color = getRoleBadgeColor(GroupRoles.ADMIN)
        expect(color).toContain('purple')
    })

    it('returns gray colors for MEMBER', () => {
        const color = getRoleBadgeColor(GroupRoles.MEMBER)
        expect(color).toContain('gray')
    })

    it('returns Tailwind CSS classes', () => {
        const color = getRoleBadgeColor(GroupRoles.OWNER)
        expect(color).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/)
    })
})

// ============================================================================
// canManageGroup Tests
// ============================================================================

describe('canManageGroup', () => {
    describe('null/undefined role handling', () => {
        it('returns false for null role', () => {
            expect(canManageGroup(null, 'view')).toBe(false)
            expect(canManageGroup(null, 'edit')).toBe(false)
            expect(canManageGroup(null, 'delete')).toBe(false)
        })

        it('returns false for undefined role', () => {
            expect(canManageGroup(undefined, 'view')).toBe(false)
            expect(canManageGroup(undefined, 'manageMember')).toBe(false)
        })
    })

    describe('view action', () => {
        it('allows all members to view', () => {
            expect(canManageGroup(GroupRoles.MEMBER, 'view')).toBe(true)
            expect(canManageGroup(GroupRoles.ADMIN, 'view')).toBe(true)
            expect(canManageGroup(GroupRoles.CO_OWNER, 'view')).toBe(true)
            expect(canManageGroup(GroupRoles.OWNER, 'view')).toBe(true)
        })
    })

    describe('edit action', () => {
        it('allows CO_OWNER and OWNER to edit', () => {
            expect(canManageGroup(GroupRoles.CO_OWNER, 'edit')).toBe(true)
            expect(canManageGroup(GroupRoles.OWNER, 'edit')).toBe(true)
        })

        it('prevents MEMBER and ADMIN from editing', () => {
            expect(canManageGroup(GroupRoles.MEMBER, 'edit')).toBe(false)
            expect(canManageGroup(GroupRoles.ADMIN, 'edit')).toBe(false)
        })
    })

    describe('invite action', () => {
        it('allows CO_OWNER and OWNER to invite', () => {
            expect(canManageGroup(GroupRoles.CO_OWNER, 'invite')).toBe(true)
            expect(canManageGroup(GroupRoles.OWNER, 'invite')).toBe(true)
        })

        it('prevents MEMBER and ADMIN from inviting', () => {
            expect(canManageGroup(GroupRoles.MEMBER, 'invite')).toBe(false)
            expect(canManageGroup(GroupRoles.ADMIN, 'invite')).toBe(false)
        })
    })

    describe('manageMember action', () => {
        it('allows ADMIN and above to manage members', () => {
            expect(canManageGroup(GroupRoles.ADMIN, 'manageMember')).toBe(true)
            expect(canManageGroup(GroupRoles.CO_OWNER, 'manageMember')).toBe(true)
            expect(canManageGroup(GroupRoles.OWNER, 'manageMember')).toBe(true)
        })

        it('prevents MEMBER from managing members', () => {
            expect(canManageGroup(GroupRoles.MEMBER, 'manageMember')).toBe(false)
        })
    })

    describe('changeRole action', () => {
        it('allows CO_OWNER and OWNER to change roles', () => {
            expect(canManageGroup(GroupRoles.CO_OWNER, 'changeRole')).toBe(true)
            expect(canManageGroup(GroupRoles.OWNER, 'changeRole')).toBe(true)
        })

        it('prevents MEMBER and ADMIN from changing roles', () => {
            expect(canManageGroup(GroupRoles.MEMBER, 'changeRole')).toBe(false)
            expect(canManageGroup(GroupRoles.ADMIN, 'changeRole')).toBe(false)
        })
    })

    describe('removeMember action', () => {
        it('allows ADMIN and above to remove members', () => {
            expect(canManageGroup(GroupRoles.ADMIN, 'removeMember')).toBe(true)
            expect(canManageGroup(GroupRoles.CO_OWNER, 'removeMember')).toBe(true)
            expect(canManageGroup(GroupRoles.OWNER, 'removeMember')).toBe(true)
        })

        it('prevents MEMBER from removing members', () => {
            expect(canManageGroup(GroupRoles.MEMBER, 'removeMember')).toBe(false)
        })
    })

    describe('delete action', () => {
        it('allows only OWNER to delete', () => {
            expect(canManageGroup(GroupRoles.OWNER, 'delete')).toBe(true)
        })

        it('prevents non-owners from deleting', () => {
            expect(canManageGroup(GroupRoles.CO_OWNER, 'delete')).toBe(false)
            expect(canManageGroup(GroupRoles.ADMIN, 'delete')).toBe(false)
            expect(canManageGroup(GroupRoles.MEMBER, 'delete')).toBe(false)
        })
    })

    describe('unknown action', () => {
        it('returns false for unknown actions', () => {
            // @ts-expect-error - Testing invalid action
            expect(canManageGroup(GroupRoles.OWNER, 'unknownAction')).toBe(false)
        })
    })
})

// ============================================================================
// canChangeUserRole Tests
// ============================================================================

describe('canChangeUserRole', () => {
    describe('null/undefined actor role', () => {
        it('returns false for null actor role', () => {
            expect(canChangeUserRole(null, GroupRoles.MEMBER, GroupRoles.ADMIN)).toBe(false)
        })

        it('returns false for undefined actor role', () => {
            expect(canChangeUserRole(undefined, GroupRoles.MEMBER, GroupRoles.ADMIN)).toBe(false)
        })
    })

    describe('owner protection', () => {
        it('prevents changing owner role', () => {
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.OWNER, GroupRoles.MEMBER)).toBe(false)
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.OWNER, GroupRoles.CO_OWNER)).toBe(false)
        })
    })

    describe('role hierarchy enforcement', () => {
        it('requires actor to have higher role than target', () => {
            // Same role - should fail
            expect(canChangeUserRole(GroupRoles.ADMIN, GroupRoles.ADMIN, GroupRoles.MEMBER)).toBe(false)
            expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.CO_OWNER, GroupRoles.ADMIN)).toBe(false)

            // Lower role - should fail
            expect(canChangeUserRole(GroupRoles.ADMIN, GroupRoles.CO_OWNER, GroupRoles.MEMBER)).toBe(false)
            expect(canChangeUserRole(GroupRoles.MEMBER, GroupRoles.ADMIN, GroupRoles.MEMBER)).toBe(false)
        })

        it('allows actor with higher role to change target role', () => {
            expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.ADMIN, GroupRoles.MEMBER)).toBe(true)
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.ADMIN, GroupRoles.MEMBER)).toBe(true)
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.CO_OWNER, GroupRoles.ADMIN)).toBe(true)
        })
    })

    describe('promotion limits', () => {
        it('prevents promoting to equal or higher role than actor', () => {
            // CO_OWNER cannot promote to CO_OWNER or OWNER
            expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.MEMBER, GroupRoles.CO_OWNER)).toBe(false)
            expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.MEMBER, GroupRoles.OWNER)).toBe(false)

            // OWNER cannot promote to OWNER (can only promote below)
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.MEMBER, GroupRoles.OWNER)).toBe(false)
        })

        it('allows promoting to roles below actor', () => {
            expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.MEMBER, GroupRoles.ADMIN)).toBe(true)
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.MEMBER, GroupRoles.CO_OWNER)).toBe(true)
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.MEMBER, GroupRoles.ADMIN)).toBe(true)
        })
    })

    describe('valid role changes', () => {
        it('allows OWNER to demote CO_OWNER to ADMIN', () => {
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.CO_OWNER, GroupRoles.ADMIN)).toBe(true)
        })

        it('allows OWNER to demote CO_OWNER to MEMBER', () => {
            expect(canChangeUserRole(GroupRoles.OWNER, GroupRoles.CO_OWNER, GroupRoles.MEMBER)).toBe(true)
        })

        it('allows CO_OWNER to demote ADMIN to MEMBER', () => {
            expect(canChangeUserRole(GroupRoles.CO_OWNER, GroupRoles.ADMIN, GroupRoles.MEMBER)).toBe(true)
        })
    })
})

// ============================================================================
// formatMemberCount Tests
// ============================================================================

describe('formatMemberCount', () => {
    it('uses singular form for 1 member', () => {
        expect(formatMemberCount(1)).toBe('1 member')
    })

    it('uses plural form for 0 members', () => {
        expect(formatMemberCount(0)).toBe('0 members')
    })

    it('uses plural form for multiple members', () => {
        expect(formatMemberCount(2)).toBe('2 members')
        expect(formatMemberCount(5)).toBe('5 members')
        expect(formatMemberCount(100)).toBe('100 members')
    })
})

// ============================================================================
// getGradientColors Tests
// ============================================================================

describe('getGradientColors', () => {
    it('returns object with from and to properties', () => {
        const gradient = getGradientColors(0)
        expect(gradient).toHaveProperty('from')
        expect(gradient).toHaveProperty('to')
    })

    it('returns valid hex color codes', () => {
        const gradient = getGradientColors(0)
        expect(gradient.from).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(gradient.to).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('returns different gradients for different indices', () => {
        const gradient0 = getGradientColors(0)
        const gradient1 = getGradientColors(1)
        expect(gradient0).not.toEqual(gradient1)
    })

    it('cycles through gradients (wraps around)', () => {
        const gradient0 = getGradientColors(0)
        const gradient8 = getGradientColors(8) // Should wrap to index 0
        expect(gradient0).toEqual(gradient8)
    })

    it('uses default index 0 when not provided', () => {
        const gradientDefault = getGradientColors()
        const gradient0 = getGradientColors(0)
        expect(gradientDefault).toEqual(gradient0)
    })
})

// ============================================================================
// getGroupInitials Tests
// ============================================================================

describe('getGroupInitials', () => {
    describe('single word names', () => {
        it('returns first 2 characters for single word', () => {
            expect(getGroupInitials('Biology')).toBe('BI')
            expect(getGroupInitials('CS')).toBe('CS')
        })

        it('returns uppercase characters', () => {
            expect(getGroupInitials('biology')).toBe('BI')
            expect(getGroupInitials('cs')).toBe('CS')
        })
    })

    describe('multi-word names', () => {
        it('returns first char of first 2 words', () => {
            expect(getGroupInitials('Computer Science')).toBe('CS')
            expect(getGroupInitials('Intro to AI')).toBe('IT') // Uses first 2 words: "Intro" + "to"
        })

        it('ignores words after the first two', () => {
            expect(getGroupInitials('Very Long Group Name')).toBe('VL')
        })
    })

    describe('edge cases', () => {
        it('handles extra whitespace', () => {
            expect(getGroupInitials('  Biology  101  ')).toBe('B1')
            expect(getGroupInitials('Computer   Science')).toBe('CS')
        })

        it('handles single character name', () => {
            expect(getGroupInitials('A')).toBe('A')
        })

        it('handles two character name', () => {
            expect(getGroupInitials('AI')).toBe('AI')
        })
    })
})
