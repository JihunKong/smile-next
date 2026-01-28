interface PassingCriteriaInfoProps {
  passThreshold: number
  questionsRequired: number
  labels: {
    title: string
    description: string
    minScore: string
    questionsRequired: string
    tip: string
  }
}

export function PassingCriteriaInfo({
  passThreshold,
  questionsRequired,
  labels,
}: PassingCriteriaInfoProps) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-4 mb-6 border-l-4 border-green-500">
      <div className="flex items-start">
        <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {labels.title}
          </h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>{labels.description}</strong></p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>{labels.minScore}</strong> {passThreshold}/10 average per question</li>
              <li><strong>{labels.questionsRequired}</strong> {questionsRequired} questions must be generated</li>
            </ul>
            <p className="mt-3 text-sm text-gray-800 bg-yellow-50 px-3 py-2 rounded border-l-4 border-yellow-500">
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <strong>Tip:</strong> {labels.tip}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
