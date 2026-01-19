/**
 * Tier Utilities
 *
 * Functions for calculating user tier information from badge points.
 * Uses the Flask 6-tier system from levelService.
 * Extracted as part of VIBE-0003 refactoring.
 */

import { TIERS } from '@/lib/services/levelService'
import type { TierInfo, LevelInfo } from '../types'

/**
 * Array of tiers derived from TIERS object, ordered by minPoints.
 * Used for tier calculation and display.
 */
export const TIERS_ARRAY: TierInfo[] = Object.values(TIERS).map(tier => ({
  name: tier.name,
  minPoints: tier.pointRange[0],
  maxPoints: tier.pointRange[1],
  color: tier.color,
  icon: tier.icon,
  description: tier.description,
}))

/**
 * Calculate tier information from total badge points.
 *
 * @param points - Total badge points
 * @returns LevelInfo with current tier, progress, and points to next tier
 *
 * @example
 * const info = getTierInfo(2500)
 * // Returns:
 * // {
 * //   current: { tier: { name: 'SMILE Starter', ... }, progress_percentage: 50 },
 * //   points_to_next: 2500,
 * //   is_max_tier: false,
 * // }
 */
export function getTierInfo(points: number): LevelInfo {
  let currentTier = TIERS_ARRAY[0]
  let nextTier: TierInfo | null = TIERS_ARRAY[1]

  // Find the current tier by iterating from highest to lowest
  for (let i = TIERS_ARRAY.length - 1; i >= 0; i--) {
    if (points >= TIERS_ARRAY[i].minPoints) {
      currentTier = TIERS_ARRAY[i]
      nextTier = TIERS_ARRAY[i + 1] || null
      break
    }
  }

  const isMaxTier = !nextTier
  const pointsToNext = nextTier ? nextTier.minPoints - points : 0
  const progressPercentage = nextTier
    ? ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100

  return {
    current: { tier: currentTier, progress_percentage: progressPercentage },
    points_to_next: pointsToNext,
    is_max_tier: isMaxTier,
  }
}
