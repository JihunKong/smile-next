import { ActivityModes, type ActivityMode, type BloomLevel } from '@/types/activities'

/**
 * Get the display label for an activity mode
 */
export function getModeLabel(mode: ActivityMode): string {
  switch (mode) {
    case ActivityModes.OPEN:
      return 'Open Mode'
    case ActivityModes.EXAM:
      return 'Exam Mode'
    case ActivityModes.INQUIRY:
      return 'Inquiry Mode'
    case ActivityModes.CASE:
      return 'Case Mode'
    default:
      return 'Unknown'
  }
}

/**
 * Get badge color classes for activity mode
 */
export function getModeBadgeColor(mode: ActivityMode): string {
  switch (mode) {
    case ActivityModes.OPEN:
      return 'bg-green-100 text-green-800'
    case ActivityModes.EXAM:
      return 'bg-red-100 text-red-800'
    case ActivityModes.INQUIRY:
      return 'bg-blue-100 text-blue-800'
    case ActivityModes.CASE:
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get badge color classes for Bloom's taxonomy level
 */
export function getBloomBadgeColor(level: BloomLevel | string | null): string {
  switch (level?.toLowerCase()) {
    case 'remember':
      return 'bg-gray-100 text-gray-700'
    case 'understand':
      return 'bg-blue-100 text-blue-700'
    case 'apply':
      return 'bg-green-100 text-green-700'
    case 'analyze':
      return 'bg-yellow-100 text-yellow-700'
    case 'evaluate':
      return 'bg-orange-100 text-orange-700'
    case 'create':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * Get display label for Bloom's taxonomy level
 */
export function getBloomLabel(level: BloomLevel | string | null): string {
  if (!level) return 'Pending'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

/**
 * Get Bloom's level number (L1-L6) from level name
 * Flask-compatible format
 */
export function getBloomLevelNumber(level: BloomLevel | string | null): number {
  if (!level) return 0
  const levels: Record<string, number> = {
    'remember': 1,
    'understand': 2,
    'apply': 3,
    'analyze': 4,
    'evaluate': 5,
    'create': 6,
  }
  return levels[level.toLowerCase()] || 0
}

/**
 * Check if a user can manage an activity
 */
export function canManageActivity(
  userId: string | undefined,
  creatorId: string,
  groupCreatorId?: string
): boolean {
  if (!userId) return false
  return userId === creatorId || userId === groupCreatorId
}

/**
 * Check if user is a member of the group with sufficient role
 */
export function canCreateActivity(
  userRole: number | undefined,
  minRole: number = 2 // Default: ADMIN or higher
): boolean {
  if (userRole === undefined) return false
  return userRole >= minRole
}

/**
 * Format score as percentage or stars
 */
export function formatScore(score: number | null | undefined, type: 'percent' | 'stars' = 'percent'): string {
  if (score === null || score === undefined) return '-'

  if (type === 'stars') {
    const stars = Math.round(score * 5)
    return '★'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  return `${Math.round(score * 100)}%`
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-400'
  if (score >= 0.8) return 'text-green-600'
  if (score >= 0.6) return 'text-yellow-600'
  if (score >= 0.4) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
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
