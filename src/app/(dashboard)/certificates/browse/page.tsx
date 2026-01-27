'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Feature module imports
import {
  useCertificates,
  CertificateFilters,
  CertificateGrid,
} from '@/features/certificates'
import type { Certificate } from '@/features/certificates'

export default function CertificatesBrowsePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Use the certificates hook for data fetching
  const {
    certificates,
    loading,
    search,
    setSearch,
    sortBy,
    setSortBy,
    page,
    setPage,
    totalPages,
    totalCount,
  } = useCertificates({
    initialSearch: searchParams.get('q') || '',
    initialSort: (searchParams.get('sort') as 'newest' | 'popular' | 'name') || 'newest',
    initialPage: parseInt(searchParams.get('page') || '1'),
  })

  // Local state for enrollment
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [localCertificates, setLocalCertificates] = useState<Certificate[]>([])

  // Sync certificates from hook to local state for optimistic updates
  useEffect(() => {
    setLocalCertificates(certificates)
  }, [certificates])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (sortBy !== 'newest') params.set('sort', sortBy)
    if (page > 1) params.set('page', page.toString())

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/certificates/browse${newUrl}`, { scroll: false })
  }, [search, sortBy, page, router])

  // Handle enrollment
  const handleEnroll = useCallback(async (certificateId: string) => {
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
        // Optimistic update
        setLocalCertificates((prev) =>
          prev.map((cert) =>
            cert.id === certificateId
              ? { ...cert, isEnrolled: true, enrollmentStatus: 'enrolled' as const }
              : cert
          )
        )
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
  }, [session, router])

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearch('')
  }, [setSearch])

  const isTeacherOrAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 2

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
        {/* Search and Filters - Using Feature Component */}
        <CertificateFilters
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultsCount={loading ? undefined : totalCount}
          loading={loading}
          className="mb-6"
        />

        {/* Results Info with Create Link */}
        {isTeacherOrAdmin && (
          <div className="flex items-center justify-end mb-4">
            <Link
              href="/certificates/designer"
              className="inline-flex items-center text-sm text-[#8C1515] hover:text-[#6D1010] font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Certificate
            </Link>
          </div>
        )}

        {/* Certificates Grid - Using Feature Component */}
        <CertificateGrid
          certificates={localCertificates}
          loading={loading}
          onEnroll={handleEnroll}
          enrollingId={enrollingId ?? undefined}
          searchQuery={search}
          onClearSearch={handleClearSearch}
        />

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                // Show first 3, last 3, and current page area
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (i < 3) {
                  pageNum = i + 1
                } else if (i >= 4) {
                  pageNum = totalPages - (6 - i)
                } else {
                  pageNum = page
                }

                return (
                  <button
                    key={i}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      page === pageNum
                        ? 'bg-[#8C1515] text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
