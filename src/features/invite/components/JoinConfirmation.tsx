'use client'

import { LoadingSpinner } from '@/components/ui'
import type { GroupInfo } from '../types'
import { GroupStats } from './GroupStats'

interface JoinConfirmationProps {
  group: GroupInfo
  userEmail: string
  error: string | null
  isSubmitting: boolean
  onJoin: () => void
}

/**
 * Join group confirmation for logged-in users
 */
export function JoinConfirmation({
  group,
  userEmail,
  error,
  isSubmitting,
  onJoin,
}: JoinConfirmationProps) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Group Header */}
        <div className="bg-gradient-to-br from-[#8C1515] to-[#B83A4B] p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Join Group</h1>
          <p className="text-white/80">You have been invited to join</p>
        </div>

        <div className="p-6">
          {/* Group Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
            {group.description && (
              <p className="text-gray-600 mt-2 text-sm">{group.description}</p>
            )}
          </div>

          {/* Group Stats */}
          <div className="mb-6">
            <GroupStats
              memberCount={group.memberCount}
              activityCount={group.activityCount}
              showIcons
            />
          </div>

          {/* Creator */}
          <p className="text-center text-sm text-gray-500 mb-6">
            Created by {group.creator.firstName} {group.creator.lastName}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {/* Join Button */}
          <button
            onClick={onJoin}
            disabled={isSubmitting}
            className="w-full py-3 px-4 font-semibold text-white rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: 'var(--stanford-cardinal)' }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Joining...
              </span>
            ) : (
              'Join Group'
            )}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Logged in as {userEmail}
          </p>
        </div>
      </div>
    </div>
  )
}
