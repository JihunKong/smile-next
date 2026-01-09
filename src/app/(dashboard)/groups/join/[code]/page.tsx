'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getGradientColors, getGroupInitials } from '@/lib/groups/utils'

interface GroupInfo {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  requirePasscode: boolean
  memberCount: number
  activityCount: number
  autoIconGradient: string | null
  groupImageUrl: string | null
  creator: {
    firstName: string | null
    lastName: string | null
  }
}

export default function JoinGroupPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: inviteCode } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [alreadyMember, setAlreadyMember] = useState(false)
  const [passcode, setPasscode] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      // Redirect to login with return URL
      router.push(`/auth/login?callbackUrl=/groups/join/${inviteCode}`)
      return
    }

    loadGroupInfo()
  }, [session, status, inviteCode])

  async function loadGroupInfo() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/groups/invite/${inviteCode}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid invite code')
      }

      setGroup(data.group)
      setAlreadyMember(data.alreadyMember)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group information')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!group) return

    setJoining(true)
    setError(null)

    try {
      const res = await fetch(`/api/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode,
          passcode: group.requirePasscode ? passcode : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join group')
      }

      // Redirect to group page
      router.push(`/groups/${group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group')
      setJoining(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/groups"
            className="inline-block px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
          >
            Browse Groups
          </Link>
        </div>
      </div>
    )
  }

  if (!group) return null

  const gradientIndex = parseInt(group.autoIconGradient || '0') || 0
  const gradient = getGradientColors(gradientIndex)
  const initials = getGroupInitials(group.name)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Group Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div
            className="py-8 px-6 text-center text-white"
            style={{
              background: group.groupImageUrl
                ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${group.groupImageUrl}) center/cover`
                : `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            }}
          >
            <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {initials}
            </div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="text-white/80 mt-2 text-sm">{group.description}</p>
            )}
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Group Info */}
            <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{group.memberCount} members</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>{group.activityCount} activities</span>
              </div>
            </div>

            {/* Owner Info */}
            <div className="text-center text-sm text-gray-500 mb-6">
              Created by{' '}
              <span className="font-medium text-gray-700">
                {group.creator.firstName} {group.creator.lastName}
              </span>
            </div>

            {/* Privacy Badge */}
            <div className="flex justify-center mb-6">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  group.isPrivate ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}
              >
                {group.isPrivate ? 'Private Group' : 'Public Group'}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                {error}
              </div>
            )}

            {/* Already Member */}
            {alreadyMember ? (
              <div className="text-center">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">You are already a member of this group</span>
                  </div>
                </div>
                <Link
                  href={`/groups/${group.id}`}
                  className="inline-block w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition text-center"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                >
                  Go to Group
                </Link>
              </div>
            ) : (
              <>
                {/* Passcode Input */}
                {group.requirePasscode && (
                  <div className="mb-4">
                    <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-1">
                      Enter Passcode
                    </label>
                    <input
                      id="passcode"
                      type="text"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter the group passcode"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This group requires a passcode to join
                    </p>
                  </div>
                )}

                {/* Join Button */}
                <button
                  onClick={handleJoin}
                  disabled={joining || (group.requirePasscode && !passcode)}
                  className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                >
                  {joining ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Joining...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Join Group
                    </>
                  )}
                </button>
              </>
            )}

            {/* Back Link */}
            <div className="mt-4 text-center">
              <Link href="/groups" className="text-sm text-indigo-600 hover:underline">
                Browse all groups
              </Link>
            </div>
          </div>
        </div>

        {/* Invite Code Display */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Invite Code: <code className="px-2 py-1 bg-gray-100 rounded font-mono">{inviteCode}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
