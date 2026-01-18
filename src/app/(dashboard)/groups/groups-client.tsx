'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GroupCard } from '@/components/groups/GroupCard'
import { LoadingState } from '@/components/ui'
import type { GroupRole } from '@/types/groups'

interface Group {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  groupImageUrl?: string | null
  autoIconGradient?: string | null
  coverImage?: string | null  // Legacy field
  inviteCode: string | null
  createdAt: Date
  creator: {
    id: string
    firstName: string | null
    lastName: string | null
  }
  members?: {
    role: number
  }[]
  _count: {
    members: number
    activities: number
    questions?: number
  }
}

interface GroupsClientProps {
  initialMyGroups: Group[]
  initialPublicGroups: Group[]
  isAdmin: boolean
}

type SortOption = 'name-asc' | 'name-desc' | 'created_at-desc' | 'created_at-asc' |
                  'members_count-desc' | 'members_count-asc' | 'activities_count-desc' | 'activities_count-asc'

export function GroupsClient({ initialMyGroups, initialPublicGroups, isAdmin }: GroupsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [myGroups, setMyGroups] = useState(initialMyGroups)
  const [publicGroups, setPublicGroups] = useState(initialPublicGroups)
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [loading, setLoading] = useState(false)

  // Restore saved view mode
  useEffect(() => {
    const savedMode = localStorage.getItem('groupsViewMode')
    if (savedMode === 'grid' || savedMode === 'list') {
      setViewMode(savedMode)
    }
  }, [])

  // Save view mode
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('groupsViewMode', mode)
  }

  // Sort and filter groups
  const filterAndSortGroups = (groups: Group[]) => {
    let filtered = groups

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(query) ||
        (g.description?.toLowerCase().includes(query) ?? false)
      )
    }

    // Filter by owner
    if (ownerSearch.trim()) {
      const owner = ownerSearch.toLowerCase()
      filtered = filtered.filter(g => {
        const creatorName = `${g.creator.firstName || ''} ${g.creator.lastName || ''}`.toLowerCase()
        return creatorName.includes(owner)
      })
    }

    // Sort
    const [sortField, sortOrder] = sortBy.split('-') as [string, 'asc' | 'desc']
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'members_count':
          comparison = a._count.members - b._count.members
          break
        case 'activities_count':
          comparison = a._count.activities - b._count.activities
          break
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }

  const filteredMyGroups = filterAndSortGroups(myGroups)
  const filteredPublicGroups = filterAndSortGroups(publicGroups)
  const totalGroups = filteredMyGroups.length + filteredPublicGroups.length

  const handleSearch = () => {
    setIsSearchActive(searchQuery.trim() !== '' || ownerSearch.trim() !== '')
  }

  const handleClear = () => {
    setSearchQuery('')
    setOwnerSearch('')
    setSortBy('name-asc')
    setIsSearchActive(false)
  }

  const handleJoinGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Join the group "${groupName}"?`)) return

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })

      if (response.ok) {
        window.location.href = `/groups/${groupId}`
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join group.')
      }
    } catch {
      alert('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Dashboard */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--stanford-pine)' }}>
              {isAdmin ? 'All Groups (Admin)' : 'Groups'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isAdmin ? 'Manage all groups as administrator' : 'Browse public groups and manage your own'}
            </p>
          </div>
          <Link
            href="/groups/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Group
          </Link>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
                Search Groups
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-query"
                  placeholder="Search by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label htmlFor="search-owner" className="block text-sm font-medium text-gray-700 mb-2">
                Owner
              </label>
              <input
                type="text"
                id="search-owner"
                placeholder="Search by owner name..."
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="search-sort" className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                id="search-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="members_count-desc">Most Members</option>
                <option value="members_count-asc">Fewest Members</option>
                <option value="activities_count-desc">Most Activities</option>
                <option value="activities_count-asc">Fewest Activities</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
              <button
                onClick={handleClear}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-600">View:</label>
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 border border-gray-300 rounded-l-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 border border-gray-300 rounded-r-md border-l-0 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <span className="text-sm text-gray-600">{totalGroups} groups</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingState message="Loading groups..." />
        )}

        {/* My Groups Section */}
        {!loading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {isAdmin ? 'All Groups' : 'My Groups'}
              </h2>
              <span className="text-sm text-gray-600">
                {filteredMyGroups.length} group{filteredMyGroups.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredMyGroups.length > 0 ? (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
              }>
                {filteredMyGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    userRole={(group.members?.[0]?.role ?? 0) as GroupRole}
                    isMember={true}
                    showQuestionsCount={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                <svg className="w-16 h-16 text-blue-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600 mb-4">Create your first group or join public groups to get started!</p>
                <Link
                  href="/groups/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Group
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Public Groups Section */}
        {!loading && !isAdmin && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Public Groups
              </h2>
              <span className="text-sm text-gray-600">
                {filteredPublicGroups.length} group{filteredPublicGroups.length !== 1 ? 's' : ''} available
              </span>
            </div>

            {filteredPublicGroups.length > 0 ? (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-4"
              }>
                {filteredPublicGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isMember={false}
                    onJoin={() => handleJoinGroup(group.id, group.name)}
                    showQuestionsCount={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-green-50 rounded-lg border-2 border-dashed border-green-200">
                <svg className="w-16 h-16 text-green-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No public groups available</h3>
                <p className="text-gray-600">All available public groups have been joined or there are no public groups yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
