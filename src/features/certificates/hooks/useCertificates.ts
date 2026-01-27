/**
 * useCertificates Hook
 *
 * Manages certificate list fetching, filtering, sorting, and pagination.
 * Extracted from certificates/browse/page.tsx for reuse across components.
 */

import { useState, useEffect, useCallback } from 'react'
import type { Certificate, SortOption } from '../types'

export interface UseCertificatesOptions {
  /** Initial search query */
  initialSearch?: string
  /** Initial sort option */
  initialSort?: SortOption
  /** Initial page number */
  initialPage?: number
  /** Results per page */
  limit?: number
  /** Auto-fetch on mount */
  autoFetch?: boolean
}

export interface UseCertificatesReturn {
  /** List of certificates */
  certificates: Certificate[]
  /** Loading state */
  loading: boolean
  /** Error state */
  error: Error | null
  /** Current search query */
  search: string
  /** Update search query */
  setSearch: (query: string) => void
  /** Current sort option */
  sortBy: SortOption
  /** Update sort option */
  setSortBy: (sort: SortOption) => void
  /** Current page */
  page: number
  /** Update page */
  setPage: (page: number) => void
  /** Total pages */
  totalPages: number
  /** Total count */
  totalCount: number
  /** Refetch certificates */
  refetch: () => Promise<void>
}

/**
 * Hook for fetching and managing certificate list
 *
 * @example
 * ```tsx
 * function CertificateList() {
 *   const {
 *     certificates,
 *     loading,
 *     search,
 *     setSearch,
 *     sortBy,
 *     setSortBy,
 *   } = useCertificates()
 *
 *   if (loading) return <Loading />
 *
 *   return (
 *     <div>
 *       <input value={search} onChange={e => setSearch(e.target.value)} />
 *       {certificates.map(cert => <CertificateCard key={cert.id} {...cert} />)}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCertificates(options: UseCertificatesOptions = {}): UseCertificatesReturn {
  const {
    initialSearch = '',
    initialSort = 'newest',
    initialPage = 1,
    limit = 12,
    autoFetch = true,
  } = options

  // State
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [search, setSearchState] = useState(initialSearch)
  const [sortBy, setSortByState] = useState<SortOption>(initialSort)
  const [page, setPageState] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch certificates from API
  const fetchCertificates = useCallback(async (
    searchQuery: string,
    sort: SortOption,
    pageNum: number
  ) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      params.set('sort', sort)
      params.set('page', pageNum.toString())
      params.set('limit', limit.toString())

      const response = await fetch(`/api/certificates/browse?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch certificates')
      }

      const data = await response.json()
      setCertificates(data.certificates || [])
      setTotalPages(data.pagination?.totalPages || 0)
      setTotalCount(data.pagination?.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setCertificates([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  // Refetch with current params
  const refetch = useCallback(async () => {
    await fetchCertificates(search, sortBy, page)
  }, [fetchCertificates, search, sortBy, page])

  // Set search and reset page
  const setSearch = useCallback((query: string) => {
    setSearchState(query)
    setPageState(1) // Reset to first page on search change
  }, [])

  // Set sort and reset page
  const setSortBy = useCallback((sort: SortOption) => {
    setSortByState(sort)
    setPageState(1) // Reset to first page on sort change
  }, [])

  // Set page
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage)
  }, [])

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchCertificates(search, sortBy, page)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch on filter/sort/page changes (after initial mount)
  useEffect(() => {
    // Skip initial render
    const isInitial =
      search === initialSearch &&
      sortBy === initialSort &&
      page === initialPage

    if (!isInitial && autoFetch) {
      fetchCertificates(search, sortBy, page)
    }
  }, [search, sortBy, page]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    certificates,
    loading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
    page,
    setPage,
    totalPages,
    totalCount,
    refetch,
  }
}
