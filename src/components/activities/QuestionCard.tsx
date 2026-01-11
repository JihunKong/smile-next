'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getBloomBadgeColor, getBloomLabel, getScoreColor, formatRelativeTime } from '@/lib/activities/utils'
import { formatAIScore } from '@/lib/responses/utils'
import { LikeButton } from './LikeButton'
import { PeerRating } from './PeerRating'
import { QuickResponse } from './QuickResponse'
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
  viewMode?: 'card' | 'list'
}

// Calculate weighted total score: AI 50% + Peer 30% + Likes 20%
function calculateTotalScore(
  aiScore: number | null | undefined,
  peerRating: number | null | undefined,
  likes: number
): number {
  const ai = ((aiScore ?? 0) / 10) * 0.5
  const peer = ((peerRating ?? 0) / 5) * 0.3
  const likesNorm = Math.min(likes / 10, 1) * 0.2
  return (ai + peer + likesNorm) * 10
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
  viewMode = 'card',
}: QuestionCardProps) {
  const [showQuickResponse, setShowQuickResponse] = useState(false)
  const [showScoreTooltip, setShowScoreTooltip] = useState(false)

  const canDelete =
    currentUserId === question.creatorId ||
    currentUserId === activityCreatorId ||
    currentUserId === groupCreatorId

  const peerRating = (question as unknown as { peerRating?: number }).peerRating ?? null
  const totalScore = calculateTotalScore(
    question.evaluation?.overallScore,
    peerRating,
    question._count.likes
  )

  // Card View (Padlet-style)
  if (viewMode === 'card') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition h-full flex flex-col">
        {/* Header: Author & Actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {question.isAnonymous ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="truncate">Anonymous</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs min-w-0">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium flex-shrink-0">
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
                <span className="font-medium text-gray-900 truncate">
                  {question.creator.firstName} {question.creator.lastName}
                </span>
              </div>
            )}
          </div>

          {/* 3-dot menu for delete */}
          {showActions && canDelete && onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(question.id)
              }}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded flex-shrink-0"
              title="Delete question"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          )}
        </div>

        {/* Question Content */}
        <Link href={`/activities/${activityId}/questions/${question.id}`} className="block flex-1">
          <p className="text-gray-800 text-sm whitespace-pre-wrap hover:text-[var(--stanford-cardinal)] transition line-clamp-4">
            {question.content}
          </p>
        </Link>

        {/* Footer: Stats */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            {/* Responses */}
            <button
              onClick={() => setShowQuickResponse(!showQuickResponse)}
              className="flex items-center gap-1 text-gray-500 hover:text-[var(--stanford-cardinal)] transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {question._count.responses}
            </button>

            {/* Likes */}
            <LikeButton
              questionId={question.id}
              initialLiked={isLiked}
              initialCount={question._count.likes}
              compact
            />

            {/* Peer Rating */}
            <PeerRating
              questionId={question.id}
              initialRating={peerRating}
              compact
            />

            {/* AI Score with Tooltip */}
            {question.evaluation && (
              <div
                className="relative"
                onMouseEnter={() => setShowScoreTooltip(true)}
                onMouseLeave={() => setShowScoreTooltip(false)}
              >
                <span className={`font-medium ${getScoreColor(question.evaluation.overallScore)}`}>
                  AI: {formatAIScore(question.evaluation.overallScore)}
                </span>
                {showScoreTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Clarity:</span>
                        <span>{formatAIScore(question.evaluation.clarityScore)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Relevance:</span>
                        <span>{formatAIScore(question.evaluation.relevanceScore)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Creativity:</span>
                        <span>{formatAIScore(question.evaluation.creativityScore)}</span>
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            )}

            {/* Bloom's Level */}
            {question.evaluation?.bloomsLevel && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getBloomBadgeColor(question.evaluation.bloomsLevel)}`}>
                {getBloomLabel(question.evaluation.bloomsLevel).slice(0, 3)}
              </span>
            )}

            {/* Total Score */}
            <div
              className="relative"
              onMouseEnter={() => setShowScoreTooltip(true)}
              onMouseLeave={() => setShowScoreTooltip(false)}
            >
              <span className="font-bold text-[var(--stanford-cardinal)]">
                {totalScore.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Response Input */}
        {showQuickResponse && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <QuickResponse
              questionId={question.id}
              activityId={activityId}
              onClose={() => setShowQuickResponse(false)}
            />
          </div>
        )}
      </div>
    )
  }

  // List View (Full-width rows)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
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

      {/* Question content */}
      <Link href={`/activities/${activityId}/questions/${question.id}`} className="block">
        <p className="text-gray-800 whitespace-pre-wrap hover:text-[var(--stanford-cardinal)] transition">
          {question.content}
        </p>
      </Link>

      {/* AI Evaluation */}
      {question.evaluation && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Bloom's level */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Bloom&apos;s:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBloomBadgeColor(question.evaluation.bloomsLevel)}`}>
                {getBloomLabel(question.evaluation.bloomsLevel)}
              </span>
            </div>

            {/* AI Score with detailed breakdown */}
            <div
              className="relative flex items-center gap-1.5"
              onMouseEnter={() => setShowScoreTooltip(true)}
              onMouseLeave={() => setShowScoreTooltip(false)}
            >
              <span className="text-xs text-gray-500">AI Score:</span>
              <span className={`text-sm font-medium ${getScoreColor(question.evaluation.overallScore)}`}>
                {formatAIScore(question.evaluation.overallScore)}
              </span>
              {showScoreTooltip && (
                <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                  <div className="font-medium mb-2">Score Breakdown</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>Clarity:</span>
                      <span className="font-medium">{formatAIScore(question.evaluation.clarityScore)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Relevance:</span>
                      <span className="font-medium">{formatAIScore(question.evaluation.relevanceScore)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Creativity:</span>
                      <span className="font-medium">{formatAIScore(question.evaluation.creativityScore)}</span>
                    </div>
                  </div>
                  <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

            {/* Peer Rating */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Peer:</span>
              <PeerRating questionId={question.id} initialRating={peerRating} />
            </div>

            {/* Total Score */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Total:</span>
              <span className="text-sm font-bold text-[var(--stanford-cardinal)]">
                {totalScore.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">(AI 50% + Peer 30% + Likes 20%)</span>
            </div>
          </div>

          {/* Feedback */}
          {question.evaluation.evaluationText && (
            <p className="mt-2 text-sm text-gray-600 italic line-clamp-2">
              {question.evaluation.evaluationText}
            </p>
          )}
        </div>
      )}

      {/* Stats footer */}
      <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <button
          onClick={() => setShowQuickResponse(!showQuickResponse)}
          className="flex items-center gap-1.5 hover:text-[var(--stanford-cardinal)] transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {question._count.responses} responses
        </button>
        <LikeButton
          questionId={question.id}
          initialLiked={isLiked}
          initialCount={question._count.likes}
        />
      </div>

      {/* Quick Response Input */}
      {showQuickResponse && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <QuickResponse
            questionId={question.id}
            activityId={activityId}
            onClose={() => setShowQuickResponse(false)}
          />
        </div>
      )}
    </div>
  )
}
