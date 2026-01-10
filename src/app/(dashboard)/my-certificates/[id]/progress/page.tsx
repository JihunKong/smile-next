'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ActivityProgress {
  id: string
  activity: {
    id: string
    name: string
    description: string | null
    activityType: string
    owningGroupId: string
  }
  sequenceOrder: number
  required: boolean
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
}

interface CertificateProgress {
  id: string
  status: string
  enrollmentDate: string
  completionDate: string | null
  verificationCode: string
  certificate: {
    id: string
    name: string
    organizationName: string | null
    programName: string | null
    certificateStatement: string | null
    logoImageUrl: string | null
  }
  activities: ActivityProgress[]
  progress: {
    completed: number
    inProgress: number
    notStarted: number
    total: number
    percentage: number
  }
}

export default function CertificateProgressPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const enrollmentId = params.id as string

  const [progress, setProgress] = useState<CertificateProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/my-certificates/${enrollmentId}/progress`)
      if (response.ok) {
        const data = await response.json()
        setProgress(data)
      } else if (response.status === 404) {
        router.push('/my-certificates')
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (enrollmentId && session) {
      fetchProgress()
    }
  }, [enrollmentId, session])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchProgress()
  }

  const handleDownloadCertificate = async () => {
    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(`/api/my-certificates/${enrollmentId}/download-pdf`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to download certificate')
      }

      // Check content type
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/pdf')) {
        // Download as PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] ||
          `Certificate_${progress?.verificationCode || 'download'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else if (contentType?.includes('text/html')) {
        // Fallback: Open HTML in new tab for manual printing
        const html = await response.text()
        const blob = new Blob([html], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
        // Note: URL will be revoked when tab is closed by browser
      } else {
        throw new Error('Unexpected response format')
      }
    } catch (error) {
      console.error('Failed to download certificate:', error)
      setDownloadError(error instanceof Error ? error.message : 'Failed to download certificate')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = async () => {
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
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== 'AbortError') {
          await copyToClipboard(shareUrl)
        }
      }
    } else {
      await copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Verification link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert(`Copy this link to share: ${text}`)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your progress.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
      </div>
    )
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Certificate not found</h2>
          <Link href="/my-certificates" className="text-[#8C1515] hover:underline">
            View my certificates
          </Link>
        </div>
      </div>
    )
  }

  const isCompleted = progress.status === 'completed'

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
                  <p className="text-green-700">
                    You have completed this certificate program.
                  </p>
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
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-semibold text-[#8C1515]">{progress.progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  isCompleted ? 'bg-green-500' : 'bg-[#8C1515]'
                }`}
                style={{ width: `${progress.progress.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{progress.progress.completed}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{progress.progress.inProgress}</div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{progress.progress.notStarted}</div>
              <div className="text-sm text-gray-500">Not Started</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#8C1515]">{progress.progress.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Activities</h2>
          <div className="space-y-4">
            {progress.activities
              .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
              .map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center p-4 border rounded-lg ${
                    item.status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : item.status === 'in_progress'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                      item.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : item.status === 'in_progress'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {item.status === 'completed' ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.activity.name}</h4>
                    <p className="text-sm text-gray-500">
                      {item.activity.activityType}
                      {item.score !== undefined && (
                        <span className="ml-2 text-green-600">Score: {item.score}%</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.status === 'completed'
                        ? 'Completed'
                        : item.status === 'in_progress'
                        ? 'In Progress'
                        : 'Not Started'}
                    </span>
                    {item.status !== 'completed' && (
                      <Link
                        href={`/groups/${item.activity.owningGroupId}/activities/${item.activity.id}`}
                        className="text-[#8C1515] hover:underline text-sm font-medium"
                      >
                        {item.status === 'in_progress' ? 'Continue' : 'Start'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
          </div>
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
