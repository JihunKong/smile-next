'use client'

import { useState } from 'react'
import { ResponseCard } from './ResponseCard'
import { deleteResponse, updateResponse } from '@/app/(dashboard)/activities/[id]/questions/[questionId]/actions'
import type { ResponseWithCreator } from '@/types/responses'

interface ResponseListProps {
  responses: ResponseWithCreator[]
  currentUserId?: string
  questionCreatorId?: string
  activityCreatorId?: string
  groupCreatorId?: string
  hideUsernames?: boolean
}

export function ResponseList({
  responses,
  currentUserId,
  questionCreatorId,
  activityCreatorId,
  groupCreatorId,
  hideUsernames = false,
}: ResponseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleDelete(responseId: string) {
    if (!confirm('Are you sure you want to delete this response?')) {
      return
    }

    setDeletingId(responseId)
    const result = await deleteResponse(responseId)

    if (!result.success) {
      alert(result.error || 'Failed to delete response')
    }

    setDeletingId(null)
  }

  async function handleEdit(responseId: string, content: string) {
    setEditingId(responseId)
    const formData = new FormData()
    formData.set('content', content)

    const result = await updateResponse(responseId, formData)

    if (!result.success) {
      alert(result.error || 'Failed to update response')
    }

    setEditingId(null)
  }

  if (responses.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <p className="text-gray-500">No responses yet.</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to respond!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {responses.map((response) => (
        <div
          key={response.id}
          className={
            deletingId === response.id || editingId === response.id ? 'opacity-50' : ''
          }
        >
          <ResponseCard
            response={response}
            currentUserId={currentUserId}
            questionCreatorId={questionCreatorId}
            activityCreatorId={activityCreatorId}
            groupCreatorId={groupCreatorId}
            hideUsernames={hideUsernames}
            onEdit={deletingId !== response.id ? handleEdit : undefined}
            onDelete={deletingId !== response.id ? handleDelete : undefined}
          />
        </div>
      ))}
    </div>
  )
}
