'use client'

interface SaveToastProps {
  show: boolean
}

/**
 * Toast notification showing auto-save confirmation.
 * Appears briefly in bottom-right corner when responses are saved.
 */
export function SaveToast({ show }: SaveToastProps) {
  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      자동 저장됨
    </div>
  )
}
