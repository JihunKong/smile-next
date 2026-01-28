'use client'

import Link from 'next/link'

interface InvalidInviteProps {
  error?: string | null
}

/**
 * Invalid or expired invite display
 */
export function InvalidInvite({ error }: InvalidInviteProps) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
        <p className="text-gray-600 mb-6">
          {error || 'This invite link is invalid or has expired.'}
        </p>
        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block w-full py-3 px-4 text-center font-semibold text-white rounded-lg transition"
            style={{ backgroundColor: 'var(--stanford-cardinal)' }}
          >
            Create an Account
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-3 px-4 text-center font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
