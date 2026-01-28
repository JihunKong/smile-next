'use client'

import type { SettingsTabId } from '../../types'

interface SettingsNavProps {
  activeTab: SettingsTabId
  onTabChange: (tab: SettingsTabId) => void
}

interface TabConfig {
  id: SettingsTabId
  label: string
  icon: string
}

const TABS: TabConfig[] = [
  {
    id: 'account',
    label: 'Account',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    id: 'password',
    label: 'Password',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'display',
    label: 'Display',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
]

/**
 * Settings page sidebar navigation
 *
 * Displays tab navigation with icons.
 */
export function SettingsNav({ activeTab, onTabChange }: SettingsNavProps) {
  return (
    <nav className="bg-white rounded-lg shadow p-2 space-y-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'bg-[#8C1515] text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg
            className={`w-5 h-5 mr-3 ${
              activeTab === tab.id ? 'text-white' : 'text-gray-400'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={tab.icon}
            />
          </svg>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
