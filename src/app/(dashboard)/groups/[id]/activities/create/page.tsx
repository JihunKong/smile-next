'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createActivity } from '@/app/(dashboard)/activities/actions'

export default function CreateActivityPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiRatingEnabled, setAiRatingEnabled] = useState(true)
  const [allowAnonymous, setAllowAnonymous] = useState(false)
  const [hideUsernames, setHideUsernames] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    formData.set('groupId', groupId)
    formData.set('mode', '0') // Open Mode for MVP
    formData.set('aiRatingEnabled', aiRatingEnabled.toString())
    formData.set('isAnonymousAuthorAllowed', allowAnonymous.toString())
    formData.set('hideUsernames', hideUsernames.toString())

    const result = await createActivity(formData)

    if (result.success && result.data?.activityId) {
      router.push(`/activities/${result.data.activityId}`)
    } else {
      setError(result.error || 'Failed to create activity')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--stanford-cardinal)] to-[var(--stanford-pine)] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href={`/groups/${groupId}`} className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Group
          </Link>
          <h1 className="text-2xl font-bold">Create New Activity</h1>
          <p className="text-white/80 mt-1">Set up a learning activity for your group</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Activity Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Activity Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition"
              placeholder="e.g., Week 1 Discussion Questions"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none transition resize-none"
              placeholder="Describe what this activity is about..."
            />
            <p className="text-xs text-gray-500 mt-1">Optional. Maximum 1000 characters.</p>
          </div>

          {/* AI Rating Toggle */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">AI Rating</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enable AI evaluation of questions using Bloom&apos;s Taxonomy
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiRatingEnabled}
                  onChange={(e) => setAiRatingEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
              </label>
            </div>

            {aiRatingEnabled && (
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2 text-purple-800 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <p className="font-medium">AI Evaluation Enabled</p>
                    <p className="mt-0.5">Questions will be automatically analyzed for cognitive level (Remember, Understand, Apply, Analyze, Evaluate, Create) and quality.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Anonymous Questions Toggle */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Allow Anonymous Questions</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Let students submit questions without showing their name
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAnonymous}
                  onChange={(e) => setAllowAnonymous(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
              </label>
            </div>
          </div>

          {/* Hide Usernames Toggle */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Hide Usernames</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Hide all student names on questions (instructor can still see)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideUsernames}
                  onChange={(e) => setHideUsernames(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--stanford-cardinal)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--stanford-cardinal)]"></div>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link
              href={`/groups/${groupId}`}
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
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Activity
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
