'use client'

interface CompletionPromptProps {
  questionsRequired: number
  isSubmitting: boolean
  onComplete: () => void
  labels: {
    title: string
    description: string
    processing: string
    button: string
  }
}

export function CompletionPrompt({
  questionsRequired,
  isSubmitting,
  onComplete,
  labels,
}: CompletionPromptProps) {
  return (
    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-800 font-medium mb-2">
          {labels.title}
        </p>
        <p className="text-sm text-green-600 mb-4">
          {labels.description.replace('{count}', String(questionsRequired))}
        </p>
        <button
          onClick={onComplete}
          disabled={isSubmitting}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2 mx-auto"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {labels.processing}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {labels.button}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
