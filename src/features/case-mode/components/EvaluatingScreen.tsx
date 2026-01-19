'use client'

interface EvaluatingScreenProps {
  progress: number
  message: string
}

/**
 * Full-screen overlay showing AI evaluation progress.
 * Displays animated spinner, progress bar, and status message.
 */
export function EvaluatingScreen({ progress, message }: EvaluatingScreenProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluating Your Responses</h2>
      <p className="text-gray-600 mb-4">{message}</p>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-indigo-600">{Math.floor(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          AI evaluation in progress
        </p>
      </div>
    </div>
  )
}
