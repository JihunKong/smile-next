'use client'

import Link from 'next/link'
import type { GroupInfo } from '../types'

interface AlreadyMemberProps {
  group: GroupInfo
}

/**
 * Already a member of group display
 */
export function AlreadyMember({ group }: AlreadyMemberProps) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Already a Member</h1>
        <p className="text-gray-600 mb-2">You are already a member of</p>
        <p className="text-lg font-semibold text-[#8C1515] mb-6">{group.name}</p>
        <Link
          href={`/groups/${group.id}`}
          className="block w-full py-3 px-4 text-center font-semibold text-white rounded-lg transition"
          style={{ backgroundColor: 'var(--stanford-cardinal)' }}
        >
          Go to Group
        </Link>
      </div>
    </div>
  )
}
