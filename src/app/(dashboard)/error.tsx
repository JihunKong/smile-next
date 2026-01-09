'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 text-center mb-4">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>

        {/* Error Details (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6 overflow-x-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {error.stack}
            </pre>
          </div>
        )}

        {/* Error Digest */}
        {error.digest && (
          <p className="text-xs text-gray-400 text-center mb-6">
            Error ID: {error.digest}
          </p>
        )}

        {/* Suggestions */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">You can try:</h2>
          <ul className="space-y-2">
            <li className="flex items-start text-sm text-gray-600">
              <i className="fas fa-redo text-gray-400 mr-2 mt-0.5"></i>
              Refreshing the page
            </li>
            <li className="flex items-start text-sm text-gray-600">
              <i className="fas fa-sign-in-alt text-gray-400 mr-2 mt-0.5"></i>
              Logging in again
            </li>
            <li className="flex items-start text-sm text-gray-600">
              <i className="fas fa-clock text-gray-400 mr-2 mt-0.5"></i>
              Trying again later
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
          >
            <i className="fas fa-redo mr-2"></i>
            Try again
          </button>

          <Link
            href="/auth/login"
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg text-center transition-colors"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Log in again
          </Link>
        </div>

        {/* Dashboard Link */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            <i className="fas fa-home mr-1"></i>
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
