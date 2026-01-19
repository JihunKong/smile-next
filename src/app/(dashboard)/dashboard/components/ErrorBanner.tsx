/**
 * ErrorBanner Component
 *
 * Displays a warning banner when statistics fail to load.
 * Extracted from dashboard/page.tsx as part of VIBE-0003C refactoring.
 */

interface ErrorBannerProps {
  error?: string
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  if (!error) return null

  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Some statistics could not be loaded
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            There was an issue loading your statistics. Some data may be incomplete.
            Try refreshing the page.
          </p>
          <div className="mt-2">
            <a
              href="/dashboard"
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              <i className="fas fa-redo mr-1"></i>
              Refresh Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
