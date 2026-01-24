'use client'

import Link from 'next/link'
import { getGradientColors, getGroupInitials, canManageGroup } from '@/lib/groups/utils'
import type { GroupRole } from '@/types/groups'

interface GroupHeaderProps {
    group: {
        id: string
        name: string
        description: string | null
        isPrivate: boolean
        groupImageUrl: string | null
        autoIconGradient: string | null
    }
    userRole?: GroupRole | null
    onDuplicate?: () => void
}

export function GroupHeader({ group, userRole, onDuplicate }: GroupHeaderProps) {
    const gradient = getGradientColors(parseInt(group.autoIconGradient || '0'))
    const initials = getGroupInitials(group.name)
    const canEdit = canManageGroup(userRole, 'edit')

    return (
        <div className="relative">
            {/* Cover/Banner */}
            <div className="h-48 rounded-t-xl overflow-hidden">
                {group.groupImageUrl ? (
                    <img
                        src={group.groupImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
                        }}
                    >
                        <span className="text-white text-6xl font-bold opacity-50">
                            {initials}
                        </span>
                    </div>
                )}
            </div>

            {/* Title and Actions */}
            <div className="px-6 py-4 bg-white border-b">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${group.isPrivate
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                {group.isPrivate ? 'Private' : 'Public'}
                            </span>
                        </div>
                        {group.description && (
                            <p className="mt-2 text-gray-600">{group.description}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Link
                                href={`/groups/${group.id}/edit`}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Settings
                            </Link>
                        )}
                        {onDuplicate && (
                            <button
                                onClick={onDuplicate}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Duplicate
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
