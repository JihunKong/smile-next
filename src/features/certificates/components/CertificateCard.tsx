/**
 * CertificateCard Component
 *
 * Displays a certificate in a card format with logo, info, and action buttons.
 * Supports enrolled/not-enrolled states and compact mode.
 */

'use client'

import Link from 'next/link'
import type { Certificate } from '../types'

export interface CertificateCardProps {
  /** Certificate data to display */
  certificate: Certificate
  /** Called when user clicks Enroll button */
  onEnroll?: (certificateId: string) => void
  /** Whether enrollment is in progress */
  isEnrolling?: boolean
  /** Compact display mode (smaller, less info) */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Certificate icon SVG for placeholder
 */
function CertificateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  )
}

/**
 * Loading spinner for enrollment
 */
function LoadingSpinner() {
  return (
    <svg
      className="w-4 h-4 mr-1.5 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
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

export function CertificateCard({
  certificate,
  onEnroll,
  isEnrolling = false,
  compact = false,
  className = '',
}: CertificateCardProps) {
  const handleEnroll = () => {
    onEnroll?.(certificate.id)
  }

  const baseClasses = compact
    ? 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group compact'
    : 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group'

  const headerHeight = compact ? 'h-24' : 'h-36'
  const logoMaxHeight = compact ? 'max-h-14' : 'max-h-20'

  return (
    <div className={`${baseClasses} ${className}`}>
      {/* Certificate Header/Logo */}
      <div
        className={`${headerHeight} bg-gradient-to-br from-[#8C1515] to-[#B83A4B] flex items-center justify-center relative`}
      >
        {certificate.logoImageUrl ? (
          <img
            src={certificate.logoImageUrl}
            alt={certificate.name}
            className={`${logoMaxHeight} max-w-[80%] object-contain`}
          />
        ) : (
          <CertificateIcon className="w-16 h-16 text-white opacity-50" />
        )}

        {/* Enrolled Badge */}
        {certificate.isEnrolled && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Enrolled
            </span>
          </div>
        )}
      </div>

      {/* Certificate Info */}
      <div className={compact ? 'p-3' : 'p-5'}>
        <h3
          className={`font-semibold text-[#2E2D29] mb-1 group-hover:text-[#8C1515] transition-colors line-clamp-2 ${
            compact ? 'text-base' : 'text-lg'
          }`}
        >
          {certificate.name}
        </h3>

        {certificate.organizationName && (
          <p className="text-sm text-gray-500 mb-3 truncate">
            {certificate.organizationName}
          </p>
        )}

        {/* Stats */}
        <div
          className={`flex items-center text-sm text-gray-600 mb-4 ${
            compact ? 'justify-start gap-4' : 'justify-between'
          }`}
        >
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {certificate._count.activities} activities
          </span>

          {!compact && (
            <span className="flex items-center text-[#8C1515]">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              {certificate._count.studentCertificates} enrolled
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {certificate.isEnrolled ? (
            <Link
              href={`/certificates/${certificate.id}`}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#8C1515] text-white text-sm font-medium rounded-lg hover:bg-[#6D1010] transition"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Progress
            </Link>
          ) : (
            <>
              <Link
                href={`/certificates/${certificate.id}`}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                View Details
              </Link>
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#8C1515] text-white text-sm font-medium rounded-lg hover:bg-[#6D1010] disabled:opacity-50 transition"
              >
                {isEnrolling ? (
                  <>
                    <LoadingSpinner />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-1.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Enroll
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
