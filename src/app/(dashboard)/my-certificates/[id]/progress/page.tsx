'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// Feature module imports
import {
  useCertificateProgress,
  ProgressTracker,
} from '@/features/certificates'

export default function CertificateProgressPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const enrollmentId = params.id as string

  // Use the certificate progress hook for data fetching
  const {
    progress,
    activities,
    stats,
    isCompleted,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useCertificateProgress({ enrollmentId })

  // Local state for download
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownloadCertificate = useCallback(async () => {
    if (!progress) return

    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(`/api/my-certificates/${enrollmentId}/download-pdf`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to download certificate')
      }

      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/pdf')) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ||
          `Certificate_${progress.verificationCode || 'download'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (contentType?.includes('text/html')) {
        const html = await response.text()
        const blob = new Blob([html], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      } else {
        throw new Error('Unexpected response format')
      }
    } catch (err) {
      console.error('Failed to download certificate:', err)
      setDownloadError(err instanceof Error ? err.message : 'Failed to download certificate')
    } finally {
      setIsDownloading(false)
    }
  }, [progress, enrollmentId])

  const handleShare = useCallback(async () => {
    if (!progress) return

    const shareUrl = `${window.location.origin}/verify/${progress.verificationCode}`
    const shareText = `I completed the ${progress.certificate.name} certificate program!`

    if (navigator.share) {
      try {
        await navigator.share({
          title: progress.certificate.name,
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await copyToClipboard(shareUrl)
        }
      }
    } else {
      await copyToClipboard(shareUrl)
    }
  }, [progress])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Verification link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert(`Copy this link to share: ${text}`)
    }
  }

  // Auth check
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your progress.</p>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    )
  }

  // Error or not found
  if (error || !progress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Certificate not found'}
          </h2>
          <Link href="/my-certificates" className="text-[#8C1515] hover:underline">
            View my certificates
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Completion Banner */}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Congratulations!</h3>
                  <p className="text-green-700">You have completed this certificate program.</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadCertificate}
                  disabled={isDownloading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Certificate
                    </>
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
            {downloadError && (
              <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                <p className="text-sm text-red-600">
                  <strong>Download Error:</strong> {downloadError}
                </p>
              </div>
            )}
            <div className="mt-4 p-3 bg-white rounded border border-green-200">
              <p className="text-sm text-gray-600">
                <strong>Verification Code:</strong>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">{progress.verificationCode}</code>
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2E2D29]">{progress.certificate.name}</h1>
              {progress.certificate.organizationName && (
                <p className="text-gray-500 mt-1">{progress.certificate.organizationName}</p>
              )}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 mr-2 ${isRefetching ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{stats.notStarted}</div>
                <div className="text-sm text-gray-500">Not Started</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8C1515]">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          )}
        </div>

        {/* Activity List - Using Feature Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Activities</h2>
          {stats && (
            <ProgressTracker
              activities={activities}
              progress={stats}
            />
          )}
        </div>

        {/* Enrollment Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Enrolled on {new Date(progress.enrollmentDate).toLocaleDateString()}
            {progress.completionDate && (
              <> &bull; Completed on {new Date(progress.completionDate).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
