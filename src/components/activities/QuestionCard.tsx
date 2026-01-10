'use client'

import Link from 'next/link'
import { getBloomBadgeColor, getBloomLabel, getScoreColor, formatRelativeTime } from '@/lib/activities/utils'
import { formatAIScore } from '@/lib/responses/utils'
import { LikeButton } from './LikeButton'
import type { QuestionWithEvaluation } from '@/types/activities'

interface QuestionCardProps {
  question: QuestionWithEvaluation
  activityId: string
  showActions?: boolean
  currentUserId?: string
  activityCreatorId?: string
  groupCreatorId?: string
  isLiked?: boolean
  onDelete?: (questionId: string) => void
}

export function QuestionCard({
  question,
  activityId,
  showActions = false,
  currentUserId,
  activityCreatorId,
  groupCreatorId,
  isLiked = false,
  onDelete,
}: QuestionCardProps) {
  const canDelete =
    currentUserId === question.creatorId ||
    currentUserId === activityCreatorId ||
    currentUserId === groupCreatorId

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
      {/* Question header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {/* Author */}
          {question.isAnonymous ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span>Anonymous</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium">
                {question.creator.avatarUrl ? (
                  <img
                    src={question.creator.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <>
                    {question.creator.firstName?.[0] || ''}
                    {question.creator.lastName?.[0] || ''}
                  </>
                )}
              </div>
              <span className="font-medium text-gray-900">
                {question.creator.firstName} {question.creator.lastName}
              </span>
            </div>
          )}
          <span className="text-xs text-gray-400">
            {formatRelativeTime(question.createdAt)}
          </span>
        </div>

        {/* Actions */}
        {showActions && canDelete && onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(question.id)
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete question"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Question content - clickable link */}
      <Link href={`/activities/${activityId}/questions/${question.id}`} className="block">
        <p className="text-gray-800 whitespace-pre-wrap hover:text-[var(--stanford-cardinal)] transition line-clamp-3">
          {question.content}
        </p>
      </Link>

      {/* AI Evaluation */}
      {question.evaluation && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Bloom's level */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Bloom&apos;s:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBloomBadgeColor(question.evaluation.bloomsLevel)}`}>
                {getBloomLabel(question.evaluation.bloomsLevel)}
              </span>
            </div>

            {/* Overall score */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Score:</span>
              <span className={`text-sm font-medium ${getScoreColor(question.evaluation.overallScore)}`}>
                {formatAIScore(question.evaluation.overallScore)}
              </span>
            </div>

            {/* Sub-scores */}
            {question.evaluation.clarityScore !== null && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                <span>Clarity: {formatAIScore(question.evaluation.clarityScore)}</span>
                <span className="text-gray-300">|</span>
                <span>Relevance: {formatAIScore(question.evaluation.relevanceScore)}</span>
              </div>
            )}
          </div>

          {/* Feedback */}
          {question.evaluation.evaluationText && (
            <p className="mt-2 text-sm text-gray-600 italic line-clamp-2">
              {question.evaluation.evaluationText}
            </p>
          )}
        </div>
      )}

      {/* Stats with LikeButton */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <Link
          href={`/activities/${activityId}/questions/${question.id}`}
          className="flex items-center gap-1 hover:text-[var(--stanford-cardinal)] transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {question._count.responses} responses
        </Link>
        <LikeButton
          questionId={question.id}
          initialLiked={isLiked}
          initialCount={question._count.likes}
        />
      </div>
    </div>
  )
}
