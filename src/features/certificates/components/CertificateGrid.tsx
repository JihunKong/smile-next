/**
 * CertificateGrid Component
 *
 * Displays a responsive grid of certificate cards with loading
 * skeleton and empty state support.
 */

'use client'

import { CertificateCard } from './CertificateCard'
import type { Certificate } from '../types'

export interface CertificateGridProps {
  /** List of certificates to display */
  certificates: Certificate[]
  /** Whether data is loading */
  loading?: boolean
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number
  /** Number of columns (2, 3, or 4) */
  cols?: 2 | 3 | 4
  /** Called when user clicks Enroll on a certificate */
  onEnroll?: (certificateId: string) => void
  /** ID of certificate currently being enrolled */
  enrollingId?: string
  /** Message to show when no certificates */
  emptyMessage?: string
  /** Current search query (for empty state) */
  searchQuery?: string
  /** Called when clear search is clicked */
  onClearSearch?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Skeleton card for loading state
 */
function CertificateCardSkeleton() {
  return (
    <div
      data-testid="certificate-skeleton"
      className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
    >
      <div className="h-36 bg-gray-200" />
      <div className="p-5">
        <div className="h-5 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 h-9 bg-gray-200 rounded" />
          <div className="flex-1 h-9 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState({
  message,
  searchQuery,
  onClearSearch,
}: {
  message: string
  searchQuery?: string
  onClearSearch?: () => void
}) {
  return (
    <div className="text-center py-16 bg-white rounded-lg shadow-md">
      <svg
        className="w-16 h-16 text-gray-300 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No certificates found
      </h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {searchQuery && onClearSearch && (
        <button
          onClick={onClearSearch}
          className="text-[#8C1515] hover:text-[#6D1010] font-medium"
        >
          Clear search
        </button>
      )}
    </div>
  )
}

/**
 * Get grid column classes based on cols prop
 */
function getGridCols(cols: 2 | 3 | 4): string {
  switch (cols) {
    case 2:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
    case 4:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    case 3:
    default:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }
}

export function CertificateGrid({
  certificates,
  loading = false,
  skeletonCount = 6,
  cols = 3,
  onEnroll,
  enrollingId,
  emptyMessage = 'No certificate programs are currently available.',
  searchQuery,
  onClearSearch,
  className = '',
}: CertificateGridProps) {
  const gridCols = getGridCols(cols)

  // Loading state
  if (loading) {
    return (
      <div className={`grid ${gridCols} gap-6 ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <CertificateCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state
  if (certificates.length === 0) {
    const displayMessage = searchQuery
      ? `No results for "${searchQuery}". Try a different search term.`
      : emptyMessage

    return (
      <EmptyState
        message={displayMessage}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
      />
    )
  }

  // Certificate grid
  return (
    <div className={`grid ${gridCols} gap-6 ${className}`}>
      {certificates.map((cert) => (
        <div key={cert.id} data-testid="certificate-card">
          <CertificateCard
            certificate={cert}
            onEnroll={onEnroll}
            isEnrolling={enrollingId === cert.id}
          />
        </div>
      ))}
    </div>
  )
}
