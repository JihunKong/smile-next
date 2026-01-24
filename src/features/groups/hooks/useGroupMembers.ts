'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GroupUserWithUser, GroupRole } from '@/types/groups'

interface UseGroupMembersOptions {
    groupId: string
    initialMembers?: (GroupUserWithUser & { isSuspended?: boolean })[]
}

export function useGroupMembers({ groupId, initialMembers = [] }: UseGroupMembersOptions) {
    const [members, setMembers] = useState<(GroupUserWithUser & { isSuspended?: boolean })[]>(initialMembers)
    const [loading, setLoading] = useState(!initialMembers.length)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchMembers = useCallback(async () => {
        if (!groupId) return
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/groups/${groupId}/members`)
            if (!response.ok) throw new Error('Failed to fetch members')
            const data = await response.json()
            setMembers(data.members || data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [groupId])

    useEffect(() => {
        if (!initialMembers.length && groupId) {
            fetchMembers()
        }
    }, [fetchMembers, initialMembers.length, groupId])

    const changeRole = useCallback(async (userId: string, newRole: number) => {
        setActionLoading(userId)
        setError(null)
        try {
            const response = await fetch(`/api/groups/${groupId}/members/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update role')
            }

            // Update local state
            setMembers(prev => prev.map(m =>
                m.userId === userId ? { ...m, role: newRole } : m
            ))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change role')
        } finally {
            setActionLoading(null)
        }
    }, [groupId])

    const removeMember = useCallback(async (userId: string) => {
        setActionLoading(userId)
        setError(null)
        try {
            const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
                method: 'DELETE',
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to remove member')
            }

            setMembers(prev => prev.filter(m => m.userId !== userId))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove member')
        } finally {
            setActionLoading(null)
        }
    }, [groupId])

    const suspendMember = useCallback(async (userId: string, suspend: boolean) => {
        setActionLoading(userId)
        setError(null)
        try {
            const response = await fetch(`/api/groups/${groupId}/members/${userId}/suspend`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suspend }),
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update suspension')
            }

            setMembers(prev => prev.map(m =>
                m.userId === userId ? { ...m, isSuspended: suspend } : m
            ))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update suspension')
        } finally {
            setActionLoading(null)
        }
    }, [groupId])

    // Filter members by search term
    const filteredMembers = useMemo(() => {
        if (!searchTerm.trim()) return members
        const term = searchTerm.toLowerCase()
        return members.filter(m =>
            m.user.firstName?.toLowerCase().includes(term) ||
            m.user.lastName?.toLowerCase().includes(term) ||
            m.user.email?.toLowerCase().includes(term) ||
            m.user.username?.toLowerCase().includes(term)
        )
    }, [members, searchTerm])

    return {
        members: filteredMembers,
        allMembers: members,
        loading,
        actionLoading,
        error,
        searchTerm,
        setSearchTerm,
        changeRole,
        removeMember,
        suspendMember,
        refetch: fetchMembers,
    }
}

export type UseGroupMembersReturn = ReturnType<typeof useGroupMembers>
