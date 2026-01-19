'use client'

import { useState } from 'react'
import { createResponse } from '@/app/(dashboard)/activities/[id]/questions/[questionId]/actions'
import { LoadingSpinner } from '@/components/ui'

interface ResponseFormProps {
  questionId: string
  activityId: string
  isAnonymousAllowed: boolean
  onSuccess?: () => void
}

export function ResponseForm({
  questionId,
  activityId,
  isAnonymousAllowed,
  onSuccess,
}: ResponseFormProps) {
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    setError('')

    const formData = new FormData()
    formData.set('content', content.trim())
    formData.set('questionId', questionId)
    formData.set('isAnonymous', isAnonymous.toString())

    const result = await createResponse(formData)

    if (result.success) {
      setContent('')
      setIsAnonymous(false)
      onSuccess?.()
    } else {
      setError(result.error || 'Failed to submit response')
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="response-content" className="sr-only">
          Your response
        </label>
        <textarea
          id="response-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your response..."
          rows={4}
          maxLength={5000}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none resize-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {content.length}/5000 characters
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Anonymous Toggle */}
        {isAnonymousAllowed && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-[var(--stanford-cardinal)] rounded focus:ring-[var(--stanford-cardinal)]"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-600">Post anonymously</span>
          </label>
        )}
        {!isAnonymousAllowed && <div />}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="px-4 py-2 bg-[var(--stanford-cardinal)] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit Response
            </>
          )}
        </button>
      </div>
    </form>
  )
}
