'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// Feature module imports for types
import type { CertificateDetails, CertificateActivity } from '@/features/certificates'

// Local type for enrollment status (page-specific)
interface EnrollmentStatus {
  isEnrolled: boolean
  enrollmentId?: string
  status?: string
}

// Extended certificate type with page-specific fields
interface CertificateWithDetails extends CertificateDetails {
  programAvailableDate?: string | null
}

export default function CertificateDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const certificateId = params.id as string

  const [certificate, setCertificate] = useState<CertificateWithDetails | null>(null)
  const [enrollment, setEnrollment] = useState<EnrollmentStatus>({ isEnrolled: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(`/api/certificates/${certificateId}`)
        if (response.ok) {
          const data = await response.json()
          setCertificate(data.certificate)
          setEnrollment(data.enrollment || { isEnrolled: false })
        }
      } catch (error) {
        console.error('Failed to fetch certificate:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (certificateId) {
      fetchCertificate()
    }
  }, [certificateId])

  const handleEnroll = async () => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    setIsEnrolling(true)
    try {
      const response = await fetch(`/api/certificates/${certificateId}/enroll`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setEnrollment({ isEnrolled: true, enrollmentId: data.enrollment.id, status: 'enrolled' })
        router.push(`/my-certificates/${data.enrollment.id}/progress`)
      }
    } catch (error) {
      console.error('Failed to enroll:', error)
    } finally {
      setIsEnrolling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Certificate not found</h2>
          <Link href="/certificates" className="text-[#8C1515] hover:underline">
            Browse certificates
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#8C1515] to-[#B83A4B] p-8">
            <div className="flex items-start justify-between">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">{certificate.name}</h1>
                {certificate.organizationName && (
                  <p className="text-white/80 text-lg">{certificate.organizationName}</p>
                )}
                {certificate.programName && (
                  <p className="text-white/60 mt-1">{certificate.programName}</p>
                )}
              </div>
              {certificate.logoImageUrl && (
                <img
                  src={certificate.logoImageUrl}
                  alt={certificate.name}
                  className="h-20 w-20 object-contain bg-white/10 rounded-lg p-2"
                />
              )}
            </div>
          </div>

          <div className="p-6">
            {certificate.certificateStatement && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Certificate Statement</h3>
                <p className="text-gray-700 italic">&quot;{certificate.certificateStatement}&quot;</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-center border-t pt-6">
              <div>
                <div className="text-2xl font-bold text-[#8C1515]">
                  {certificate.activities.length}
                </div>
                <div className="text-sm text-gray-600">Required Activities</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#8C1515]">
                  {certificate._count.studentCertificates}
                </div>
                <div className="text-sm text-gray-600">Students Enrolled</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#8C1515]">
                  {certificate.signatoryName ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600">Signatory</div>
              </div>
            </div>
          </div>
        </div>

        {/* Required Activities */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Required Activities</h2>
          <div className="space-y-3">
            {certificate.activities
              .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
              .map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-full bg-[#8C1515] text-white flex items-center justify-center text-sm font-medium mr-4">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.activity.name}</h4>
                    <p className="text-sm text-gray-500">{item.activity.activityType}</p>
                  </div>
                  {item.required && (
                    <span className="text-xs bg-[#8C1515]/10 text-[#8C1515] px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Student Instructions */}
        {certificate.studentInstructions && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Instructions</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{certificate.studentInstructions}</p>
          </div>
        )}

        {/* Enrollment Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">
            {enrollment.isEnrolled ? 'Continue Your Progress' : 'Get Started'}
          </h2>

          {enrollment.isEnrolled ? (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                You are enrolled in this certificate program. Continue where you left off.
              </p>
              <Link
                href={`/my-certificates/${enrollment.enrollmentId}/progress`}
                className="inline-flex items-center px-6 py-3 bg-[#8C1515] text-white rounded-lg hover:opacity-90"
              >
                Continue
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-2">
                  Enroll now to start earning this certificate.
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Track your progress
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Earn a verified certificate
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Share your achievement
                  </li>
                </ul>
              </div>
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="inline-flex items-center px-6 py-3 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isEnrolling ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enrolling...
                  </>
                ) : (
                  <>
                    Enroll Now
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
