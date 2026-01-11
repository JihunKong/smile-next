'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuickResponseProps {
  questionId: string
  activityId: string
  onClose: () => void
  onSuccess?: () => void
}

export function QuickResponse({ questionId, activityId, onClose, onSuccess }: QuickResponseProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!content.trim()) {
      setError('Please enter a response')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/activities/${activityId}/questions/${questionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit response')
      }

      setContent('')
      onSuccess?.()
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your response..."
        rows={2}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent resize-none"
        disabled={isSubmitting}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="px-3 py-1.5 text-xs bg-[var(--stanford-cardinal)] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
