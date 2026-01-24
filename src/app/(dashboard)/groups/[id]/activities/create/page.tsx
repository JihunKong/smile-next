'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGroup } from '@/features/groups'
import { ModeSelector } from '@/components/modes/ModeSelector'
import { LoadingSpinner, LoadingState } from '@/components/ui'
import { ActivityModes, type ActivityMode } from '@/types/activities'
import {
  useActivityForm,
  useCreateActivity,
  useKeywordManager,
  useScenarioManager,
} from '@/features/activities/hooks'
import {
  BasicInfoFields,
  GeneralSettings,
  ExamSettingsForm,
  InquirySettingsForm,
  CaseSettingsForm,
} from '@/features/activities/components'

export default function GroupActivityCreatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()

  const { group, loading: groupLoading } = useGroup({
    groupId,
    includeActivities: false,
    includeMembers: false,
  })

  const { values, errors, setField, setExamSetting, setInquirySetting, setCaseSetting, validate, getSubmitData } =
    useActivityForm()

  const keywordManager = useKeywordManager()
  const scenarioManager = useScenarioManager()

  const { createActivity, isLoading, error } = useCreateActivity({
    onSuccess: (activityId) => router.push(`/activities/${activityId}`),
  })

  // Set groupId when component mounts
  useEffect(() => {
    setField('groupId', groupId)
  }, [groupId, setField])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const submitData = getSubmitData()
    // Merge keyword/scenario manager state into submit data
    if (submitData.mode === ActivityModes.INQUIRY && submitData.inquirySettings) {
      submitData.inquirySettings = {
        ...submitData.inquirySettings,
        keywordPool1: keywordManager.pool1,
        keywordPool2: keywordManager.pool2,
      }
    }
    if (submitData.mode === ActivityModes.CASE && submitData.caseSettings) {
      submitData.caseSettings = {
        ...submitData.caseSettings,
        scenarios: scenarioManager.scenarios,
      }
    }
    await createActivity(submitData)
  }, [validate, getSubmitData, keywordManager, scenarioManager, createActivity])

  if (groupLoading) return <LoadingState message="Loading group..." />

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center text-red-500">Group not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            ← Back to {group.name}
          </Link>
          <h1 className="text-2xl font-bold">Create New Activity</h1>
          <p className="text-white/80 mt-1">Set up a learning activity for {group.name}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <BasicInfoFields
              values={{ name: values.name, description: values.description, visible: true }}
              onChange={(field, value) => setField(field as 'name' | 'description', value as string)}
              errors={errors.name ? { name: errors.name } : undefined}
            />
          </div>

          {/* Mode Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Activity Mode</h2>
            <ModeSelector
              selectedMode={values.mode}
              onModeChange={(mode: ActivityMode) => setField('mode', mode)}
            />
          </div>

          {/* Mode-specific Settings */}
          {values.mode === ActivityModes.EXAM && values.examSettings && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <ExamSettingsForm values={values.examSettings} onChange={setExamSetting} />
            </div>
          )}

          {values.mode === ActivityModes.INQUIRY && values.inquirySettings && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <InquirySettingsForm
                values={values.inquirySettings}
                onChange={setInquirySetting}
                keywordManager={keywordManager}
              />
            </div>
          )}

          {values.mode === ActivityModes.CASE && values.caseSettings && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <CaseSettingsForm
                values={values.caseSettings}
                onChange={setCaseSetting}
                scenarioManager={scenarioManager}
              />
            </div>
          )}

          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <GeneralSettings
              values={{
                aiRatingEnabled: values.aiRatingEnabled,
                allowAnonymous: values.isAnonymousAuthorAllowed,
                hideUsernames: values.hideUsernames,
                isPublished: false,
              }}
              onChange={(field, value) => {
                if (field === 'allowAnonymous') {
                  setField('isAnonymousAuthorAllowed', value)
                } else if (field === 'aiRatingEnabled' || field === 'hideUsernames') {
                  setField(field, value)
                }
              }}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link href={`/groups/${groupId}`} className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[var(--stanford-cardinal)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                'Create Activity'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
