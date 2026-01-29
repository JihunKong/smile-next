'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  useCertificateForm,
  CertificateFormFields,
  ActivitySelector,
  type CertificateFormData,
  type SelectedActivity,
} from '@/features/certificates'

interface CertificateActivity {
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
  status: string
  creatorId: string
  activities: CertificateActivity[]
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800',
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

  // Use the certificate form hook
  const {
    formData,
    errors,
    setField,
    addActivity,
    removeActivity,
    reorderActivities,
    updateActivityRequired,
    validate,
  } = useCertificateForm()

  const isTeacherOrAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 2

  // Load certificate data
  useEffect(() => {
    if (!session) return

    async function loadCertificate() {
      try {
        setLoading(true)
        const res = await fetch(`/api/certificates/${certificateId}`)
        if (!res.ok) throw new Error('Certificate not found')

        const data = await res.json()
        const cert = data.certificate

        // Check ownership
        if (cert.creatorId !== session?.user?.id && session?.user?.roleId !== 0) {
          router.push(`/certificates/${certificateId}`)
          return
        }

        setCertificate(cert)

        // Initialize form data
        setField('name', cert.name)
        setField('organizationName', cert.organizationName || '')
        setField('programName', cert.programName || '')
        setField('signatoryName', cert.signatoryName || '')
        setField('certificateStatement', cert.certificateStatement || '')
        setField('studentInstructions', cert.studentInstructions || '')

        // Initialize activities
        cert.activities
          .sort((a: CertificateActivity, b: CertificateActivity) => a.sequenceOrder - b.sequenceOrder)
          .forEach((ca: CertificateActivity) => {
            addActivity({
              activityId: ca.activityId,
              name: ca.activity.name,
              activityType: ca.activity.activityType,
              required: ca.required,
            })
          })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load certificate')
      } finally {
        setLoading(false)
      }
    }

    loadCertificate()
  }, [session, certificateId, router, setField, addActivity])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/certificates/${certificateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          organizationName: formData.organizationName || null,
          programName: formData.programName || null,
          signatoryName: formData.signatoryName || null,
          certificateStatement: formData.certificateStatement || null,
          studentInstructions: formData.studentInstructions || null,
          activities: formData.activities.map((a) => ({
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
      const res = await fetch(`/api/certificates/${certificateId}/submit`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to submit for approval')

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
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
          <Link href="/certificates" className="text-indigo-600 hover:underline">Browse Certificates</Link>
        </div>
      </div>
    )
  }

  if (!isTeacherOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You do not have permission to edit this certificate.</p>
          <Link href={`/certificates/${certificateId}`} className="text-indigo-600 hover:underline">View Certificate</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href={`/certificates/${certificateId}`} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Certificate
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Edit Certificate</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_COLORS[certificate.status]}`}>
              {certificate.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-white/80 mt-1">{certificate.name}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information - Using Feature Component */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information & Content</h2>
            <CertificateFormFields
              formData={formData}
              errors={errors}
              onChange={setField}
              disabled={saving}
            />
          </div>

          {/* Required Activities - Using Feature Component */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Required Activities <span className="text-red-500">*</span>
            </h2>
            {errors.activities && (
              <p className="text-red-600 text-sm mb-4">{errors.activities}</p>
            )}
            <ActivitySelector
              selectedActivities={formData.activities}
              onAdd={(activity) => addActivity({
                activityId: activity.activityId,
                name: activity.name,
                activityType: activity.activityType,
                required: activity.required,
              })}
              onRemove={removeActivity}
              onReorder={reorderActivities}
              onToggleRequired={updateActivityRequired}
              searchEndpoint="/api/activities?limit=10&q"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              {certificate.status === 'draft' && (
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  className="px-4 py-2.5 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition"
                >
                  Submit for Approval
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/certificates/${certificateId}`} className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
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
