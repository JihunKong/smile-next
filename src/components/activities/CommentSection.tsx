'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Creator {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Comment {
  id: string
  content: string
  createdAt: string
  isAnonymous: boolean
  creator: Creator | null
  isOwnComment: boolean
  replies?: Comment[]
}

interface CommentSectionProps {
  questionId: string
  isAnonymousAllowed?: boolean
}

export function CommentSection({ questionId, isAnonymousAllowed = false }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [questionId])

  async function fetchComments() {
    try {
      const response = await fetch(`/api/questions/${questionId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/questions/${questionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          isAnonymous,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setNewComment('')
        setIsAnonymous(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to post comment')
      }
    } catch (err) {
      setError('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/questions/${questionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
          isAnonymous,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(comments.map(c =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), data.comment] }
            : c
        ))
        setReplyContent('')
        setReplyingTo(null)
      }
    } catch (err) {
      console.error('Failed to post reply:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(commentId: string, parentId?: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/questions/${questionId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })

      if (response.ok) {
        if (parentId) {
          // Delete reply
          setComments(comments.map(c =>
            c.id === parentId
              ? { ...c, replies: c.replies?.filter(r => r.id !== commentId) }
              : c
          ))
        } else {
          // Delete top-level comment
          setComments(comments.filter(c => c.id !== commentId))
        }
      }
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  function getDisplayName(comment: Comment) {
    if (comment.isAnonymous) return 'Anonymous'
    if (comment.creator?.name) return comment.creator.name
    return comment.creator?.email?.split('@')[0] || 'User'
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-100 rounded-lg" />
        <div className="h-16 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none resize-none text-sm"
          disabled={isSubmitting}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center justify-between">
          {isAnonymousAllowed && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-[var(--stanford-cardinal)] rounded"
                disabled={isSubmitting}
              />
              <span className="text-xs text-gray-600">Post anonymously</span>
            </label>
          )}
          {!isAnonymousAllowed && <div />}
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-2 bg-[var(--stanford-cardinal)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {/* Main Comment */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {getDisplayName(comment)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getDisplayName(comment)}
                        {comment.isOwnComment && (
                          <span className="ml-1 text-xs text-[var(--stanford-cardinal)]">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {comment.isOwnComment && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Delete comment"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="mt-2 text-xs text-[var(--stanford-cardinal)] hover:underline"
                >
                  Reply
                </button>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="ml-8 flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none"
                    disabled={isSubmitting}
                    maxLength={2000}
                  />
                  <button
                    onClick={() => handleReply(comment.id)}
                    disabled={isSubmitting || !replyContent.trim()}
                    className="px-3 py-2 bg-[var(--stanford-cardinal)] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                  >
                    Reply
                  </button>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                            {getDisplayName(reply)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getDisplayName(reply)}
                              {reply.isOwnComment && (
                                <span className="ml-1 text-xs text-[var(--stanford-cardinal)]">(You)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        {reply.isOwnComment && (
                          <button
                            onClick={() => handleDelete(reply.id, comment.id)}
                            className="text-gray-400 hover:text-red-500 transition"
                            title="Delete reply"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
