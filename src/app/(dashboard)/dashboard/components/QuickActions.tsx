/**
 * QuickActions Component
 *
 * Displays 4 navigation cards for common dashboard actions.
 * Extracted from dashboard/page.tsx as part of VIBE-0003C refactoring.
 */

import Link from 'next/link'

const ACTIONS = [
  {
    href: '/groups/create',
    icon: 'fa-plus-circle',
    colorClasses: {
      icon: 'text-blue-600',
      hover: 'hover:border-blue-400 hover:bg-blue-50',
    },
    title: 'Create Group',
    subtitle: 'Start a new learning group',
  },
  {
    href: '/groups',
    icon: 'fa-users',
    colorClasses: {
      icon: 'text-green-600',
      hover: 'hover:border-green-400 hover:bg-green-50',
    },
    title: 'My Groups',
    subtitle: 'Manage your groups',
  },
  {
    href: '/activities',
    icon: 'fa-clipboard-list',
    colorClasses: {
      icon: 'text-purple-600',
      hover: 'hover:border-purple-400 hover:bg-purple-50',
    },
    title: 'Activities',
    subtitle: 'Create & manage activities',
  },
  {
    href: '/profile',
    icon: 'fa-user-cog',
    colorClasses: {
      icon: 'text-yellow-600',
      hover: 'hover:border-yellow-400 hover:bg-yellow-50',
    },
    title: 'Profile',
    subtitle: 'Update your settings',
  },
]

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg ${action.colorClasses.hover} transition-colors`}
          >
            <i className={`fas ${action.icon} text-2xl ${action.colorClasses.icon} mr-3`}></i>
            <div>
              <div className="font-medium text-gray-900">{action.title}</div>
              <div className="text-sm text-gray-500">{action.subtitle}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
