'use client'

import { GroupRoles } from '@/types/groups'

interface MemberFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  roleFilter: number | 'all'
  onRoleFilterChange: (role: number | 'all') => void
}

export function MemberFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: MemberFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          >
            <option value="all">All Roles</option>
            <option value={GroupRoles.OWNER}>Owner</option>
            <option value={GroupRoles.CO_OWNER}>Co-Owner</option>
            <option value={GroupRoles.ADMIN}>Admin</option>
            <option value={GroupRoles.MEMBER}>Member</option>
          </select>
        </div>
      </div>
    </div>
  )
}
