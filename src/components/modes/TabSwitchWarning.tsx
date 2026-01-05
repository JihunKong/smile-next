'use client'

import React from 'react'

interface TabSwitchWarningProps {
  isVisible: boolean
  onDismiss: () => void
  tabSwitchCount: number
  maxWarnings?: number
}

export function TabSwitchWarning({
  isVisible,
  onDismiss,
  tabSwitchCount,
  maxWarnings = 3,
}: TabSwitchWarningProps) {
  if (!isVisible) return null

  const isLastWarning = tabSwitchCount >= maxWarnings - 1
  const isFinalWarning = tabSwitchCount >= maxWarnings

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div
          className={`p-4 ${
            isFinalWarning
              ? 'bg-red-600'
              : isLastWarning
                ? 'bg-orange-500'
                : 'bg-yellow-500'
          }`}
        >
          <div className="flex items-center gap-3 text-white">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-bold text-lg">
                {isFinalWarning ? 'Final Warning!' : 'Tab Switch Detected'}
              </h3>
              <p className="text-sm opacity-90">
                Warning {tabSwitchCount} of {maxWarnings}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {isFinalWarning ? (
              <>
                You have switched tabs <strong>{tabSwitchCount} times</strong>. Your instructor will
                be notified of this activity. Further violations may result in automatic submission.
              </>
            ) : isLastWarning ? (
              <>
                This is your <strong>last warning</strong>. Switching tabs again will be flagged and
                reported to your instructor.
              </>
            ) : (
              <>
                You have switched away from this page. During an assessment, leaving the page is
                monitored and may affect your results.
              </>
            )}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Activity Tracking:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Tab switches are logged with timestamps
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Copy/paste attempts are recorded
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Your instructor can review this data
              </li>
            </ul>
          </div>

          <button
            onClick={onDismiss}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              isFinalWarning
                ? 'bg-red-600 hover:bg-red-700'
                : isLastWarning
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default TabSwitchWarning
