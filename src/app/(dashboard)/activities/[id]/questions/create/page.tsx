'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createQuestion } from '@/app/(dashboard)/activities/actions'

interface ActivityInfo {
  id: string
  name: string
  isAnonymousAuthorAllowed: boolean
  owningGroup: {
    id: string
    name: string
  }
}

export default function CreateQuestionPage() {
  const router = useRouter()
  const params = useParams()
  const activityId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [activity, setActivity] = useState<ActivityInfo | null>(null)
  const [loadingActivity, setLoadingActivity] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`/api/activities/${activityId}`)
        if (res.ok) {
          const data = await res.json()
          setActivity(data)
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err)
      } finally {
        setLoadingActivity(false)
      }
    }
    fetchActivity()
  }, [activityId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.set('activityId', activityId)
    formData.set('isAnonymous', isAnonymous.toString())

    const result = await createQuestion(formData)

    if (result.success) {
      router.push(`/activities/${activityId}`)
    } else {
      setError(result.error || 'Failed to create question')
      setIsLoading(false)
    }
  }

  if (loadingActivity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--stanford-cardinal)]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href={`/activities/${activityId}`} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Activity
          </Link>
          <h1 className="text-2xl font-bold">Ask a Question</h1>
          {activity && (
            <p className="text-white/80 mt-1">in {activity.name}</p>
          )}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Question Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Your Question <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              name="content"
              rows={6}
              required
              maxLength={5000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition resize-none"
              placeholder="What would you like to ask? Be specific and clear..."
            />
            <p className="text-xs text-gray-500 mt-1">Maximum 5000 characters.</p>
          </div>

          {/* Tips */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Tips for asking great questions:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Be specific and provide context</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Ask open-ended questions that encourage discussion</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Think about &quot;why&quot; and &quot;how&quot; rather than just &quot;what&quot;</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Connect your question to what you&apos;ve learned</span>
              </li>
            </ul>
          </div>

          {/* Anonymous Option */}
          {activity?.isAnonymousAuthorAllowed && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Submit Anonymously</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Your name won&apos;t be shown with this question
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
                </label>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link
              href={`/activities/${activityId}`}
              className="px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[var(--stanford-cardinal)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Question
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
