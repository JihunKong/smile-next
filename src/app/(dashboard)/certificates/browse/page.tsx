'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Certificate {
  id: string
  name: string
  organizationName: string | null
  programName: string | null
  certificateStatement: string | null
  logoImageUrl: string | null
  status: string
  createdAt: string
  _count: {
    activities: number
    studentCertificates: number
  }
  isEnrolled?: boolean
  enrollmentStatus?: string
}

type SortOption = 'newest' | 'popular' | 'name'

function debounce(fn: (query: string) => void, delay: number): (query: string) => void {
  let timeoutId: NodeJS.Timeout
  return (query: string) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(query), delay)
  }
}

export default function CertificatesBrowsePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // State
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'newest')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  // Fetch certificates
  const fetchCertificates = useCallback(async (query: string, sort: SortOption, pageNum: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      params.set('sort', sort)
      params.set('page', pageNum.toString())
      params.set('limit', '12')

      const response = await fetch(`/api/certificates/browse?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCertificates(data.certificates || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  const debouncedFetch = useCallback(
    debounce((query: string) => {
      setPage(1)
      fetchCertificates(query, sortBy, 1)
    }, 300),
    [fetchCertificates, sortBy]
  )

  // Initial load and on search/sort change
  useEffect(() => {
    fetchCertificates(searchQuery, sortBy, page)
  }, [sortBy, page]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (sortBy !== 'newest') params.set('sort', sortBy)
    if (page > 1) params.set('page', page.toString())

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/certificates/browse${newUrl}`, { scroll: false })
  }, [searchQuery, sortBy, page, router])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedFetch(value)
  }

  // Handle sort change
  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort)
    setPage(1)
  }

  // Handle enrollment
  const handleEnroll = async (certificateId: string) => {
    if (!session?.user?.id) {
      router.push('/login')
      return
    }

    setEnrollingId(certificateId)
    try {
      const response = await fetch(`/api/certificates/${certificateId}/enroll`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update the certificate in the list
        setCertificates((prev) =>
          prev.map((cert) =>
            cert.id === certificateId
              ? { ...cert, isEnrolled: true, enrollmentStatus: 'enrolled' }
              : cert
          )
        )
        // Navigate to certificate details
        router.push(`/certificates/${certificateId}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to enroll')
      }
    } catch (error) {
      console.error('Failed to enroll:', error)
      alert('Failed to enroll. Please try again.')
    } finally {
      setEnrollingId(null)
    }
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'name', label: 'Name (A-Z)' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[#8C1515] to-[#B83A4B] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Certificate Catalog</h1>
              <p className="text-white/80 mt-1">
                Browse and enroll in certificate programs to advance your learning
              </p>
            </div>
            <Link
              href="/my-certificates"
              className="inline-flex items-center px-4 py-2 border border-white/50 text-white rounded-lg hover:bg-white/10 transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              My Certificates
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name or organization..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition bg-white"
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

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${certificates.length} certificates found`}
          </p>
          {session?.user?.roleId !== undefined && session.user.roleId <= 2 && (
            <Link
              href="/certificates/designer"
              className="inline-flex items-center text-sm text-[#8C1515] hover:text-[#6D1010] font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Certificate
            </Link>
          )}
        </div>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-200" />
                <div className="p-5">
                  <div className="h-5 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term.`
                : 'No certificate programs are currently available.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  fetchCertificates('', sortBy, 1)
                }}
                className="text-[#8C1515] hover:text-[#6D1010] font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Certificate Header/Logo */}
                  <div className="h-36 bg-gradient-to-br from-[#8C1515] to-[#B83A4B] flex items-center justify-center relative">
                    {cert.logoImageUrl ? (
                      <img
                        src={cert.logoImageUrl}
                        alt={cert.name}
                        className="max-h-20 max-w-[80%] object-contain"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    )}

                    {/* Enrolled Badge */}
                    {cert.isEnrolled && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Enrolled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Certificate Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-[#2E2D29] mb-1 group-hover:text-[#8C1515] transition-colors line-clamp-2">
                      {cert.name}
                    </h3>
                    {cert.organizationName && (
                      <p className="text-sm text-gray-500 mb-3 truncate">{cert.organizationName}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {cert._count.activities} activities
                      </span>
                      <span className="flex items-center text-[#8C1515]">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {cert._count.studentCertificates} enrolled
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {cert.isEnrolled ? (
                        <Link
                          href={`/certificates/${cert.id}`}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#8C1515] text-white text-sm font-medium rounded-lg hover:bg-[#6D1010] transition"
                        >
                          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          View Progress
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={`/certificates/${cert.id}`}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                          >
                            View Details
                          </Link>
                          <button
                            onClick={() => handleEnroll(cert.id)}
                            disabled={enrollingId === cert.id}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#8C1515] text-white text-sm font-medium rounded-lg hover:bg-[#6D1010] disabled:opacity-50 transition"
                          >
                            {enrollingId === cert.id ? (
                              <>
                                <svg className="animate-spin h-4 w-4 mr-1.5" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Enrolling...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Enroll
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition ${
                        page === pageNum
                          ? 'bg-[#8C1515] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
