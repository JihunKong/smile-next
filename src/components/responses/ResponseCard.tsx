'use client'

import { useState } from 'react'
import { formatResponseTime, getAIEvaluationBadgeColor, getAIEvaluationLabel, canEditResponse, canDeleteResponse } from '@/lib/responses/utils'
import { AIEvaluationRatings } from '@/types/responses'
import type { ResponseWithCreator } from '@/types/responses'

interface ResponseCardProps {
  response: ResponseWithCreator
  currentUserId?: string
  questionCreatorId?: string
  activityCreatorId?: string
  groupCreatorId?: string
  hideUsernames?: boolean
  onEdit?: (responseId: string, content: string) => void
  onDelete?: (responseId: string) => void
}

export function ResponseCard({
  response,
  currentUserId,
  questionCreatorId,
  activityCreatorId,
  groupCreatorId,
  hideUsernames = false,
  onEdit,
  onDelete,
}: ResponseCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(response.content)
  const [isSaving, setIsSaving] = useState(false)

  const showAsAnonymous = response.isAnonymous || hideUsernames
  const canEdit = canEditResponse(currentUserId, response.creatorId)
  const canDelete = canDeleteResponse(currentUserId, response.creatorId, questionCreatorId, activityCreatorId, groupCreatorId)

  async function handleSave() {
    if (!onEdit) return
    setIsSaving(true)
    await onEdit(response.id, editContent)
    setIsSaving(false)
    setIsEditing(false)
  }

  function handleCancel() {
    setEditContent(response.content)
    setIsEditing(false)
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {/* Author */}
          {showAsAnonymous ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="font-medium">Anonymous</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium">
                {response.creator.avatarUrl ? (
                  <img
                    src={response.creator.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <>
                    {response.creator.firstName?.[0] || ''}
                    {response.creator.lastName?.[0] || ''}
                  </>
                )}
              </div>
              <span className="font-medium text-gray-800">
                {response.creator.firstName} {response.creator.lastName}
              </span>
            </div>
          )}
          <span className="text-xs text-gray-400">
            {formatResponseTime(response.createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* AI Evaluation Badge */}
          {response.aiEvaluationStatus === 'completed' && response.aiEvaluationRating && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getAIEvaluationBadgeColor(response.aiEvaluationRating)}`}
              title={response.aiEvaluationFeedback || undefined}
            >
              {response.aiEvaluationRating === AIEvaluationRatings.THUMBS_UP ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {getAIEvaluationLabel(response.aiEvaluationRating)}
            </span>
          )}
          {response.aiEvaluationStatus === 'pending' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI evaluating
            </span>
          )}

          {/* Edit Button */}
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Edit response"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {/* Delete Button */}
          {canDelete && !isEditing && (
            <button
              onClick={() => onDelete?.(response.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete response"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--stanford-cardinal)] focus:border-transparent outline-none resize-none"
            rows={3}
            maxLength={5000}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !editContent.trim()}
              className="px-3 py-1.5 text-sm bg-[var(--stanford-cardinal)] text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 whitespace-pre-wrap text-sm">{response.content}</p>
      )}

      {/* AI Feedback (if expanded) */}
      {response.aiEvaluationFeedback && !isEditing && (
        <p className="mt-2 text-xs text-gray-500 italic border-t border-gray-200 pt-2">
          AI Feedback: {response.aiEvaluationFeedback}
        </p>
      )}
    </div>
  )
}
