'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Activity {
  id: string
  name: string
  mode: number
  groupName: string
  questionCount: number
}

interface Group {
  id: string
  name: string
}

export default function ActivityDuplicatorPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [activities, setActivities] = useState<Activity[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [targetGroupId, setTargetGroupId] = useState('')
  const [newName, setNewName] = useState('')
  const [includeQuestions, setIncludeQuestions] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [error, setError] = useState('')

  const selectedActivity = activities.find((a) => a.id === selectedActivityId)

  // Fetch activities and groups
  useEffect(() => {
    const fetchData = async () => {
      if (!session) return

      try {
        const [activitiesRes, groupsRes] = await Promise.all([
          fetch('/api/activities?limit=100'),
          fetch('/api/groups/my-teachable'),
        ])

        if (activitiesRes.ok) {
          const data = await activitiesRes.json()
          setActivities(
            (data.activities || []).map((a: { id: string; name: string; mode: number; owningGroup?: { name: string }; _count?: { questions: number } }) => ({
              id: a.id,
              name: a.name,
              mode: a.mode,
              groupName: a.owningGroup?.name || 'Unknown',
              questionCount: a._count?.questions || 0,
            }))
          )
        }

        if (groupsRes.ok) {
          const data = await groupsRes.json()
          setGroups(data.groups || [])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [session])

  // Update new name when activity is selected
  useEffect(() => {
    if (selectedActivity) {
      setNewName(`${selectedActivity.name} (Copy)`)
    } else {
      setNewName('')
    }
  }, [selectedActivity])

  const handleDuplicate = async () => {
    if (!selectedActivityId || !targetGroupId || !newName.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsDuplicating(true)
    setError('')

    try {
      const response = await fetch(`/api/activities/${selectedActivityId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetGroupId,
          newName: newName.trim(),
          includeQuestions,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to duplicate activity')
      }

      // Navigate to the new activity
      router.push(`/activities/${result.data.activityId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate activity')
      setIsDuplicating(false)
    }
  }

  const getModeLabel = (mode: number) => {
    const modes: Record<number, string> = {
      0: 'Open Mode',
      1: 'Exam Mode',
      2: 'Inquiry Mode',
      3: 'Case Mode',
    }
    return modes[mode] || 'Unknown'
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to use the Activity Duplicator.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tools
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Activity Duplicator
          </h1>
          <p className="text-white/80 mt-1">Duplicate existing activities to new groups with all questions</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-[#8C1515]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {/* Source Activity Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Activity <span className="text-red-500">*</span>
                </label>
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No activities found.</p>
                    <p className="text-sm mt-1">Create an activity first to use the duplicator.</p>
                  </div>
                ) : (
                  <select
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                  >
                    <option value="">-- Select an activity to duplicate --</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name} ({activity.groupName}) - {activity.questionCount} questions
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Activity Preview */}
              {selectedActivity && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Selected Activity Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900">{selectedActivity.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mode:</span>
                      <span className="ml-2 text-gray-900">{getModeLabel(selectedActivity.mode)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Current Group:</span>
                      <span className="ml-2 text-gray-900">{selectedActivity.groupName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Questions:</span>
                      <span className="ml-2 text-gray-900">{selectedActivity.questionCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Group Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Group <span className="text-red-500">*</span>
                </label>
                {groups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No teachable groups found.</p>
                    <p className="text-sm mt-1">You need to own or co-own a group to duplicate activities.</p>
                  </div>
                ) : (
                  <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                  >
                    <option value="">-- Select target group --</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* New Activity Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Activity Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter a name for the duplicated activity"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8C1515] focus:border-transparent"
                />
              </div>

              {/* Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Options</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeQuestions}
                    onChange={(e) => setIncludeQuestions(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#8C1515] focus:ring-[#8C1515]"
                  />
                  <span className="text-gray-700">Include all questions ({selectedActivity?.questionCount || 0} questions)</span>
                </label>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end gap-3">
                <Link
                  href="/tools"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleDuplicate}
                  disabled={isDuplicating || !selectedActivityId || !targetGroupId || !newName.trim()}
                  className="px-6 py-2 bg-[#8C1515] text-white rounded-lg hover:bg-[#6D1010] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isDuplicating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Duplicating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Duplicate Activity
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#2E2D29] mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Select Source Activity</h3>
                <p className="text-sm text-gray-600">Choose the activity you want to duplicate from your existing activities.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Choose Target Group</h3>
                <p className="text-sm text-gray-600">Select which group should receive the duplicated activity.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Customize & Duplicate</h3>
                <p className="text-sm text-gray-600">Give the new activity a name and choose whether to include questions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
