'use client'

import type { FormMessage } from '../../types'

interface DangerZoneSectionProps {
  isLoading: boolean
  message: FormMessage | null
  onDeleteAccount: () => Promise<void>
}

/**
 * Danger zone section for settings page
 *
 * Contains destructive actions like account deletion.
 */
export function DangerZoneSection({
  isLoading,
  message,
  onDeleteAccount,
}: DangerZoneSectionProps) {
  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return
    }

    await onDeleteAccount()
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-red-600 mb-6">Danger Zone</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
        <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
        <p className="text-sm text-red-700 mb-4">
          Once you delete your account, there is no going back. Please be
          certain. All your data, including groups, activities, and questions
          will be permanently deleted.
        </p>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? 'Deleting...' : 'Delete My Account'}
        </button>
      </div>
    </div>
  )
}
