'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRCodeCanvas } from 'qrcode.react'
import { getRoleLabel } from '@/lib/groups/utils'
import { GroupRoles, type GroupRole } from '@/types/groups'

interface GroupMember {
  id: string
  userId: string
  role: number
  joinedAt: string
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    avatarUrl: string | null
    email: string | null
  }
}

interface GroupData {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  inviteCode: string | null
  createdAt: string
  groupImageUrl: string | null
  autoIconGradient: string | null
  creator: {
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    avatarUrl: string | null
    email: string | null
  }
  members: GroupMember[]
  _count: {
    activities: number
  }
}

interface ActivityData {
  id: string
  title: string
  description: string | null
  mode: number
  createdAt: string
  creator: {
    id: string
    firstName: string | null
    lastName: string | null
    username: string | null
    avatarUrl: string | null
  }
  _count: {
    questions: number
  }
}

interface GroupDetailClientProps {
  group: GroupData
  activities: ActivityData[]
  questionsCount: number
  likesCount: number
  currentUserId: string
  userRole?: GroupRole
  canManage: boolean
}

export function GroupDetailClient({
  group,
  activities,
  questionsCount,
  likesCount,
  currentUserId,
  userRole,
  canManage,
}: GroupDetailClientProps) {
  const router = useRouter()
  const [showAllMembers, setShowAllMembers] = useState(false)
  const [sortOrder, setSortOrder] = useState('default')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const isOwner = userRole === GroupRoles.OWNER
  const isCoOwner = userRole === GroupRoles.CO_OWNER

  const displayedMembers = showAllMembers ? group.members : group.members.slice(0, 5)

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/groups/join/${group.inviteCode}`
    : `/groups/join/${group.inviteCode}`

  const sortedActivities = [...activities].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sortOrder === 'name') return a.title.localeCompare(b.title)
    return 0 // default order
  })

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    alert('Invite link copied to clipboard!')
  }

  const handleDuplicate = async () => {
    if (!confirm('Are you sure you want to duplicate this group?')) return
    // TODO: Implement duplicate API
    alert('Duplicate functionality coming soon')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Link */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <Link href="/groups" className="inline-flex items-center gap-1 text-[var(--stanford-cardinal)] hover:underline text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Groups
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header with Title and Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {group.description && (
                <p className="mt-2 text-gray-600">{group.description}</p>
              )}
            </div>

            {/* Flask-style Action Buttons */}
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/groups/${group.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:bg-[var(--stanford-cardinal-dark)] transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Group
                </Link>
                <button
                  onClick={handleDuplicate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Duplicate
                </button>
                <Link
                  href={`/groups/${group.id}/members`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Manage Members
                </Link>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Invite Members
                </button>
              </div>
            )}
          </div>

          {/* Group Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-6 border-b border-gray-200">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created {new Date(group.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Group ID: {group.id}
            </span>
          </div>

          {/* 3-Column Layout: Members, Stats, QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-gray-200">
            {/* Members Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Members ({group.members.length})
              </h3>
              <div className="space-y-3">
                {displayedMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {member.user.avatarUrl ? (
                        <img src={member.user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.user.firstName} {member.user.lastName}
                          {member.user.email && (
                            <svg className="inline-block w-3 h-3 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{getRoleLabel(member.role as GroupRole)}</div>
                      </div>
                    </div>
                    {canManage && member.role !== GroupRoles.OWNER && (
                      <button className="text-red-500 hover:text-red-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {group.members.length > 5 && (
                <button
                  onClick={() => setShowAllMembers(!showAllMembers)}
                  className="mt-4 w-full py-2 text-sm text-[var(--stanford-cardinal)] border border-[var(--stanford-cardinal)] rounded-lg hover:bg-red-50 transition-colors"
                >
                  {showAllMembers ? 'Show Less' : `Show All ${group.members.length} Members`}
                </button>
              )}
            </div>

            {/* Group Stats Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Group Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{group._count.activities}</div>
                  <div className="text-xs text-gray-500">Activities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{questionsCount}</div>
                  <div className="text-xs text-gray-500">Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{group.members.length}</div>
                  <div className="text-xs text-gray-500">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{likesCount}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    Likes
                  </div>
                </div>
              </div>
            </div>

            {/* Invite QR Code Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Invite QR Code
              </h3>
              <div className="flex flex-col items-center">
                {group.inviteCode ? (
                  <>
                    <div className="bg-white p-2 border rounded-lg mb-3">
                      <QRCodeCanvas value={inviteUrl} size={140} />
                    </div>
                    <p className="text-xs text-gray-500 mb-3 text-center">
                      Scan to join <strong>{group.name}</strong>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={copyInviteLink}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Copy link"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join ${encodeURIComponent(group.name)} on SMILE!&url=${encodeURIComponent(inviteUrl)}`, '_blank')}
                        className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors"
                        title="Share on Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center">No invite code available</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {group.creator.email && (
            <div className="py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
              <p className="text-sm text-gray-600">{group.creator.email}</p>
            </div>
          )}
        </div>

        {/* Activities Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Activities ({activities.length})
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)]"
                >
                  <option value="default">Default (Custom Order)</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">View:</span>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'} hover:bg-gray-50`}
                    title="Grid view"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'} hover:bg-gray-50`}
                    title="List view"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Create Activity Button */}
              {canManage && (
                <Link
                  href={`/activities/create?groupId=${group.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:bg-[var(--stanford-cardinal-dark)] transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Activity
                </Link>
              )}
            </div>
          </div>

          {/* Activities List */}
          {sortedActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">No activities yet</p>
              <p className="text-sm mt-1">Create your first activity to get started</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
              {sortedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                    <span className="text-sm text-blue-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {activity._count.questions}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      0 responses
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      0 ratings
                    </span>
                    <span className="capitalize px-2 py-0.5 bg-gray-100 rounded">
                      {activity.mode === 0 ? 'Open' : activity.mode === 1 ? 'Exam' : activity.mode === 2 ? 'Inquiry' : 'Case'} Mode
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      <svg className="inline w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Flask-style View + Edit Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/activities/${activity.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                    {canManage && (
                      <Link
                        href={`/activities/${activity.id}/edit`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                    )}
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setInviteModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Members</h3>
            {group.inviteCode ? (
              <>
                <div className="flex justify-center mb-4">
                  <QRCodeCanvas value={inviteUrl} size={200} />
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Scan this QR code or share the link below to invite members
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="px-4 py-2 bg-[var(--stanford-cardinal)] text-white rounded-lg hover:bg-[var(--stanford-cardinal-dark)]"
                  >
                    Copy
                  </button>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center">No invite code available</p>
            )}
            <button
              onClick={() => setInviteModalOpen(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
