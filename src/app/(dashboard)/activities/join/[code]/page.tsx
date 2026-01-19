'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { LoadingSpinner, LoadingState } from '@/components/ui'

interface ActivityInfo {
  id: string
  name: string
  description: string | null
  educationLevel: string | null
  schoolSubject: string | null
  group: {
    id: string
    name: string
    isPrivate: boolean
  }
}

export default function JoinActivityPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const sharingCode = params.code as string

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/login?callbackUrl=/activities/join/${sharingCode}`)
      return
    }

    if (status === 'authenticated') {
      loadActivityInfo()
    }
  }, [status, sharingCode])

  async function loadActivityInfo() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/activities/invite/${sharingCode}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Invalid or expired sharing code')
        } else {
          throw new Error('Failed to load activity information')
        }
        return
      }

      const data = await res.json()
      setActivity(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!activity) return

    try {
      setJoining(true)
      setError(null)
      setMessage(null)

      const res = await fetch('/api/activities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharingCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.alreadyMember) {
          // Already a member, redirect to activity
          router.push(`/activities/${activity.id}`)
          return
        }
        throw new Error(data.error || 'Failed to join activity')
      }

      // Successfully joined, redirect to activity
      router.push(`/activities/${activity.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setJoining(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <LoadingState fullPage message="Loading activity..." />
    )
  }

  if (error && !activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Join</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/groups"
            className="text-indigo-600 hover:underline"
          >
            Browse Groups Instead
          </Link>
        </div>
      </div>
    )
  }

  if (!activity) return null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Activity</h1>
          <p className="text-gray-600 mt-2">You&apos;ve been invited to participate in an activity</p>
        </div>

        {/* Activity Info */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{activity.name}</h2>
          {activity.description && (
            <p className="text-gray-600 mb-4 whitespace-pre-line">{activity.description}</p>
          )}

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span><strong>Group:</strong> {activity.group.name}</span>
            </div>
            {activity.educationLevel && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
                <span><strong>Level:</strong> {activity.educationLevel}</span>
              </div>
            )}
            {activity.schoolSubject && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span><strong>Subject:</strong> {activity.schoolSubject}</span>
              </div>
            )}
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span><strong>Privacy:</strong> {activity.group.isPrivate ? 'Private Group' : 'Public Group'}</span>
            </div>
          </div>
        </div>

        {/* Error/Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{message}</p>
          </div>
        )}

        {/* Join Button */}
        <div className="space-y-4">
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full px-6 py-3 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center"
            style={{ backgroundColor: '#4f46e5' }}
          >
            {joining ? (
              <>
                <LoadingSpinner size="sm" className="-ml-1 mr-2" />
                Joining...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Join Activity
              </>
            )}
          </button>

          <div className="text-center">
            <Link
              href="/groups"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              &larr; Browse Groups Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
