'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { leaveGroup, deleteGroup } from '../actions'

interface LeaveGroupButtonProps {
  groupId: string
}

export function LeaveGroupButton({ groupId }: LeaveGroupButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleLeave() {
    setIsLoading(true)
    const result = await leaveGroup(groupId)
    if (result.success) {
      router.push('/groups')
    } else {
      alert(result.error || 'Failed to leave group')
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/80">Leave group?</span>
        <button
          onClick={handleLeave}
          disabled={isLoading}
          className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          {isLoading ? 'Leaving...' : 'Yes, Leave'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1.5 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Leave Group
    </button>
  )
}

interface DeleteGroupButtonProps {
  groupId: string
  groupName: string
}

export function DeleteGroupButton({ groupId, groupName }: DeleteGroupButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function handleDelete() {
    if (confirmText !== groupName) {
      alert('Please type the group name to confirm deletion')
      return
    }
    setIsLoading(true)
    const result = await deleteGroup(groupId)
    if (result.success) {
      router.push('/groups')
    } else {
      alert(result.error || 'Failed to delete group')
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Group</h3>
          <p className="text-gray-600 mb-4">
            This action cannot be undone. All activities and data in this group will be permanently deleted.
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Type <strong>{groupName}</strong> to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            data-testid="confirm-group-name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            placeholder="Type group name to confirm"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowConfirm(false)
                setConfirmText('')
              }}
              className="px-4 py-2 text-gray-600 font-medium hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading || confirmText !== groupName}
              data-testid="confirm-delete"
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete Group'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      data-testid="delete-group"
      aria-label="Delete group"
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/80 text-white font-medium rounded-lg hover:bg-red-600 transition"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete Group
    </button>
  )
}
