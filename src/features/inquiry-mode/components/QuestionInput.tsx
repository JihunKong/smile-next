'use client'

interface QuestionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  labels: {
    title: string
    description: string
    placeholder: string
    charCount: string
    canSubmit: string
    submitting: string
    submit: string
  }
}

export function QuestionInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  labels,
}: QuestionInputProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        {labels.title}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {labels.description}
      </p>

      <textarea
        name="question"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={labels.placeholder}
        rows={4}
        maxLength={500}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition resize-none"
      />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {labels.charCount.replace('{count}', String(value.length))}
          </span>
          {value.length > 20 && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {labels.canSubmit}
            </span>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isSubmitting}
          className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {labels.submitting}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {labels.submit}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
