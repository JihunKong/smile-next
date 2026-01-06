'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface StudentCertificate {
  id: string
  status: string
  enrollmentDate: string
  completionDate: string | null
  verificationCode: string
  certificate: {
    id: string
    name: string
    organizationName: string | null
    logoImageUrl: string | null
    _count: {
      activities: number
    }
  }
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

export default function MyCertificatesPage() {
  const { data: session } = useSession()
  const [certificates, setCertificates] = useState<StudentCertificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    const fetchMyCertificates = async () => {
      try {
        const response = await fetch('/api/my-certificates')
        if (response.ok) {
          const data = await response.json()
          setCertificates(data.certificates || [])
        }
      } catch (error) {
        console.error('Failed to fetch certificates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchMyCertificates()
    }
  }, [session])

  const filteredCertificates = certificates.filter((cert) => {
    if (filter === 'all') return true
    if (filter === 'in_progress') return cert.status !== 'completed'
    if (filter === 'completed') return cert.status === 'completed'
    return true
  })

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your certificates.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2E2D29]">My Certificates</h1>
            <p className="text-gray-600 mt-1">
              Track your progress and download completed certificates
            </p>
          </div>
          <Link
            href="/certificates"
            className="inline-flex items-center px-4 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Browse Programs
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          {(['all', 'in_progress', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-[#8C1515] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded w-full mt-4"></div>
              </div>
            ))}
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all'
                ? "You haven't enrolled in any certificates yet"
                : filter === 'in_progress'
                ? 'No certificates in progress'
                : 'No completed certificates'}
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === 'all' && 'Start your learning journey by enrolling in a certificate program.'}
            </p>
            {filter === 'all' && (
              <Link
                href="/certificates"
                className="inline-flex items-center px-4 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90"
              >
                Browse Programs
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCertificates.map((sc) => (
              <div key={sc.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2E2D29]">
                        {sc.certificate.name}
                      </h3>
                      {sc.certificate.organizationName && (
                        <p className="text-sm text-gray-500">{sc.certificate.organizationName}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sc.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {sc.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-[#8C1515]">
                        {sc.progress.completed}/{sc.progress.total} activities
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          sc.status === 'completed' ? 'bg-green-500' : 'bg-[#8C1515]'
                        }`}
                        style={{ width: `${sc.progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Enrolled: {new Date(sc.enrollmentDate).toLocaleDateString()}
                    </span>
                    {sc.completionDate && (
                      <span>
                        Completed: {new Date(sc.completionDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
                  <Link
                    href={`/my-certificates/${sc.id}/progress`}
                    className="text-[#8C1515] font-medium hover:underline"
                  >
                    View Progress
                  </Link>
                  {sc.status === 'completed' && (
                    <button className="inline-flex items-center px-4 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
