'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useActivityEdit } from './hooks'
import {
  BasicInfoForm,
  PrivacySettings,
  OpenModeSettings,
  ExamModeSettings,
  InquiryModeSettings,
} from './components'

export default function ActivityEditPage() {
  const params = useParams()
  const activityId = params.id as string

  const {
    loading,
    saving,
    error,
    success,
    activity,
    basicInfo,
    setBasicInfo,
    examState,
    setExamState,
    inquiryState,
    setInquiryState,
    openModeState,
    setOpenModeState,
    handleSubmit,
  } = useActivityEdit(activityId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href={`/activities/${activityId}`} className="text-indigo-600 hover:underline">
            Back to Activity
          </Link>
        </div>
      </div>
    )
  }

  if (!activity) return null

  const modeLocked = activity.hasQuestions || activity.hasAttempts

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/activities/${activityId}`}
            className="text-indigo-600 hover:underline text-sm mb-2 inline-block"
          >
            &larr; Back to Activity
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Activity</h1>
          <p className="text-gray-600 mt-1">
            {activity.owningGroup.name} &gt; {activity.name}
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">Changes saved successfully!</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <BasicInfoForm
            basicInfo={basicInfo}
            setBasicInfo={setBasicInfo}
            activityMode={activity.mode}
            modeLocked={modeLocked}
          />

          <PrivacySettings basicInfo={basicInfo} setBasicInfo={setBasicInfo} />

          {activity.mode === 0 && (
            <OpenModeSettings openModeState={openModeState} setOpenModeState={setOpenModeState} />
          )}

          {activity.mode === 1 && (
            <ExamModeSettings examState={examState} setExamState={setExamState} />
          )}

          {activity.mode === 2 && (
            <InquiryModeSettings inquiryState={inquiryState} setInquiryState={setInquiryState} />
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Link href={`/activities/${activityId}`} className="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
              style={{ backgroundColor: 'var(--stanford-cardinal)' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
