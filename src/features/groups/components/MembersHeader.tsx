'use client'

import Link from 'next/link'
import { getGradientColors, getGroupInitials } from '@/lib/groups/utils'

interface MembersHeaderProps {
  groupId: string
  groupName: string
  memberCount: number
  autoIconGradient: string | null
  groupImageUrl: string | null
}

export function MembersHeader({
  groupId,
  groupName,
  memberCount,
  autoIconGradient,
  groupImageUrl,
}: MembersHeaderProps) {
  const gradientIndex = parseInt(autoIconGradient || '0') || 0
  const gradient = getGradientColors(gradientIndex)
  const initials = getGroupInitials(groupName)

  return (
    <section
      className="relative py-8 px-4 text-white"
      style={{
        background: groupImageUrl
          ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${groupImageUrl}) center/cover`
          : `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
      }}
    >
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/groups/${groupId}`}
          className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Group
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manage Members</h1>
            <p className="text-white/80">{groupName} - {memberCount} members</p>
          </div>
        </div>
      </div>
    </section>
  )
}
