/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner with consistent sizing and styling.
 * Uses currentColor to inherit text color from parent.
 * 
 * @example
 * <LoadingSpinner />                    // Default medium size
 * <LoadingSpinner size="sm" />          // Small (for buttons)
 * <LoadingSpinner size="lg" />          // Large (for full page)
 * <LoadingSpinner className="text-blue-500" />  // Custom color
 */

interface LoadingSpinnerProps {
  /** Size variant: sm (16px), md (24px), lg (40px) */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <svg
      className={`animate-spin ${sizeMap[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
