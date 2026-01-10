'use client'

import Link from 'next/link'
import { getOrdinalSuffix } from './RankingCard'

export interface GroupRankingItem {
  id: string
  name: string
  rank: number
  totalMembers: number
  points: number
  imageUrl?: string
}

export interface GroupRankingProps {
  groups: GroupRankingItem[]
  currentGroupId?: string
  onGroupClick?: (group: GroupRankingItem) => void
  showPoints?: boolean
  showMembers?: boolean
  maxDisplay?: number
  className?: string
}

// Get rank styling based on position
function getRankStyle(rank: number): {
  bgColor: string
  textColor: string
  icon: string
} {
  switch (rank) {
    case 1:
      return {
        bgColor: 'bg-yellow-400',
        textColor: 'text-yellow-900',
        icon: 'fa-crown',
      }
    case 2:
      return {
        bgColor: 'bg-gray-300',
        textColor: 'text-gray-700',
        icon: 'fa-medal',
      }
    case 3:
      return {
        bgColor: 'bg-amber-600',
        textColor: 'text-white',
        icon: 'fa-medal',
      }
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: '',
      }
  }
}

export default function GroupRanking({
  groups,
  currentGroupId,
  onGroupClick,
  showPoints = true,
  showMembers = true,
  maxDisplay,
  className = '',
}: GroupRankingProps) {
  const displayGroups = maxDisplay ? groups.slice(0, maxDisplay) : groups

  if (displayGroups.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-2">
          <i className="fas fa-users text-4xl" aria-hidden="true" />
        </div>
        <p className="text-gray-500 text-sm">No group rankings available yet.</p>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden ${className}`}
      role="list"
      aria-label="Group rankings"
    >
      <div className="divide-y divide-gray-200">
        {displayGroups.map((group) => {
          const rankStyle = getRankStyle(group.rank)
          const isCurrentGroup = group.id === currentGroupId

          const content = (
            <div
              className={`p-4 flex items-center gap-4 transition-colors ${
                isCurrentGroup ? 'bg-[#8C1515]/5' : 'hover:bg-gray-50'
              } ${onGroupClick ? 'cursor-pointer' : ''}`}
              onClick={() => onGroupClick?.(group)}
              role="listitem"
              aria-current={isCurrentGroup ? 'true' : undefined}
            >
              {/* Rank badge */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${rankStyle.bgColor} ${rankStyle.textColor}`}
              >
                {rankStyle.icon ? (
                  <i className={`fas ${rankStyle.icon}`} aria-hidden="true" />
                ) : (
                  group.rank
                )}
              </div>

              {/* Group image or initial */}
              <div className="w-10 h-10 rounded-lg bg-[#8C1515] flex items-center justify-center text-white font-medium overflow-hidden shrink-0">
                {group.imageUrl ? (
                  <img
                    src={group.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  group.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Group info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {group.name}
                  </span>
                  {isCurrentGroup && (
                    <span className="text-xs text-[#8C1515] bg-[#8C1515]/10 px-2 py-0.5 rounded">
                      Your Group
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>#{group.rank}{getOrdinalSuffix(group.rank)}</span>
                  {showMembers && (
                    <span>
                      <i className="fas fa-users mr-1" aria-hidden="true" />
                      {group.totalMembers.toLocaleString()} members
                    </span>
                  )}
                </div>
              </div>

              {/* Points */}
              {showPoints && (
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-[#8C1515]">
                    {group.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              )}

              {/* Arrow indicator */}
              {onGroupClick && (
                <div className="text-gray-400">
                  <i className="fas fa-chevron-right" aria-hidden="true" />
                </div>
              )}
            </div>
          )

          // If onGroupClick is provided, use it; otherwise wrap in Link
          return onGroupClick ? (
            <div key={group.id}>{content}</div>
          ) : (
            <Link key={group.id} href={`/groups/${group.id}`} className="block">
              {content}
            </Link>
          )
        })}
      </div>

      {/* Show more link if there are more groups */}
      {maxDisplay && groups.length > maxDisplay && (
        <div className="p-4 border-t bg-gray-50 text-center">
          <Link
            href="/leaderboard"
            className="text-sm text-[#8C1515] hover:underline"
          >
            View all {groups.length} groups
            <i className="fas fa-arrow-right ml-1" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  )
}
