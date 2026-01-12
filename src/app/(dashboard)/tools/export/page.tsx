'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type ExportType = 'responses' | 'questions' | 'analytics'

interface Activity {
  id: string
  name: string
  groupName: string
  questionCount: number
  responseCount: number
}

export default function ExportToolsPage() {
  const { data: session } = useSession()
  const [exportType, setExportType] = useState<ExportType>('responses')
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!session) return

      try {
        const response = await fetch('/api/activities?limit=100')
        if (response.ok) {
          const data = await response.json()
          setActivities(
            (data.activities || []).map((a: { id: string; name: string; owningGroup?: { name: string }; _count?: { questions: number; responses: number } }) => ({
              id: a.id,
              name: a.name,
              groupName: a.owningGroup?.name || 'Unknown',
              questionCount: a._count?.questions || 0,
              responseCount: a._count?.responses || 0,
            }))
          )
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [session])

  const handleExport = async () => {
    if (!selectedActivityId) {
      setError('Please select an activity')
      return
    }

    setIsExporting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/export/${exportType}?activityId=${selectedActivityId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Export failed')
      }

      // Get the blob and download it
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportType}-${selectedActivityId}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess('Export completed successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const selectedActivity = activities.find((a) => a.id === selectedActivityId)

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to use the Export Tools.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-teal-500 to-green-600 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tools
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Tools
          </h1>
          <p className="text-white/80 mt-1">Export your data, responses, and analytics to CSV</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-[#8C1515]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {/* Export Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setExportType('responses')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      exportType === 'responses'
                        ? 'border-[#8C1515] bg-[#8C1515]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className={`w-8 h-8 mx-auto mb-2 ${exportType === 'responses' ? 'text-[#8C1515]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className={`text-sm font-medium ${exportType === 'responses' ? 'text-[#8C1515]' : 'text-gray-700'}`}>
                      Responses
                    </span>
                  </button>
                  <button
                    onClick={() => setExportType('questions')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      exportType === 'questions'
                        ? 'border-[#8C1515] bg-[#8C1515]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className={`w-8 h-8 mx-auto mb-2 ${exportType === 'questions' ? 'text-[#8C1515]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-sm font-medium ${exportType === 'questions' ? 'text-[#8C1515]' : 'text-gray-700'}`}>
                      Questions
                    </span>
                  </button>
                  <button
                    onClick={() => setExportType('analytics')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      exportType === 'analytics'
                        ? 'border-[#8C1515] bg-[#8C1515]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className={`w-8 h-8 mx-auto mb-2 ${exportType === 'analytics' ? 'text-[#8C1515]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className={`text-sm font-medium ${exportType === 'analytics' ? 'text-[#8C1515]' : 'text-gray-700'}`}>
                      Analytics
                    </span>
                  </button>
                </div>
              </div>

              {/* Activity Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Activity
                </label>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No activities found.</p>
                    <p className="text-sm mt-1">Create an activity first to export data.</p>
                  </div>
                ) : (
                  <select
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                  >
                    <option value="">-- Select an activity --</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name} ({activity.groupName})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Activity Summary */}
              {selectedActivity && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Export Preview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-[#8C1515]">{selectedActivity.questionCount}</div>
                      <div className="text-sm text-gray-500">Questions</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-[#8C1515]">{selectedActivity.responseCount || 0}</div>
                      <div className="text-sm text-gray-500">Responses</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    {exportType === 'responses' && 'Export all student responses with timestamps and content.'}
                    {exportType === 'questions' && 'Export all questions with AI scores and metadata.'}
                    {exportType === 'analytics' && 'Export participation and performance statistics.'}
                  </p>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}

              {/* Export Button */}
              <div className="flex justify-end gap-3">
                <Link
                  href="/tools"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleExport}
                  disabled={isExporting || !selectedActivityId}
                  className="px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:bg-[#6D1010] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export to CSV
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Export Format Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">Export Formats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="font-medium text-gray-900">Responses</h3>
              </div>
              <p className="text-sm text-gray-600">
                Student name, question, response content, timestamp, and rating information.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-medium text-gray-900">Questions</h3>
              </div>
              <p className="text-sm text-gray-600">
                Question content, creator, AI score, Bloom's level, and response count.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="font-medium text-gray-900">Analytics</h3>
              </div>
              <p className="text-sm text-gray-600">
                Participation stats, average scores, completion rates, and daily activity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
