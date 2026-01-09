'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Unknown'
  const message = searchParams.get('message') || 'An authentication error occurred.'

  const getErrorDetails = () => {
    switch (error) {
      case 'DatabaseError':
        return {
          title: 'Database Connection Error',
          icon: 'fa-database',
          color: 'red',
          suggestions: [
            'The database server may be temporarily unavailable',
            'Please try again in a few moments',
            'If the problem persists, contact support',
          ],
        }
      case 'InvalidSession':
        return {
          title: 'Invalid Session',
          icon: 'fa-user-slash',
          color: 'yellow',
          suggestions: [
            'Your session may have expired',
            'There was a problem during login',
            'Browser cookies may have been cleared',
          ],
        }
      case 'CredentialsSignin':
        return {
          title: 'Login Failed',
          icon: 'fa-lock',
          color: 'red',
          suggestions: [
            'Invalid email or password',
            'Check your credentials and try again',
          ],
        }
      default:
        return {
          title: 'Authentication Error',
          icon: 'fa-exclamation-triangle',
          color: 'red',
          suggestions: [
            'An unexpected error occurred',
            'Please try logging in again',
          ],
        }
    }
  }

  const errorDetails = getErrorDetails()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Error Icon */}
        <div className={`mx-auto w-16 h-16 bg-${errorDetails.color}-100 rounded-full flex items-center justify-center mb-6`}>
          <i className={`fas ${errorDetails.icon} text-${errorDetails.color}-600 text-2xl`}></i>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {errorDetails.title}
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 text-center mb-6">
          {decodeURIComponent(message)}
        </p>

        {/* Suggestions */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">This can happen if:</h2>
          <ul className="space-y-2">
            {errorDetails.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <i className="fas fa-info-circle text-gray-400 mr-2 mt-0.5"></i>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Log in again
          </Link>

          <Link
            href="/"
            className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg text-center transition-colors"
          >
            <i className="fas fa-home mr-2"></i>
            Go to Home
          </Link>
        </div>

        {/* Error Code */}
        {error && (
          <p className="text-xs text-gray-400 text-center mt-6">
            Error Code: {error}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
