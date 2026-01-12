'use client'

import { useState, useEffect } from 'react'
import type { ActivityFormData } from '../page'

interface GroupSelectionStepProps {
  formData: ActivityFormData
  updateFormData: (updates: Partial<ActivityFormData>) => void
}

interface Group {
  id: string
  name: string
  memberCount: number
}

export default function GroupSelectionStep({ formData, updateFormData }: GroupSelectionStepProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups/my-teachable')
        if (response.ok) {
          const data = await response.json()
          setGroups(data.groups || [])
        }
      } catch (error) {
        console.error('Failed to fetch groups:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Select Group</h2>
        <p className="text-gray-600 text-sm">Choose where to publish your activity</p>
      </div>

      {/* Selection Type */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => updateFormData({ groupSelection: 'existing' })}
          className={`flex-1 p-4 border-2 rounded-lg text-left transition-colors ${
            formData.groupSelection === 'existing'
              ? 'border-[var(--stanford-cardinal)] bg-[var(--stanford-cardinal)]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--stanford-cardinal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <div className="font-medium text-gray-900">Existing Group</div>
              <div className="text-sm text-gray-500">Add to a group you manage</div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => updateFormData({ groupSelection: 'new' })}
          className={`flex-1 p-4 border-2 rounded-lg text-left transition-colors ${
            formData.groupSelection === 'new'
              ? 'border-[var(--stanford-cardinal)] bg-[var(--stanford-cardinal)]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[var(--stanford-cardinal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div>
              <div className="font-medium text-gray-900">New Group</div>
              <div className="text-sm text-gray-500">Create a new group</div>
            </div>
          </div>
        </button>
      </div>

      {/* Existing Group Selection */}
      {formData.groupSelection === 'existing' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a Group <span className="text-red-500">*</span>
          </label>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--stanford-cardinal)] border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading your groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-600 mb-2">No groups found</p>
              <button
                type="button"
                onClick={() => updateFormData({ groupSelection: 'new' })}
                className="text-[var(--stanford-cardinal)] hover:underline text-sm"
              >
                Create a new group instead
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => updateFormData({ groupId: group.id })}
                  className={`w-full p-4 border rounded-lg text-left transition-colors ${
                    formData.groupId === group.id
                      ? 'border-[var(--stanford-cardinal)] bg-[var(--stanford-cardinal)]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{group.name}</div>
                      <div className="text-sm text-gray-500">{group.memberCount} members</div>
                    </div>
                    {formData.groupId === group.id && (
                      <svg className="w-5 h-5 text-[var(--stanford-cardinal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Group Form */}
      {formData.groupSelection === 'new' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="newGroupName" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="newGroupName"
              value={formData.newGroupName}
              onChange={(e) => updateFormData({ newGroupName: e.target.value })}
              placeholder="e.g., Science Class 2024"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => updateFormData({ groupPrivacy: 'public' })}
                className={`flex-1 p-3 border rounded-lg text-center transition-colors ${
                  formData.groupPrivacy === 'public'
                    ? 'border-[var(--stanford-cardinal)] bg-[var(--stanford-cardinal)]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-1 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="font-medium text-sm">Public</div>
                <div className="text-xs text-gray-500">Anyone can join</div>
              </button>

              <button
                type="button"
                onClick={() => updateFormData({ groupPrivacy: 'private' })}
                className={`flex-1 p-3 border rounded-lg text-center transition-colors ${
                  formData.groupPrivacy === 'private'
                    ? 'border-[var(--stanford-cardinal)] bg-[var(--stanford-cardinal)]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-1 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="font-medium text-sm">Private</div>
                <div className="text-xs text-gray-500">Invite only</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
