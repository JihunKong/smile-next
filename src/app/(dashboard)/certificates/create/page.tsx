'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui'

// Feature module imports
import {
  useCertificateForm,
  CertificateFormFields,
  ActivitySelector,
} from '@/features/certificates'
import type { Activity, SelectedActivity } from '@/features/certificates'

export default function CreateCertificatePage() {
  const router = useRouter()
  const { data: session } = useSession()

  // Use the certificate form hook for form state management
  const {
    formData,
    errors,
    setField,
    addActivity,
    removeActivity,
    reorderActivities,
    updateActivityRequired,
    validate,
    getActivityCount,
  } = useCertificateForm()

  // Local state for API and loading
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Check permissions
  const isTeacherOrAdmin = session?.user?.roleId !== undefined && session.user.roleId <= 2

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
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
        throw new Error(data.error || 'Failed to create certificate')
      }

      const data = await res.json()
      router.push(`/certificates/${data.certificate.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create certificate')
    } finally {
      setLoading(false)
    }
  }

  // Handle activity add from search results
  const handleAddActivity = (activity: Omit<SelectedActivity, 'sequenceOrder'>) => {
    addActivity({
      activityId: activity.activityId,
      name: activity.name,
      activityType: activity.activityType,
      required: activity.required,
    })
  }

  // Handle reorder with direction
  const handleMoveActivity = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < formData.activities.length) {
      reorderActivities(index, newIndex)
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
          {/* Error Messages */}
          {(submitError || errors.general) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {submitError || errors.general}
            </div>
          )}

          {/* Basic Information - Using Feature Component */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            <CertificateFormFields
              formData={formData}
              errors={errors}
              onChange={setField}
              disabled={loading}
            />
          </div>

          {/* Required Activities */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Required Activities <span className="text-red-500">*</span>
            </h2>

            {/* Activity error */}
            {errors.activities && (
              <p className="mb-4 text-sm text-red-600">{errors.activities}</p>
            )}

            {/* Activity Selector - Using Feature Component */}
            <ActivitySelector
              selectedActivities={formData.activities}
              onAdd={handleAddActivity}
              onRemove={removeActivity}
              onReorder={reorderActivities}
              onToggleRequired={updateActivityRequired}
              searchEndpoint="/api/activities?q="
            />
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
