'use client'

import type { ActivityFormData } from '../page'

interface QuestionConfigStepProps {
  formData: ActivityFormData
  updateFormData: (updates: Partial<ActivityFormData>) => void
}

export default function QuestionConfigStep({ formData, updateFormData }: QuestionConfigStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Question Configuration</h2>
        <p className="text-gray-600 text-sm">Choose how many AI-generated questions you want</p>
      </div>

      {/* Question Count Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Number of Questions
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* 5 Questions */}
          <button
            type="button"
            onClick={() => updateFormData({ questionCount: 5 })}
            className={`p-6 border-2 rounded-xl transition-all ${
              formData.questionCount === 5
                ? 'border-[var(--stanford-cardinal)] bg-[var(--stanford-cardinal)]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-4xl font-bold text-[var(--stanford-cardinal)] mb-2">5</div>
            <div className="font-medium text-gray-900">Questions</div>
            <div className="text-sm text-gray-500 mt-1">Quick activity</div>
            <div className="mt-3 text-xs text-gray-400">~10 min to complete</div>
          </button>

          {/* 10 Questions */}
          <button
            type="button"
            onClick={() => updateFormData({ questionCount: 10 })}
            className={`p-6 border-2 rounded-xl transition-all ${
              formData.questionCount === 10
                ? 'border-[var(--stanford-cardinal)] bg-[var(--stanford-cardinal)]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-4xl font-bold text-[var(--stanford-cardinal)] mb-2">10</div>
            <div className="font-medium text-gray-900">Questions</div>
            <div className="text-sm text-gray-500 mt-1">Full activity</div>
            <div className="mt-3 text-xs text-gray-400">~20 min to complete</div>
          </button>
        </div>
      </div>

      {/* AI Quality Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-800">AI-Powered Quality</h4>
            <p className="text-sm text-blue-700 mt-1">
              Questions are generated targeting <strong>Bloom&apos;s Level 5</strong> (Evaluate/Create)
              with a guaranteed quality score of <strong>8.0+</strong> out of 10.
            </p>
          </div>
        </div>
      </div>

      {/* Question Types Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Question Types Generated</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {[
            'Critical Analysis',
            'Creative Thinking',
            'Problem Solving',
            'Comparative Analysis',
            'Ethical Evaluation',
            'Future Prediction',
          ].map((type) => (
            <div key={type} className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
