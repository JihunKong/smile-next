'use client'

import type { FormMessage } from '../../types'

type Theme = 'light' | 'dark' | 'auto'
type Language = 'en' | 'es' | 'fr' | 'de'
type ItemsPerPage = 10 | 25 | 50 | 100

interface DisplaySettings {
  theme: Theme
  language: Language
  itemsPerPage: ItemsPerPage
}

interface DisplaySectionProps {
  settings: DisplaySettings
  isLoading: boolean
  message: FormMessage | null
  onThemeChange: (theme: Theme) => void
  onLanguageChange: (language: Language) => void
  onItemsPerPageChange: (count: ItemsPerPage) => void
  onSave: () => Promise<void>
}

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
]

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
  { value: 'fr', label: 'Francais' },
  { value: 'de', label: 'Deutsch' },
]

const ITEMS_PER_PAGE_OPTIONS: ItemsPerPage[] = [10, 25, 50, 100]

/**
 * Display settings section for settings page
 *
 * Theme selection, language, and items per page configuration.
 */
export function DisplaySection({
  settings,
  isLoading,
  message,
  onThemeChange,
  onLanguageChange,
  onItemsPerPageChange,
  onSave,
}: DisplaySectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#2E2D29] mb-6">
        Display Settings
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

      <div className="space-y-6">
        {/* Color Theme */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color Theme
          </label>
          <div className="flex flex-wrap gap-3">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onThemeChange(option.value)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  settings.theme === option.value
                    ? 'bg-[#8C1515] text-white border-[#8C1515]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#8C1515]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {settings.theme === 'auto'
              ? 'Theme will match your system preferences'
              : `Using ${settings.theme} theme`}
          </p>
        </div>

        {/* Language */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="w-full md:w-64 px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent bg-white"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Select your preferred language for the interface
          </p>
        </div>

        {/* Items Per Page */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Items Per Page
          </label>
          <div className="flex flex-wrap gap-3">
            {ITEMS_PER_PAGE_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onItemsPerPageChange(count)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  settings.itemsPerPage === count
                    ? 'bg-[#8C1515] text-white border-[#8C1515]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#8C1515]'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Number of items to show in lists and tables
          </p>
        </div>
      </div>

      <button
        className="mt-6 px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
        disabled={isLoading}
        onClick={onSave}
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
