'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Certificate {
  id: string
  name: string
  organizationName: string | null
  status: string
  creatorId: string
  createdAt: string
  submittedAt: string | null
  _count: {
    activities: number
    studentCertificates: number
  }
  creator?: {
    firstName: string | null
    lastName: string | null
    email: string
  }
}

function AdminCertificatesContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>(filterParam || 'all')

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await fetch(`/api/admin/certificates?filter=${filter}`)
        if (response.ok) {
          const data = await response.json()
          setCertificates(data.certificates)
        } else if (response.status === 403) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to fetch certificates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session) {
      fetchCertificates()
    }
  }, [session, filter, router])

  const isAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 1

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Access denied.</p>
      </div>
    )
  }

  const handleApprove = async (certId: string) => {
    try {
      const response = await fetch(`/api/admin/certificates/${certId}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        setCertificates((prev) =>
          prev.map((c) => (c.id === certId ? { ...c, status: 'active' } : c))
        )
      }
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (certId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const response = await fetch(`/api/admin/certificates/${certId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        setCertificates((prev) =>
          prev.map((c) => (c.id === certId ? { ...c, status: 'rejected' } : c))
        )
      }
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2E2D29]">Certificate Management</h1>
            <p className="text-gray-600 mt-1">Review and approve certificate programs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'active', 'rejected', 'draft'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                filter === f
                  ? 'bg-[#8C1515] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
              {f === 'pending' && certificates.filter((c) => c.status === 'pending_approval').length > 0 && (
                <span className="ml-2 bg-white text-[#8C1515] text-xs px-2 py-0.5 rounded-full">
                  {certificates.filter((c) => c.status === 'pending_approval').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Certificates List */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No certificates found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {certificates
                .filter((c) => filter === 'all' || c.status === filter || (filter === 'pending' && c.status === 'pending_approval'))
                .map((cert) => (
                  <div key={cert.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-[#2E2D29]">{cert.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[cert.status] || 'bg-gray-100'}`}>
                            {cert.status.replace('_', ' ')}
                          </span>
                        </div>
                        {cert.organizationName && (
                          <p className="text-gray-500 text-sm mt-1">{cert.organizationName}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{cert._count.activities} activities</span>
                          <span>{cert._count.studentCertificates} enrolled</span>
                          <span>Created: {new Date(cert.createdAt).toLocaleDateString()}</span>
                          {cert.submittedAt && (
                            <span>Submitted: {new Date(cert.submittedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        {cert.creator && (
                          <p className="text-xs text-gray-400 mt-1">
                            By: {cert.creator.firstName} {cert.creator.lastName} ({cert.creator.email})
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {cert.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handleApprove(cert.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(cert.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminCertificatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    }>
      <AdminCertificatesContent />
    </Suspense>
  )
}
