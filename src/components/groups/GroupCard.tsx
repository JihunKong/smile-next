'use client'

import Link from 'next/link'
import { formatMemberCount, getGradientColors, getGroupInitials, getRoleLabel } from '@/lib/groups/utils'
import { GroupRoles, type GroupRole } from '@/types/groups'

interface GroupCardProps {
  group: {
    id: string
    name: string
    description?: string | null
    isPrivate: boolean
    groupImageUrl?: string | null
    autoIconGradient?: string | null
    createdAt: Date
    creator: {
      firstName: string | null
      lastName: string | null
    }
    _count: {
      members: number
      activities: number
      questions?: number
    }
  }
  userRole?: GroupRole | null
  isMember?: boolean
  onJoin?: (groupId: string) => void
  showQuestionsCount?: boolean
}

export function GroupCard({ group, userRole, isMember = false, onJoin, showQuestionsCount = false }: GroupCardProps) {
  const gradientIndex = parseInt(group.autoIconGradient || '0') || 0
  const gradient = getGradientColors(gradientIndex)
  const initials = getGroupInitials(group.name)

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
      {/* Group Icon/Image */}
      <div className="relative h-24 flex items-center justify-center">
        {group.groupImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${group.groupImageUrl})` }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            }}
          />
        )}
        <span className="relative text-white text-3xl font-bold drop-shadow-lg">{initials}</span>

        {/* Privacy Badge */}
        <div className="absolute top-2 right-2">
          {group.isPrivate ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800/70 text-white text-xs rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Private
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/80 text-white text-xs rounded-full">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Public
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/groups/${group.id}`} className="block group">
          <h3 className="font-semibold text-gray-900 group-hover:text-[var(--stanford-cardinal)] transition-colors truncate">
            {group.name}
          </h3>
        </Link>

        {group.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>
        )}

        {/* Stats - Flask style */}
        <div className="flex justify-between items-center mt-3 bg-gray-50 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-1">
            <i className="fas fa-users text-blue-500"></i>
            <span className="font-medium">{group._count.members}</span>
          </div>
          <div className="flex items-center gap-1">
            <i className="fas fa-clipboard-list text-green-500"></i>
            <span className="font-medium">{group._count.activities}</span>
          </div>
          {showQuestionsCount && (
            <div className="flex items-center gap-1">
              <i className="fas fa-question-circle text-purple-500"></i>
              <span className="font-medium">{group._count.questions ?? 0}</span>
            </div>
          )}
        </div>

        {/* Role/Membership Badge and Action */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          {isMember && userRole !== null && userRole !== undefined ? (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userRole === GroupRoles.OWNER
                  ? 'bg-yellow-100 text-yellow-800'
                  : userRole === GroupRoles.CO_OWNER
                    ? 'bg-blue-100 text-blue-800'
                    : userRole === GroupRoles.ADMIN
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
              }`}
            >
              {getRoleLabel(userRole)}
            </span>
          ) : (
            <span className="text-xs text-gray-400">
              Created by {group.creator.firstName} {group.creator.lastName}
            </span>
          )}

          {!isMember && !group.isPrivate && onJoin && (
            <button
              onClick={() => onJoin(group.id)}
              className="px-3 py-1 text-sm font-medium text-white bg-[var(--stanford-cardinal)] rounded-lg hover:opacity-90 transition"
            >
              Join
            </button>
          )}

          {isMember && (
            <Link
              href={`/groups/${group.id}`}
              className="text-sm text-[var(--stanford-cardinal)] hover:underline"
            >
              View
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
