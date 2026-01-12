'use client'

import type { ActivityFormData } from '../page'

interface ReviewStepProps {
  formData: ActivityFormData
  onEdit: (step: number) => void
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Mandarin Chinese',
  yue: 'Cantonese',
  ko: 'Korean',
  ja: 'Japanese',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ar: 'Arabic',
  hi: 'Hindi',
  sw: 'Swahili',
  ur: 'Urdu',
  th: 'Thai',
  ru: 'Russian',
  kk: 'Kazakh',
  ms: 'Malay',
  id: 'Indonesian',
  vi: 'Vietnamese',
  it: 'Italian',
  fi: 'Finnish',
  sv: 'Swedish',
}

const EDUCATION_LEVEL_NAMES: Record<string, string> = {
  elementary: 'Elementary School',
  middle: 'Middle School',
  high: 'High School',
  college: 'College/University',
  graduate: 'Graduate School',
}

export default function ReviewStep({ formData, onEdit }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & Create</h2>
        <p className="text-gray-600 text-sm">Review your activity settings before creating</p>
      </div>

      {/* Activity Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Activity Details</h3>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-sm text-[var(--stanford-cardinal)] hover:underline"
          >
            Edit
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Main Topic</dt>
            <dd className="font-medium text-gray-900">{formData.mainTopic || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Target Audience</dt>
            <dd className="font-medium text-gray-900">{formData.targetAudience || '-'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Education Level</dt>
            <dd className="font-medium text-gray-900">
              {formData.educationLevel ? EDUCATION_LEVEL_NAMES[formData.educationLevel] : '-'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Language</dt>
            <dd className="font-medium text-gray-900">
              {LANGUAGE_NAMES[formData.primaryLanguage] || formData.primaryLanguage}
            </dd>
          </div>
          {formData.subTopics && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Sub-topics</dt>
              <dd className="font-medium text-gray-900 text-right max-w-xs truncate">
                {formData.subTopics}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Question Configuration */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Questions</h3>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="text-sm text-[var(--stanford-cardinal)] hover:underline"
          >
            Edit
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Number of Questions</dt>
            <dd className="font-medium text-gray-900">{formData.questionCount} questions</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Target Quality</dt>
            <dd className="font-medium text-green-600">8.0+ / 10</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Bloom&apos;s Level</dt>
            <dd className="font-medium text-purple-600">Level 5 (Evaluate/Create)</dd>
          </div>
        </dl>
      </div>

      {/* Group Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Group</h3>
          <button
            type="button"
            onClick={() => onEdit(3)}
            className="text-sm text-[var(--stanford-cardinal)] hover:underline"
          >
            Edit
          </button>
        </div>
        <dl className="space-y-2 text-sm">
          {formData.groupSelection === 'existing' ? (
            <div className="flex justify-between">
              <dt className="text-gray-500">Selected Group</dt>
              <dd className="font-medium text-gray-900">
                {formData.groupId ? 'Existing Group' : 'Not selected'}
              </dd>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <dt className="text-gray-500">New Group Name</dt>
                <dd className="font-medium text-gray-900">{formData.newGroupName || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Privacy</dt>
                <dd className="font-medium text-gray-900 capitalize">{formData.groupPrivacy}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {/* AI Generation Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-green-800">Ready to Create</h4>
            <p className="text-sm text-green-700 mt-1">
              Click &quot;Create Activity with AI&quot; to generate {formData.questionCount} high-quality,
              inquiry-based questions about &quot;{formData.mainTopic}&quot;.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
