'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { LoadingSpinner, LoadingState } from '@/components/ui'

interface Activity {
  id: string
  name: string
  activityType: string
  owningGroup: { name: string } | null
}

interface SelectedActivity {
  activityId: string
  name: string
  activityType: string
  sequenceOrder: number
  required: boolean
}

export default function CreateCertificatePage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [programName, setProgramName] = useState('')
  const [signatoryName, setSignatoryName] = useState('')
  const [certificateStatement, setCertificateStatement] = useState('')
  const [studentInstructions, setStudentInstructions] = useState('')
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([])

  // Check permissions
  const isTeacherOrAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 2

  useEffect(() => {
    if (session && isTeacherOrAdmin) {
      loadActivities()
    }
  }, [session, isTeacherOrAdmin])

  async function loadActivities() {
    try {
      const res = await fetch('/api/activities?limit=100')
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
    }
  }

  function addActivity(activity: Activity) {
    if (selectedActivities.some((a) => a.activityId === activity.id)) return

    setSelectedActivities((prev) => [
      ...prev,
      {
        activityId: activity.id,
        name: activity.name,
        activityType: activity.activityType,
        sequenceOrder: prev.length,
        required: true,
      },
    ])
    setSearchQuery('')
  }

  function removeActivity(activityId: string) {
    setSelectedActivities((prev) =>
      prev
        .filter((a) => a.activityId !== activityId)
        .map((a, idx) => ({ ...a, sequenceOrder: idx }))
    )
  }

  function moveActivity(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= selectedActivities.length) return

    const newActivities = [...selectedActivities]
    const temp = newActivities[index]
    newActivities[index] = newActivities[newIndex]
    newActivities[newIndex] = temp

    setSelectedActivities(newActivities.map((a, idx) => ({ ...a, sequenceOrder: idx })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setError('Certificate name is required')
      return
    }

    if (selectedActivities.length === 0) {
      setError('At least one activity is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          organizationName: organizationName || null,
          programName: programName || null,
          signatoryName: signatoryName || null,
          certificateStatement: certificateStatement || null,
          studentInstructions: studentInstructions || null,
          activities: selectedActivities.map((a) => ({
            activityId: a.activityId,
            sequenceOrder: a.sequenceOrder,
            required: a.required,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create certificate')
      }

      const data = await res.json()
      router.push(`/certificates/${data.certificate.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create certificate')
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to create certificates.</p>
      </div>
    )
  }

  if (!isTeacherOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You do not have permission to create certificates.</p>
          <Link href="/certificates" className="text-indigo-600 hover:underline">
            Browse Certificates
          </Link>
        </div>
      </div>
    )
  }

  const filteredActivities = activities.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedActivities.some((sa) => sa.activityId === a.id)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/certificates"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Certificates
          </Link>
          <h1 className="text-2xl font-bold">Create Certificate Program</h1>
          <p className="text-white/80 mt-1">Design a new certificate program for your students</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Data Science Fundamentals Certificate"
                />
              </div>

              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Stanford University"
                />
              </div>

              <div>
                <label htmlFor="programName" className="block text-sm font-medium text-gray-700 mb-1">
                  Program Name
                </label>
                <input
                  id="programName"
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Online Learning Program"
                />
              </div>

              <div>
                <label htmlFor="signatoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Signatory Name
                </label>
                <input
                  id="signatoryName"
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., Dr. John Smith"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Content</h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="certificateStatement" className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Statement
                </label>
                <textarea
                  id="certificateStatement"
                  value={certificateStatement}
                  onChange={(e) => setCertificateStatement(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  placeholder="e.g., This is to certify that the above-named student has successfully completed all requirements..."
                />
              </div>

              <div>
                <label htmlFor="studentInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                  Student Instructions
                </label>
                <textarea
                  id="studentInstructions"
                  value={studentInstructions}
                  onChange={(e) => setStudentInstructions(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  placeholder="Instructions for students on how to complete this certificate program..."
                />
              </div>
            </div>
          </div>

          {/* Required Activities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Required Activities <span className="text-red-500">*</span>
            </h2>

            {/* Search Activities */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Activities
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Search activities..."
                />
                {searchQuery && filteredActivities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredActivities.slice(0, 10).map((activity) => (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() => addActivity(activity)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="font-medium text-gray-900">{activity.name}</p>
                        <p className="text-sm text-gray-500">
                          {activity.activityType} {activity.owningGroup && `- ${activity.owningGroup.name}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Activities */}
            {selectedActivities.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No activities added yet</p>
                <p className="text-sm text-gray-400 mt-1">Search and add activities above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedActivities.map((activity, index) => (
                  <div
                    key={activity.activityId}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.name}</p>
                      <p className="text-sm text-gray-500">{activity.activityType}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={activity.required}
                          onChange={(e) => {
                            setSelectedActivities((prev) =>
                              prev.map((a) =>
                                a.activityId === activity.activityId
                                  ? { ...a, required: e.target.checked }
                                  : a
                              )
                            )
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => moveActivity(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveActivity(index, 'down')}
                        disabled={index === selectedActivities.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeActivity(activity.activityId)}
                        className="p-1.5 text-red-400 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/certificates"
              className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
              style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Certificate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
