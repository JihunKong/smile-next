/**
 * Inquiry Mode Utilities
 *
 * Helper functions for inquiry mode calculations and formatting.
 */

import type { BloomsLevel, ScoreQuality } from '../types'

/**
 * Format seconds into "Xm Ys" string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

/**
 * Get text color class based on score
 */
export function getScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-500'
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get background color class based on score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 8) return 'bg-green-100'
  if (score >= 6) return 'bg-yellow-100'
  return 'bg-red-100'
}

/**
 * Get Tailwind classes for Bloom's level badge
 */
export function getBloomsBadgeColor(level: BloomsLevel | string | null): string {
  const colors: Record<string, string> = {
    remember: 'bg-gray-100 text-gray-700',
    understand: 'bg-blue-100 text-blue-700',
    apply: 'bg-green-100 text-green-700',
    analyze: 'bg-yellow-100 text-yellow-700',
    evaluate: 'bg-orange-100 text-orange-700',
    create: 'bg-purple-100 text-purple-700',
  }
  return colors[level?.toLowerCase() || ''] || 'bg-gray-100 text-gray-700'
}

/**
 * Get quality label based on score
 */
export function getScoreQualityLabel(score: number): string {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  return 'Needs Improvement'
}

/**
 * Get score quality type
 */
export function getScoreQuality(score: number): ScoreQuality {
  if (score >= 8) return 'excellent'
  if (score >= 6) return 'good'
  return 'needs_improvement'
}

/**
 * Convert Bloom's level to numeric value (1-6)
 */
export function bloomsLevelToNumber(level: BloomsLevel | string | null): number {
  const values: Record<string, number> = {
    remember: 1,
    understand: 2,
    apply: 3,
    analyze: 4,
    evaluate: 5,
    create: 6,
  }
  return values[level?.toLowerCase() || ''] || 0
}

/**
 * Calculate average score from array of numbers
 */
export function calculateAverageScore(scores: (number | null)[]): number {
  const validScores = scores.filter((s): s is number => s !== null)
  if (validScores.length === 0) return 0
  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length
}
