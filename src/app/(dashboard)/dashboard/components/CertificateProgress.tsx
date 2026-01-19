/**
 * CertificateProgress Component
 *
 * Displays enrolled certificates with progress tracking, activity lists,
 * and status indicators. Only renders when user has enrolled certificates.
 *
 * Extracted from dashboard/page.tsx as part of VIBE-0003G refactoring.
 */

import Link from 'next/link'
import type { ProcessedCertificate, CertificateActivity, CertificateActivityStatus } from '../types'

// ============================================================================
// Main Component
// ============================================================================

interface CertificateProgressProps {
  certificates: ProcessedCertificate[]
}

export function CertificateProgress({ certificates }: CertificateProgressProps) {
  if (!certificates || certificates.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <Header />

      <div className="space-y-6">
        {certificates.map((cert) => (
          <CertificateCard key={cert.id} certificate={cert} />
        ))}
      </div>

      <EncouragingMessage />
    </div>
  )
}

// ============================================================================
// Header Section
// ============================================================================

function Header() {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center">
        <i className="fas fa-certificate text-purple-500 mr-2"></i>
        My Certificates
      </h2>
      <Link
        href="/my-certificates"
        className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center"
      >
        View All
        <i className="fas fa-arrow-right ml-1"></i>
      </Link>
    </div>
  )
}

// ============================================================================
// Certificate Card
// ============================================================================

function CertificateCard({ certificate }: { certificate: ProcessedCertificate }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
      <CertificateHeader certificate={certificate} />
      <ProgressBar percentage={certificate.progress_percentage} />
      {certificate.activities && certificate.activities.length > 0 && (
        <ActivityList activities={certificate.activities} />
      )}
      <ViewDetailsLink certificateId={certificate.id} />
    </div>
  )
}

// ============================================================================
// Certificate Header
// ============================================================================

function CertificateHeader({ certificate }: { certificate: ProcessedCertificate }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <CertificateIcon status={certificate.status} />
        <div>
          <Link
            href={`/my-certificates/${certificate.id}/progress`}
            className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors"
          >
            {certificate.name}
          </Link>
          <EnrollmentInfo certificate={certificate} />
        </div>
      </div>
      <StatusBadge status={certificate.status} />
    </div>
  )
}

function CertificateIcon({ status }: { status: ProcessedCertificate['status'] }) {
  if (status === 'completed') {
    return (
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <i className="fas fa-check-circle text-green-600 text-2xl"></i>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0">
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
        <i className="fas fa-certificate text-purple-600 text-2xl"></i>
      </div>
    </div>
  )
}

function EnrollmentInfo({ certificate }: { certificate: ProcessedCertificate }) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      <span>Enrolled {formatDate(certificate.enrollment_date)}</span>
      {certificate.status === 'completed' && certificate.completion_date && (
        <>
          <span>•</span>
          <span className="text-green-600 font-medium">
            Completed {formatDate(certificate.completion_date)}
          </span>
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ProcessedCertificate['status'] }) {
  if (status === 'completed') {
    return (
      <div className="text-right">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <i className="fas fa-check mr-1"></i>Completed
        </span>
      </div>
    )
  }

  return (
    <div className="text-right">
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        <i className="fas fa-spinner mr-1"></i>In Progress
      </span>
    </div>
  )
}

// ============================================================================
// Progress Bar
// ============================================================================

function ProgressBar({ percentage }: { percentage: number }) {
  const roundedPercentage = Math.round(percentage)
  const remaining = Math.round(100 - percentage)

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span className="font-medium">Overall Progress</span>
        <span className="font-semibold">{roundedPercentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            percentage === 100
              ? 'bg-gradient-to-r from-green-400 to-green-600'
              : 'bg-gradient-to-r from-purple-400 to-purple-600'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <ProgressMessage percentage={percentage} remaining={remaining} />
    </div>
  )
}

function ProgressMessage({ percentage, remaining }: { percentage: number; remaining: number }) {
  if (percentage < 100) {
    return (
      <p className="text-xs text-gray-500 mt-2">
        <i className="fas fa-lightbulb text-yellow-500"></i>
        {' '}Keep going! You&apos;re {remaining}% away from completion.
      </p>
    )
  }

  return (
    <p className="text-xs text-green-600 mt-2">
      <i className="fas fa-trophy text-yellow-500"></i>
      {' '}Congratulations! You&apos;ve completed all required activities.
    </p>
  )
}

// ============================================================================
// Activity List
// ============================================================================

function ActivityList({ activities }: { activities: CertificateActivity[] }) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Activities ({activities.length})
      </h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {activities.map((activity) => (
          <ActivityItem key={activity.activity_id} activity={activity} />
        ))}
      </div>
    </div>
  )
}

function ActivityItem({ activity }: { activity: CertificateActivity }) {
  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <StatusIcon status={activity.status} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.activity_name}
          </p>
          <RequiredLabel required={activity.required} />
        </div>
        <ActivityAction activity={activity} />
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: CertificateActivityStatus }) {
  const iconConfig = {
    passed: { className: 'fas fa-check-circle text-green-500', title: 'Passed' },
    failed: { className: 'fas fa-times-circle text-red-500', title: 'Failed' },
    in_progress: { className: 'fas fa-circle-notch text-blue-500', title: 'In Progress' },
    not_started: { className: 'far fa-circle text-gray-400', title: 'Not Started' },
  }

  const config = iconConfig[status]

  return (
    <div className="flex-shrink-0">
      <i className={config.className} title={config.title}></i>
    </div>
  )
}

function RequiredLabel({ required }: { required: boolean }) {
  if (required) {
    return <span className="text-xs text-red-600">Required</span>
  }
  return <span className="text-xs text-gray-500">Optional</span>
}

function ActivityAction({ activity }: { activity: CertificateActivity }) {
  return (
    <div className="flex-shrink-0 text-right">
      {activity.status === 'passed' ? (
        <span className="text-xs text-green-600">✓ Passed</span>
      ) : activity.status === 'failed' ? (
        <span className="text-xs text-red-600">Try Again</span>
      ) : activity.status === 'in_progress' ? (
        <span className="text-xs text-blue-600">Continue</span>
      ) : (
        <Link
          href={`/activities/${activity.activity_id}`}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
        >
          Start →
        </Link>
      )}
    </div>
  )
}

// ============================================================================
// View Details Link
// ============================================================================

function ViewDetailsLink({ certificateId }: { certificateId: string }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <Link
        href={`/my-certificates/${certificateId}/progress`}
        className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm font-medium"
      >
        <i className="fas fa-chart-line mr-2"></i>
        View Detailed Progress
      </Link>
    </div>
  )
}

// ============================================================================
// Encouraging Message Footer
// ============================================================================

function EncouragingMessage() {
  return (
    <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
      <div className="flex items-start space-x-3">
        <i className="fas fa-graduation-cap text-purple-600 text-xl mt-1"></i>
        <div>
          <p className="text-sm font-medium text-gray-900">Keep Learning!</p>
          <p className="text-sm text-gray-600 mt-1">
            Complete certificate activities to unlock achievements and demonstrate your expertise.
          </p>
        </div>
      </div>
    </div>
  )
}
