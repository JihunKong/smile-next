'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GroupCard } from '@/components/groups/GroupCard'
import type { GroupRole } from '@/types/groups'

interface Group {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  coverImage: string | null
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
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            <i className="fas fa-arrow-left mr-2"></i>Back to Dashboard
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>Create Group
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
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-search mr-2"></i>Search
              </button>
              <button
                onClick={handleClear}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                <i className="fas fa-times mr-2"></i>Clear
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-600">View:</label>
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 border border-gray-300 rounded-l-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 border border-gray-300 rounded-r-md border-l-0 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
              <span className="text-sm text-gray-600">{totalGroups} groups</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Loading groups...</p>
          </div>
        )}

        {/* My Groups Section */}
        {!loading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                <i className="fas fa-users mr-2 text-blue-600"></i>
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
                <i className="fas fa-users text-4xl text-blue-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600 mb-4">Create your first group or join public groups to get started!</p>
                <Link
                  href="/groups/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  <i className="fas fa-plus mr-2"></i>Create Group
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Public Groups Section */}
        {!loading && !isAdmin && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                <i className="fas fa-globe mr-2 text-green-600"></i>Public Groups
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
                <i className="fas fa-globe text-4xl text-green-300 mb-4"></i>
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
