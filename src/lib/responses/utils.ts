import { AIEvaluationRatings, type AIEvaluationRating, type AIEvaluationStatus } from '@/types/responses'

/**
 * Get badge color classes for AI evaluation rating
 */
export function getAIEvaluationBadgeColor(rating: AIEvaluationRating | string | null): string {
  switch (rating) {
    case AIEvaluationRatings.THUMBS_UP:
    case 'excellent':
    case 'good':
      return 'bg-green-100 text-green-700'
    case AIEvaluationRatings.THUMBS_SIDEWAYS:
    case 'average':
    case 'needs_improvement':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * Get label for AI evaluation rating
 */
export function getAIEvaluationLabel(rating: AIEvaluationRating | string | null): string {
  switch (rating) {
    case AIEvaluationRatings.THUMBS_UP:
    case 'excellent':
    case 'good':
      return 'Excellent'
    case AIEvaluationRatings.THUMBS_SIDEWAYS:
    case 'average':
    case 'needs_improvement':
      return 'Good'
    default:
      return 'Pending'
  }
}

/**
 * Get status badge color
 */
export function getAIStatusBadgeColor(status: AIEvaluationStatus | string | null): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'error':
      return 'bg-red-100 text-red-700'
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * Check if user can edit a response (only creator)
 */
export function canEditResponse(
  currentUserId: string | undefined,
  responseCreatorId: string
): boolean {
  if (!currentUserId) return false
  return currentUserId === responseCreatorId
}

/**
 * Check if user can delete a response
 * - Response creator
 * - Question creator
 * - Activity creator
 * - Group creator (owner)
 */
export function canDeleteResponse(
  currentUserId: string | undefined,
  responseCreatorId: string,
  questionCreatorId?: string,
  activityCreatorId?: string,
  groupCreatorId?: string
): boolean {
  if (!currentUserId) return false

  return (
    currentUserId === responseCreatorId ||
    currentUserId === questionCreatorId ||
    currentUserId === activityCreatorId ||
    currentUserId === groupCreatorId
  )
}

/**
 * Format score as percentage
 */
export function formatAIScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '-'
  // Score is 0-10 in database
  return `${Math.round(score * 10)}%`
}

/**
 * Format relative time for responses
 */
export function formatResponseTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return then.toLocaleDateString()
}
