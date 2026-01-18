/**
 * Button Component
 * 
 * A reusable button with consistent styling and loading states.
 * Supports multiple variants and sizes.
 * 
 * @example
 * <Button>Default Primary</Button>
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="danger">Delete</Button>
 * <Button variant="ghost">Cancel</Button>
 * <Button isLoading>Saving...</Button>
 * <Button size="sm">Small</Button>
 * <Button size="lg">Large</Button>
 */

import { forwardRef } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Shows loading spinner and disables button */
  isLoading?: boolean
}

const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary: 'bg-[var(--stanford-cardinal)] text-white hover:bg-[var(--stanford-cardinal-light)] focus:ring-[var(--stanford-cardinal)]',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    disabled,
    className = '',
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <LoadingSpinner size="sm" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
