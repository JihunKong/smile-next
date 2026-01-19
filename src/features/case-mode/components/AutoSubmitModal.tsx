'use client'

interface AutoSubmitModalProps {
  onContinue: () => void
}

/**
 * Modal displayed when per-case time expires.
 * Notifies user and triggers auto-save before continuing.
 */
export function AutoSubmitModal({ onContinue }: AutoSubmitModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md text-center">
        <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Time Expired!</h3>
        <p className="text-gray-600 mb-4">
          The time limit for this case has been reached. Your current responses will be auto-saved.
        </p>
        <button
          onClick={onContinue}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg"
          style={{ backgroundColor: '#4f46e5' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
