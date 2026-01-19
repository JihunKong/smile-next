'use client'

interface CaseTimerProps {
  timeRemaining: number
  formatTime: (seconds: number) => string
  variant?: 'header' | 'inline'
}

/**
 * Timer display component for case mode.
 * Shows remaining time with visual warning when time is low.
 */
export function CaseTimer({ timeRemaining, formatTime, variant = 'header' }: CaseTimerProps) {
  const isLow = timeRemaining <= 60

  if (variant === 'inline') {
    return (
      <div className="text-sm font-medium text-gray-700">
        <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Time:{' '}
        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-indigo-600'}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      isLow ? 'bg-red-100' : 'bg-indigo-100'
    }`}>
      <svg className={`w-4 h-4 ${isLow ? 'text-red-600' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`font-bold ${isLow ? 'text-red-600' : 'text-indigo-700'}`}>
        {formatTime(timeRemaining)}
      </span>
    </div>
  )
}
