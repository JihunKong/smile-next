'use client'

import type { ActivityFormData } from '../page'

interface ActivityDetailsStepProps {
  formData: ActivityFormData
  updateFormData: (updates: Partial<ActivityFormData>) => void
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Mandarin Chinese' },
  { code: 'yue', name: 'Cantonese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ja', name: 'Japanese' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ur', name: 'Urdu' },
  { code: 'th', name: 'Thai' },
  { code: 'ru', name: 'Russian' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'ms', name: 'Malay' },
  { code: 'id', name: 'Indonesian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'it', name: 'Italian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'sv', name: 'Swedish' },
]

const EDUCATION_LEVELS = [
  { value: 'elementary', label: 'Elementary School', description: 'Ages 6-11' },
  { value: 'middle', label: 'Middle School', description: 'Ages 11-14' },
  { value: 'high', label: 'High School', description: 'Ages 14-18' },
  { value: 'college', label: 'College/University', description: 'Undergraduate' },
  { value: 'graduate', label: 'Graduate School', description: 'Masters/PhD' },
]

export default function ActivityDetailsStep({ formData, updateFormData }: ActivityDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Activity Details</h2>
        <p className="text-gray-600 text-sm">Define the topic and target audience for your activity</p>
      </div>

      {/* Main Topic */}
      <div>
        <label htmlFor="mainTopic" className="block text-sm font-medium text-gray-700 mb-1">
          Main Topic <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="mainTopic"
          value={formData.mainTopic}
          onChange={(e) => updateFormData({ mainTopic: e.target.value })}
          placeholder="e.g., Climate Change, World War II, Algebra..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">The main subject of your inquiry-based activity</p>
      </div>

      {/* Target Audience */}
      <div>
        <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
          Target Audience <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="targetAudience"
          value={formData.targetAudience}
          onChange={(e) => updateFormData({ targetAudience: e.target.value })}
          placeholder="e.g., 8th grade science students, college freshmen..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Describe who will be participating in this activity</p>
      </div>

      {/* Education Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Education Level <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {EDUCATION_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => updateFormData({ educationLevel: level.value as ActivityFormData['educationLevel'] })}
              className={`p-3 border rounded-lg text-center transition-colors ${
                formData.educationLevel === level.value
                  ? 'border-[var(--stanford-cardinal)] bg-[var(--stanford-cardinal)]/5 text-[var(--stanford-cardinal)]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{level.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <label htmlFor="primaryLanguage" className="block text-sm font-medium text-gray-700 mb-1">
          Primary Language
        </label>
        <select
          id="primaryLanguage"
          value={formData.primaryLanguage}
          onChange={(e) => updateFormData({ primaryLanguage: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">AI will generate questions in this language</p>
      </div>

      {/* Sub-topics */}
      <div>
        <label htmlFor="subTopics" className="block text-sm font-medium text-gray-700 mb-1">
          Sub-topics (Optional)
        </label>
        <input
          type="text"
          id="subTopics"
          value={formData.subTopics}
          onChange={(e) => updateFormData({ subTopics: e.target.value })}
          placeholder="e.g., greenhouse gases, sea level rise, renewable energy"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Comma-separated list of specific areas to focus on</p>
      </div>
    </div>
  )
}
