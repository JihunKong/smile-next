'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleResendVerification = async () => {
    if (cooldown > 0 || !email) return

    setIsResending(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Verification email has been resent. Please check your inbox.',
        })
        // Start 60-second cooldown
        setCooldown(60)
        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to resend verification email.',
        })
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.',
      })
    } finally {
      setIsResending(false)
    }
  }

  const steps = [
    { number: 1, text: 'Check your email inbox' },
    { number: 2, text: 'Open the email from SMILE Platform' },
    { number: 3, text: 'Click the verification link' },
    { number: 4, text: 'Start using SMILE!' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full p-4" style={{ backgroundColor: 'rgba(140, 21, 21, 0.1)' }}>
              <svg
                className="h-12 w-12 text-[#8C1515]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-[#2E2D29]">Check Your Email</h2>
          <p className="mt-2 text-gray-600">
            We&apos;ve sent a verification email to:
          </p>
          {email && (
            <p className="mt-1 text-lg font-semibold text-[#8C1515]">{email}</p>
          )}
        </div>

        {message && (
          <div
            className={`rounded-md p-4 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[#2E2D29] mb-4">
            Verification Steps
          </h3>
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#8C1515] text-white flex items-center justify-center text-sm font-medium">
                  {step.number}
                </div>
                <span className="ml-3 text-gray-700">{step.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex">
            <svg
              className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Can&apos;t find the email?</strong> Check your spam or junk folder.
                The email may take a few minutes to arrive.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={isResending || cooldown > 0 || !email}
            className="inline-flex items-center justify-center px-6 py-3 border border-[#8C1515] rounded-md text-base font-medium text-[#8C1515] hover:bg-[#8C1515] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending
              ? 'Sending...'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend Verification Email'}
          </button>

          <div>
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-[#8C1515]"
            >
              Already verified?{' '}
              <span className="font-medium text-[#8C1515]">Sign in</span>
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Need help?{' '}
            <Link href="/contact" className="text-[#8C1515] hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8C1515]"></div>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  )
}
