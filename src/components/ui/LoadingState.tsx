/**
 * LoadingState Component
 * 
 * A full loading state UI with spinner and optional message.
 * Use for page sections or full-page loading states.
 * 
 * @example
 * <LoadingState />                           // Default "Loading..."
 * <LoadingState message="Fetching data..." /> // Custom message
 * <LoadingState fullPage />                   // Full viewport height
 * <LoadingState size="lg" />                  // Larger spinner
 */

import { LoadingSpinner } from './LoadingSpinner'

interface LoadingStateProps {
  /** Message to display below spinner */
  message?: string
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to take full viewport height */
  fullPage?: boolean
}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  fullPage = false 
}: LoadingStateProps) {
  const wrapperClass = fullPage 
    ? 'min-h-screen flex items-center justify-center' 
    : 'py-12 flex items-center justify-center'

  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={size} className="text-[var(--stanford-cardinal)]" />
        {message && (
          <p className="text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  )
}
