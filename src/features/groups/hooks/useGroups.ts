'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GroupWithMembership } from '@/types/groups'

type SortOption = 'name' | 'recent' | 'members'
type ViewMode = 'grid' | 'list'

interface UseGroupsOptions {
    initialMyGroups?: GroupWithMembership[]
    initialPublicGroups?: GroupWithMembership[]
}

export function useGroups({
    initialMyGroups = [],
    initialPublicGroups = [],
}: UseGroupsOptions = {}) {
    const [myGroups, setMyGroups] = useState(initialMyGroups)
    const [publicGroups, setPublicGroups] = useState(initialPublicGroups)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<SortOption>('recent')
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my')

    // Sort logic
    const sortGroups = useCallback((groups: GroupWithMembership[]) => {
        return [...groups].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name)
                case 'members':
                    return (b._count?.members || 0) - (a._count?.members || 0)
                case 'recent':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            }
        })
    }, [sortBy])

    // Filter logic
    const filterGroups = useCallback((groups: GroupWithMembership[]) => {
        if (!searchTerm.trim()) return groups
        const term = searchTerm.toLowerCase()
        return groups.filter(g =>
            g.name.toLowerCase().includes(term) ||
            g.description?.toLowerCase().includes(term)
        )
    }, [searchTerm])

    // Computed filtered/sorted groups
    const filteredMyGroups = useMemo(() =>
        sortGroups(filterGroups(myGroups)),
        [myGroups, sortGroups, filterGroups]
    )

    const filteredPublicGroups = useMemo(() =>
        sortGroups(filterGroups(publicGroups)),
        [publicGroups, sortGroups, filterGroups]
    )

    // Refresh from API
    const refetch = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/groups')
            if (!response.ok) throw new Error('Failed to fetch groups')
            const data = await response.json()
            setMyGroups(data.myGroups || [])
            setPublicGroups(data.publicGroups || [])
        } finally {
            setLoading(false)
        }
    }, [])

    // Add group to my groups (after join)
    const addToMyGroups = useCallback((group: GroupWithMembership) => {
        setMyGroups(prev => [group, ...prev])
        setPublicGroups(prev => prev.filter(g => g.id !== group.id))
    }, [])

    return {
        myGroups: filteredMyGroups,
        publicGroups: filteredPublicGroups,
        allMyGroups: myGroups,
        allPublicGroups: publicGroups,
        loading,
        searchTerm,
        setSearchTerm,
        sortBy,
        setSortBy,
        viewMode,
        setViewMode,
        activeTab,
        setActiveTab,
        refetch,
        addToMyGroups,
    }
}

export type UseGroupsReturn = ReturnType<typeof useGroups>
