'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StepIndicator from './components/StepIndicator'
import ActivityDetailsStep from './components/ActivityDetailsStep'
import QuestionConfigStep from './components/QuestionConfigStep'
import GroupSelectionStep from './components/GroupSelectionStep'
import ReviewStep from './components/ReviewStep'

export interface ActivityFormData {
  // Step 1: Activity Details
  targetAudience: string
  primaryLanguage: string
  mainTopic: string
  educationLevel: 'elementary' | 'middle' | 'high' | 'college' | 'graduate' | ''
  subTopics: string

  // Step 2: Question Configuration
  questionCount: 5 | 10

  // Step 3: Group Selection
  groupSelection: 'existing' | 'new'
  groupId: string
  newGroupName: string
  groupPrivacy: 'public' | 'private'
}

const initialFormData: ActivityFormData = {
  targetAudience: '',
  primaryLanguage: 'en',
  mainTopic: '',
  educationLevel: '',
  subTopics: '',
  questionCount: 5,
  groupSelection: 'existing',
  groupId: '',
  newGroupName: '',
  groupPrivacy: 'public',
}

export default function ActivityMakerPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ActivityFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const updateFormData = (updates: Partial<ActivityFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const canProceedStep1 = formData.targetAudience && formData.mainTopic && formData.educationLevel
  const canProceedStep2 = formData.questionCount > 0
  const canProceedStep3 = (formData.groupSelection === 'existing' && formData.groupId) ||
    (formData.groupSelection === 'new' && formData.newGroupName)

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/tools/activity-maker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: formData.targetAudience,
          primaryLanguage: formData.primaryLanguage,
          mainTopic: formData.mainTopic,
          educationLevel: formData.educationLevel,
          subTopics: formData.subTopics,
          questionCount: formData.questionCount,
          groupSelection: formData.groupSelection,
          groupId: formData.groupSelection === 'existing' ? formData.groupId : undefined,
          newGroupName: formData.groupSelection === 'new' ? formData.newGroupName : undefined,
          groupPrivacy: formData.groupSelection === 'new' ? formData.groupPrivacy : undefined,
        }),
      })

      clearInterval(progressInterval)

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create activity')
      }

      setProgress(100)

      // Navigate to the created activity
      setTimeout(() => {
        router.push(`/activities/${result.data.activityId}`)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-6 px-4">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Activity Maker
          </h1>
          <p className="text-white/80 mt-1">Create inquiry-based learning activities with AI-generated questions</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          {isSubmitting ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <svg className="animate-spin h-12 w-12 text-[var(--stanford-cardinal)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Activity...</h3>
              <p className="text-gray-600 mb-4">AI is generating high-quality questions for your activity</p>
              <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[var(--stanford-cardinal)] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{progress}%</p>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <ActivityDetailsStep formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 2 && (
                <QuestionConfigStep formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 3 && (
                <GroupSelectionStep formData={formData} updateFormData={updateFormData} />
              )}
              {currentStep === 4 && (
                <ReviewStep formData={formData} onEdit={setCurrentStep} />
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 1 && !canProceedStep1) ||
                      (currentStep === 2 && !canProceedStep2) ||
                      (currentStep === 3 && !canProceedStep3)
                    }
                    className="px-6 py-2 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:bg-[var(--stanford-cardinal-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Create Activity with AI
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
