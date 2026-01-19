/**
 * ErrorState Component
 * 
 * A user-friendly error display with optional retry and go back actions.
 * Use for displaying errors in a consistent, actionable way.
 * 
 * @example
 * <ErrorState message="Failed to load data" />
 * <ErrorState 
 *   title="Connection Failed" 
 *   message="Please check your internet connection"
 *   onRetry={() => refetch()}
 * />
 * <ErrorState 
 *   message="Page not found"
 *   onGoBack={() => router.back()}
 * />
 */

import { Button } from './Button'

interface ErrorStateProps {
  /** Error title */
  title?: string
  /** Error message */
  message: string
  /** Callback for retry action */
  onRetry?: () => void
  /** Callback for go back action */
  onGoBack?: () => void
}

export function ErrorState({
  title = 'Oops!',
  message,
  onRetry,
  onGoBack,
}: ErrorStateProps) {
  return (
    <div className="py-12 flex items-center justify-center">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
          <svg 
            className="w-8 h-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Action Buttons */}
        {(onRetry || onGoBack) && (
          <div className="flex items-center justify-center gap-3">
            {onRetry && (
              <Button variant="primary" onClick={onRetry}>
                Try Again
              </Button>
            )}
            {onGoBack && (
              <Button variant="ghost" onClick={onGoBack}>
                Go Back
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
