'use client'

import { useState } from 'react'
import type { PasswordFormData, FormMessage } from '../../types'

interface PasswordSectionProps {
  isLoading: boolean
  message: FormMessage | null
  onSubmit: (data: PasswordFormData) => Promise<void>
}

/**
 * Password change section for settings page
 *
 * Provides form for changing user password with validation.
 */
export function PasswordSection({
  isLoading,
  message,
  onSubmit,
}: PasswordSectionProps) {
  const [form, setForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    // Validation
    if (form.newPassword !== form.confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (form.newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    await onSubmit(form)

    // Clear form on success (message check happens via prop)
    setForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const displayMessage = localError
    ? { type: 'error' as const, text: localError }
    : message

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">
        Change Password
      </h2>

      {displayMessage && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            displayMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {displayMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) =>
              setForm({ ...form, currentPassword: e.target.value })
            }
            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}
