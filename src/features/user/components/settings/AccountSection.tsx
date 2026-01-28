'use client'

import type { AccountFormData, FormMessage } from '../../types'

interface AccountSectionProps {
  form: AccountFormData
  email: string
  isLoading: boolean
  message: FormMessage | null
  onFormChange: (field: keyof AccountFormData, value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

/**
 * Account information section for settings page
 *
 * Displays and allows editing of basic profile information:
 * first name, last name, and username.
 */
export function AccountSection({
  form,
  email,
  isLoading,
  message,
  onFormChange,
  onSubmit,
}: AccountSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">
        Account Information
      </h2>

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

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => onFormChange('firstName', e.target.value)}
              className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => onFormChange('lastName', e.target.value)}
              className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => onFormChange('username', e.target.value)}
            className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-lg"
          />
          <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
