'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GroupDetail } from '@/types/groups'

interface Activity {
    id: string
    title: string
    mode: number
    [key: string]: unknown
}

interface Membership {
    role: number
}

interface UseGroupOptions {
    groupId: string
    includeActivities?: boolean
    includeMembers?: boolean
}

export function useGroup({
    groupId,
    includeActivities = true,
    includeMembers = true,
}: UseGroupOptions) {
    const [group, setGroup] = useState<GroupDetail | null>(null)
    const [activities, setActivities] = useState<Activity[]>([])
    const [membership, setMembership] = useState<Membership | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchGroup = useCallback(async () => {
        if (!groupId) return
        setLoading(true)
        setError(null)

        try {
            // Build query params
            const params = new URLSearchParams()
            if (includeActivities) params.set('activities', 'true')
            if (includeMembers) params.set('members', 'true')

            const url = `/api/groups/${groupId}${params.toString() ? '?' + params.toString() : ''}`
            const response = await fetch(url)

            if (!response.ok) {
                if (response.status === 404) throw new Error('Group not found')
                if (response.status === 403) throw new Error('Access denied')
                throw new Error('Failed to load group')
            }

            const data = await response.json()
            setGroup(data.group || data)
            setActivities(data.activities || [])
            setMembership(data.membership || null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [groupId, includeActivities, includeMembers])

    useEffect(() => {
        fetchGroup()
    }, [fetchGroup])

    return {
        group,
        activities,
        membership,
        loading,
        error,
        refetch: fetchGroup,
    }
}

export type UseGroupReturn = ReturnType<typeof useGroup>
