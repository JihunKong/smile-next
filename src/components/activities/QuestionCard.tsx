import { getBloomBadgeColor, getBloomLabel, formatScore, getScoreColor, formatRelativeTime } from '@/lib/activities/utils'
import type { QuestionWithEvaluation } from '@/types/activities'

interface QuestionCardProps {
  question: QuestionWithEvaluation
  showActions?: boolean
  currentUserId?: string
  activityCreatorId?: string
  groupCreatorId?: string
  onDelete?: (questionId: string) => void
}

export function QuestionCard({
  question,
  showActions = false,
  currentUserId,
  activityCreatorId,
  groupCreatorId,
  onDelete,
}: QuestionCardProps) {
  const canDelete =
    currentUserId === question.creatorId ||
    currentUserId === activityCreatorId ||
    currentUserId === groupCreatorId

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
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
            onClick={() => onDelete(question.id)}
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
      <p className="text-gray-800 whitespace-pre-wrap">{question.content}</p>

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
                {formatScore(question.evaluation.overallScore)}
              </span>
            </div>

            {/* Sub-scores */}
            {question.evaluation.clarityScore !== null && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                <span>Clarity: {formatScore(question.evaluation.clarityScore)}</span>
                <span className="text-gray-300">|</span>
                <span>Relevance: {formatScore(question.evaluation.relevanceScore)}</span>
              </div>
            )}
          </div>

          {/* Feedback */}
          {question.evaluation.evaluationText && (
            <p className="mt-2 text-sm text-gray-600 italic">
              {question.evaluation.evaluationText}
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {question._count.responses} responses
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {question._count.likes} likes
        </span>
      </div>
    </div>
  )
}
