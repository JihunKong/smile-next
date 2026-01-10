'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'

interface MessageDetail {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  receiverId: string
  receiverName: string
  content: string
  isRead: boolean
  isAnonymous: boolean
  createdAt: string
}

export default function MessageViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: messageId } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()

  const [message, setMessage] = useState<MessageDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reply state
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSendingReply, setIsSendingReply] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  async function fetchMessage() {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch(`/api/messages/${messageId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load message')
      }

      setMessage(data.message)

      // Mark as read if user is the receiver
      if (data.message.receiverId === session?.user?.id && !data.message.isRead) {
        await fetch(`/api/messages/${messageId}/read`, { method: 'POST' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load message')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchMessage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, messageId])

  async function handleDelete() {
    if (!message) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete message')
      }

      router.push('/messages')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!message || !replyContent.trim()) return

    setIsSendingReply(true)
    setReplyError(null)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: message.senderId,
          content: replyContent.trim(),
          isAnonymous: false,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reply')
      }

      setReplyContent('')
      setShowReplyForm(false)
      // Show success notification or redirect to messages
      router.push('/messages')
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setIsSendingReply(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !message) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Message Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/messages"
              className="inline-flex items-center px-4 py-2 bg-[#8C1515] text-white font-medium rounded-lg hover:bg-[#6D1010] transition"
            >
              Back to Messages
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!message) return null

  const isReceiver = message.receiverId === session?.user?.id
  const isSender = message.senderId === session?.user?.id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/messages"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Messages
          </Link>
        </div>

        {/* Message Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#8C1515] flex items-center justify-center text-white text-lg font-medium flex-shrink-0 overflow-hidden">
                  {message.isAnonymous
                    ? '?'
                    : message.senderAvatar
                    ? (
                      <Image
                        src={message.senderAvatar}
                        alt={message.senderName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )
                    : message.senderName?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Sender Info */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {message.isAnonymous ? 'Anonymous' : message.senderName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isReceiver ? 'Sent to you' : `Sent to ${message.receiverName}`}
                  </p>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-sm text-gray-500">
                {new Date(message.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {message.content}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Reply Button (only if receiver and not anonymous) */}
              {isReceiver && !message.isAnonymous && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="inline-flex items-center px-4 py-2 bg-[#8C1515] text-white font-medium rounded-lg hover:bg-[#6D1010] transition"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Reply
                </button>
              )}
            </div>

            {/* Delete Button */}
            {(isReceiver || isSender) && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reply to {message.senderName}</h3>

            {replyError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {replyError}
              </div>
            )}

            <form onSubmit={handleSendReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                rows={4}
                className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent outline-none transition resize-none"
                required
              />

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false)
                    setReplyContent('')
                    setReplyError(null)
                  }}
                  className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply || !replyContent.trim()}
                  className="px-4 py-2 bg-[#8C1515] text-white font-medium rounded-lg hover:bg-[#6D1010] transition disabled:opacity-50"
                >
                  {isSendingReply ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Reply'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Message</h3>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this message? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
