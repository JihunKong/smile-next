'use client'

import { useState, useMemo } from 'react'
import { QuestionCard } from './QuestionCard'
import { deleteQuestion } from '@/app/(dashboard)/activities/actions'
import type { QuestionWithEvaluation } from '@/types/activities'

type ViewMode = 'cards' | 'list'
type SortOption = 'likes' | 'newest' | 'oldest' | 'peer_rating' | 'ai_score' | 'blooms' | 'total'
type BloomsFilter = 'all' | 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'likes', label: 'Most Likes' },
  { value: 'ai_score', label: 'Highest AI Score' },
  { value: 'blooms', label: "Highest Bloom's Level" },
  { value: 'peer_rating', label: 'Highest Peer Rating' },
  { value: 'total', label: 'Highest Total Score' },
]

const bloomsFilterOptions: { value: BloomsFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All Levels', color: 'gray' },
  { value: 'remember', label: 'Remember', color: 'gray' },
  { value: 'understand', label: 'Understand', color: 'blue' },
  { value: 'apply', label: 'Apply', color: 'green' },
  { value: 'analyze', label: 'Analyze', color: 'yellow' },
  { value: 'evaluate', label: 'Evaluate', color: 'orange' },
  { value: 'create', label: 'Create', color: 'red' },
]

// Bloom's level order for sorting
const bloomsOrder: Record<string, number> = {
  create: 6,
  evaluate: 5,
  analyze: 4,
  apply: 3,
  understand: 2,
  remember: 1,
}

interface QuestionListProps {
  questions: QuestionWithEvaluation[]
  activityId: string
  currentUserId?: string
  activityCreatorId?: string
  groupCreatorId?: string
  showActions?: boolean
  likedQuestionIds?: Set<string>
}

export function QuestionList({
  questions,
  activityId,
  currentUserId,
  activityCreatorId,
  groupCreatorId,
  showActions = false,
  likedQuestionIds = new Set(),
}: QuestionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [bloomsFilter, setBloomsFilter] = useState<BloomsFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort questions
  const sortedQuestions = useMemo(() => {
    // First, filter by Bloom's level
    let filtered = [...questions]

    if (bloomsFilter !== 'all') {
      filtered = filtered.filter((q) => {
        const level = q.evaluation?.bloomsLevel?.toLowerCase() || ''
        return level === bloomsFilter
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((q) => {
        const creatorName = [q.creator?.firstName, q.creator?.lastName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        const username = q.creator?.username?.toLowerCase() || ''
        return (
          q.content.toLowerCase().includes(query) ||
          creatorName.includes(query) ||
          username.includes(query)
        )
      })
    }

    const sorted = filtered

    switch (sortBy) {
      case 'likes':
        sorted.sort((a, b) => b._count.likes - a._count.likes)
        break
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'ai_score':
        sorted.sort((a, b) => {
          const scoreA = a.evaluation?.overallScore ?? 0
          const scoreB = b.evaluation?.overallScore ?? 0
          return scoreB - scoreA
        })
        break
      case 'blooms':
        sorted.sort((a, b) => {
          const levelA = bloomsOrder[a.evaluation?.bloomsLevel?.toLowerCase() ?? ''] ?? 0
          const levelB = bloomsOrder[b.evaluation?.bloomsLevel?.toLowerCase() ?? ''] ?? 0
          return levelB - levelA
        })
        break
      case 'peer_rating':
        sorted.sort((a, b) => {
          const ratingA = (a as unknown as { peerRating?: number }).peerRating ?? 0
          const ratingB = (b as unknown as { peerRating?: number }).peerRating ?? 0
          return ratingB - ratingA
        })
        break
      case 'total':
        // Weighted: AI 50% + Peer 30% + Likes 20%
        sorted.sort((a, b) => {
          const aiA = (a.evaluation?.overallScore ?? 0) / 10
          const aiB = (b.evaluation?.overallScore ?? 0) / 10
          const peerA = ((a as unknown as { peerRating?: number }).peerRating ?? 0) / 5
          const peerB = ((b as unknown as { peerRating?: number }).peerRating ?? 0) / 5
          const likesA = Math.min(a._count.likes / 10, 1)
          const likesB = Math.min(b._count.likes / 10, 1)

          const totalA = aiA * 0.5 + peerA * 0.3 + likesA * 0.2
          const totalB = aiB * 0.5 + peerB * 0.3 + likesB * 0.2
          return totalB - totalA
        })
        break
    }

    return sorted
  }, [questions, sortBy, bloomsFilter, searchQuery])

  async function handleDelete(questionId: string) {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    setDeletingId(questionId)
    const result = await deleteQuestion(questionId)

    if (!result.success) {
      alert(result.error || 'Failed to delete question')
    }

    setDeletingId(null)
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500">No questions yet.</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to ask a question!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Controls Header */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Bloom's Level Filter */}
        <div className="flex flex-wrap gap-2">
          {bloomsFilterOptions.map((option) => {
            const colorClasses: Record<string, string> = {
              gray: bloomsFilter === option.value ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              blue: bloomsFilter === option.value ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
              green: bloomsFilter === option.value ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200',
              yellow: bloomsFilter === option.value ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
              orange: bloomsFilter === option.value ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200',
              red: bloomsFilter === option.value ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200',
            }
            return (
              <button
                key={option.value}
                onClick={() => setBloomsFilter(option.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition ${colorClasses[option.color]}`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {/* View Toggle and Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">View:</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-[var(--stanford-cardinal)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  viewMode === 'list'
                    ? 'bg-white text-[var(--stanford-cardinal)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
            </div>
          </div>

          {/* Sort Dropdown and Results Count */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {sortedQuestions.length} of {questions.length} questions
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-gray-500">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* No Results Message */}
      {sortedQuestions.length === 0 && questions.length > 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 mb-2">No questions match your filters.</p>
          <button
            onClick={() => {
              setBloomsFilter('all')
              setSearchQuery('')
            }}
            className="text-sm text-[var(--stanford-cardinal)] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Questions Grid/List */}
      {sortedQuestions.length > 0 && viewMode === 'cards' && (
        // Padlet-style 4-column grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedQuestions.map((question) => (
            <div key={question.id} className={deletingId === question.id ? 'opacity-50' : ''}>
              <QuestionCard
                question={question}
                activityId={activityId}
                showActions={showActions && deletingId !== question.id}
                currentUserId={currentUserId}
                activityCreatorId={activityCreatorId}
                groupCreatorId={groupCreatorId}
                isLiked={likedQuestionIds.has(question.id)}
                onDelete={handleDelete}
                viewMode="card"
              />
            </div>
          ))}
        </div>
      )}

      {sortedQuestions.length > 0 && viewMode === 'list' && (
        // List view
        <div className="space-y-4">
          {sortedQuestions.map((question) => (
            <div key={question.id} className={deletingId === question.id ? 'opacity-50' : ''}>
              <QuestionCard
                question={question}
                activityId={activityId}
                showActions={showActions && deletingId !== question.id}
                currentUserId={currentUserId}
                activityCreatorId={activityCreatorId}
                groupCreatorId={groupCreatorId}
                isLiked={likedQuestionIds.has(question.id)}
                onDelete={handleDelete}
                viewMode="list"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
