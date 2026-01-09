'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Activity {
  id: string
  name: string
  activityType: string
  owningGroup: { name: string } | null
}

interface CertificateActivity {
  id: string
  activityId: string
  sequenceOrder: number
  required: boolean
  activity: {
    id: string
    name: string
    activityType: string
  }
}

interface Certificate {
  id: string
  name: string
  organizationName: string | null
  programName: string | null
  signatoryName: string | null
  certificateStatement: string | null
  studentInstructions: string | null
  logoImageUrl: string | null
  status: string
  creatorId: string
  activities: CertificateActivity[]
}

interface SelectedActivity {
  activityId: string
  name: string
  activityType: string
  sequenceOrder: number
  required: boolean
}

export default function EditCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: certificateId } = use(params)
  const router = useRouter()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<Certificate | null>(null)
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
    if (session) {
      loadCertificate()
      loadActivities()
    }
  }, [session, certificateId])

  async function loadCertificate() {
    try {
      setLoading(true)
      const res = await fetch(`/api/certificates/${certificateId}`)
      if (!res.ok) {
        throw new Error('Certificate not found')
      }
      const data = await res.json()
      const cert = data.certificate

      // Check ownership
      if (cert.creatorId !== session?.user?.id && session?.user?.roleId !== 0) {
        router.push(`/certificates/${certificateId}`)
        return
      }

      setCertificate(cert)
      setName(cert.name)
      setOrganizationName(cert.organizationName || '')
      setProgramName(cert.programName || '')
      setSignatoryName(cert.signatoryName || '')
      setCertificateStatement(cert.certificateStatement || '')
      setStudentInstructions(cert.studentInstructions || '')
      setSelectedActivities(
        cert.activities
          .sort((a: CertificateActivity, b: CertificateActivity) => a.sequenceOrder - b.sequenceOrder)
          .map((ca: CertificateActivity) => ({
            activityId: ca.activityId,
            name: ca.activity.name,
            activityType: ca.activity.activityType,
            sequenceOrder: ca.sequenceOrder,
            required: ca.required,
          }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certificate')
    } finally {
      setLoading(false)
    }
  }

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

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/certificates/${certificateId}`, {
        method: 'PATCH',
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
        throw new Error(data.error || 'Failed to update certificate')
      }

      setSuccess('Certificate updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update certificate')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitForApproval() {
    if (!certificate || certificate.status !== 'draft') return

    try {
      const res = await fetch(`/api/certificates/${certificateId}/submit`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to submit for approval')
      }

      setCertificate((prev) => (prev ? { ...prev, status: 'pending_approval' } : null))
      setSuccess('Certificate submitted for approval!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for approval')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Certificate not found</p>
          <Link href="/certificates" className="text-indigo-600 hover:underline">
            Browse Certificates
          </Link>
        </div>
      </div>
    )
  }

  if (!isTeacherOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You do not have permission to edit this certificate.</p>
          <Link href={`/certificates/${certificateId}`} className="text-indigo-600 hover:underline">
            View Certificate
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
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href={`/certificates/${certificateId}`}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Certificate
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Edit Certificate</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[certificate.status]}`}>
              {certificate.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-white/80 mt-1">{certificate.name}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                />
              </div>
            </div>
          </div>

          {/* Required Activities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Required Activities <span className="text-red-500">*</span>
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Activities</label>
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
                        <p className="text-sm text-gray-500">{activity.activityType}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedActivities.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No activities added yet</p>
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

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              {certificate.status === 'draft' && (
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  className="px-4 py-2.5 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
                  style={{ backgroundColor: '#eab308', color: '#ffffff' }}
                >
                  Submit for Approval
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/certificates/${certificateId}`}
                className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
