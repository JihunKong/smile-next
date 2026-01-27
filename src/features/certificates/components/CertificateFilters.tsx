/**
 * CertificateFilters Component
 *
 * Search and sort controls for certificate lists.
 * Supports controlled and uncontrolled modes.
 */

'use client'

import type { SortOption } from '../types'

export interface CertificateFiltersProps {
  /** Current search query */
  search?: string
  /** Called when search changes */
  onSearchChange?: (query: string) => void
  /** Placeholder text for search input */
  searchPlaceholder?: string
  /** Current sort option */
  sortBy?: SortOption
  /** Called when sort changes */
  onSortChange?: (sort: SortOption) => void
  /** Number of results to display */
  resultsCount?: number
  /** Whether data is loading */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'name', label: 'Name (A-Z)' },
]

export function CertificateFilters({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search by name or organization...',
  sortBy = 'newest',
  onSortChange,
  resultsCount,
  loading = false,
  className = '',
}: CertificateFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange?.(e.target.value as SortOption)
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition"
          />
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
        </div>

        {/* Sort Dropdown */}
        <div className="sm:w-48">
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition bg-white"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      {(resultsCount !== undefined || loading) && (
        <div className="mt-3 text-sm text-gray-600">
          {loading ? (
            'Loading...'
          ) : (
            `${resultsCount} certificate${resultsCount === 1 ? '' : 's'} found`
          )}
        </div>
      )}
    </div>
  )
}
