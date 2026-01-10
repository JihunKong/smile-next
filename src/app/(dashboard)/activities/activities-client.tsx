'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ActivityCard } from '@/components/activities/ActivityCard'
import { ActivityListItem } from '@/components/activities/ActivityListItem'
import type { ActivityWithGroup, ActivityMode } from '@/types/activities'

interface Group {
  id: string
  name: string
}

interface ActivitiesClientProps {
  initialActivities: ActivityWithGroup[]
  groups: Group[]
  initialTotalCount: number
}

type SortOption = 'name-asc' | 'name-desc' | 'createdAt-desc' | 'createdAt-asc' |
                  'questions_count-desc' | 'questions_count-asc'

interface PaginationInfo {
  totalCount: number
  totalPages: number
  currentPage: number
  limit: number
  hasMore: boolean
}

export function ActivitiesClient({
  initialActivities,
  groups,
  initialTotalCount
}: ActivitiesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [creatorSearch, setCreatorSearch] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('createdAt-desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activities, setActivities] = useState<ActivityWithGroup[]>(initialActivities)
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: initialTotalCount,
    totalPages: Math.ceil(initialTotalCount / 20),
    currentPage: 1,
    limit: 20,
    hasMore: initialTotalCount > 20,
  })
  const [loading, setLoading] = useState(false)
  const [isSearchActive, setIsSearchActive] = useState(false)

  // Restore saved view mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('activitiesViewMode')
    if (savedMode === 'grid' || savedMode === 'list') {
      setViewMode(savedMode)
    }
  }, [])

  // Save view mode to localStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('activitiesViewMode', mode)
  }

  // Fetch activities from API
  const fetchActivities = useCallback(async (page: number = 1) => {
    setLoading(true)
    try {
      const [sortField, sortOrder] = sortBy.split('-') as [string, 'asc' | 'desc']

      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (creatorSearch.trim()) params.set('creator', creatorSearch.trim())
      if (groupSearch.trim()) params.set('group', groupSearch.trim())
      if (modeFilter !== 'all') params.set('mode', modeFilter)
      params.set('sort', sortField)
      params.set('order', sortOrder)
      params.set('page', page.toString())
      params.set('limit', '20')

      const response = await fetch(`/api/activities/search?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }

      const data = await response.json()
      setActivities(data.activities)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, creatorSearch, groupSearch, modeFilter, sortBy])

  // Handle search button click
  const handleSearch = () => {
    setIsSearchActive(
      searchQuery.trim() !== '' ||
      creatorSearch.trim() !== '' ||
      groupSearch.trim() !== '' ||
      modeFilter !== 'all'
    )
    fetchActivities(1)
  }

  // Handle clear filters
  const handleClear = () => {
    setSearchQuery('')
    setCreatorSearch('')
    setGroupSearch('')
    setModeFilter('all')
    setSortBy('createdAt-desc')
    setIsSearchActive(false)
    setActivities(initialActivities)
    setPagination({
      totalCount: initialTotalCount,
      totalPages: Math.ceil(initialTotalCount / 20),
      currentPage: 1,
      limit: 20,
      hasMore: initialTotalCount > 20,
    })
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchActivities(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle sort change - trigger search immediately
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    // Will trigger search via useEffect if search is active, otherwise sort client-side
    if (isSearchActive) {
      setTimeout(() => fetchActivities(1), 0)
    } else {
      // Client-side sort for initial data
      const [sortField, sortOrder] = newSort.split('-') as [string, 'asc' | 'desc']
      const sorted = [...activities].sort((a, b) => {
        let comparison = 0
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            break
          case 'questions_count':
            comparison = a._count.questions - b._count.questions
            break
        }
        return sortOrder === 'desc' ? -comparison : comparison
      })
      setActivities(sorted)
    }
  }

  // Handle Enter key on search inputs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Mode options for filter dropdown
  const modeOptions = [
    { value: 'all', label: 'All Modes' },
    { value: '0', label: 'Open Mode' },
    { value: '1', label: 'Exam Mode' },
    { value: '2', label: 'Inquiry Mode' },
    { value: '3', label: 'Case Mode' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Query */}
          <div className="lg:col-span-2">
            <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-2">
              Search Activities
            </label>
            <div className="relative">
              <input
                type="text"
                id="search-query"
                placeholder="Search by name, description, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-[var(--stanford-cardinal)]"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Creator Filter */}
          <div>
            <label htmlFor="search-creator" className="block text-sm font-medium text-gray-700 mb-2">
              Creator
            </label>
            <input
              type="text"
              id="search-creator"
              placeholder="Search by creator name..."
              value={creatorSearch}
              onChange={(e) => setCreatorSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-[var(--stanford-cardinal)]"
            />
          </div>

          {/* Group Filter */}
          <div>
            <label htmlFor="search-group" className="block text-sm font-medium text-gray-700 mb-2">
              Group
            </label>
            <input
              type="text"
              id="search-group"
              placeholder="Search by group name..."
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-[var(--stanford-cardinal)]"
            />
          </div>
        </div>

        {/* Second Row: Mode Filter, Sort, Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Mode Filter */}
          <div>
            <label htmlFor="mode-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Activity Mode
            </label>
            <select
              id="mode-filter"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-[var(--stanford-cardinal)]"
            >
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="search-sort" className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              id="search-sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-[var(--stanford-cardinal)]"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="questions_count-desc">Most Questions</option>
              <option value="questions_count-asc">Fewest Questions</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 bg-[var(--stanford-cardinal)] text-white px-4 py-2 rounded-md hover:opacity-90 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Search
            </button>
            <button
              onClick={handleClear}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          </div>
        </div>

        {/* Results Count and View Toggle */}
        <div className="mt-4 flex justify-between items-center border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            {loading ? (
              'Searching...'
            ) : (
              <>
                <span className="font-medium">{pagination.totalCount}</span> {pagination.totalCount === 1 ? 'activity' : 'activities'} found
                {isSearchActive && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                    Filtered
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-2">View:</span>
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-2 border border-gray-300 rounded-l-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--stanford-cardinal)] text-white border-[var(--stanford-cardinal)]'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-2 border border-gray-300 rounded-r-md border-l-0 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--stanford-cardinal)] text-white border-[var(--stanford-cardinal)]'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <svg className="animate-spin w-10 h-10 text-[var(--stanford-cardinal)] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading activities...</p>
        </div>
      )}

      {/* Activities List */}
      {!loading && activities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {isSearchActive ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No activities found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search filters or clearing them.</p>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--stanford-cardinal)] text-white font-medium rounded-lg hover:opacity-90 transition"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No activities yet</h3>
              <p className="text-gray-500 mb-4">Join a group or create your first activity to get started.</p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/groups"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--stanford-cardinal)] text-white font-medium rounded-lg hover:opacity-90 transition"
                >
                  Browse Groups
                </Link>
                {groups.length > 0 && (
                  <Link
                    href={`/groups/${groups[0].id}/activities/create`}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  >
                    Create Activity
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      ) : !loading && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityListItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = pagination.currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === pagination.currentPage
                          ? 'bg-[var(--stanford-cardinal)] text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasMore}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
