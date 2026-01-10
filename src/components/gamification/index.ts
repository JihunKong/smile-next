/**
 * Gamification UI Components
 *
 * A comprehensive set of reusable components for gamification features
 * in the SMILE application. Uses Stanford Cardinal (#8C1515) as primary accent.
 *
 * Components:
 * - LevelBadge: Display user level with icon and optional name
 * - LevelProgress: Progress bar showing XP to next level
 * - RankingCard: Display user ranking with percentile
 * - GroupRanking: List of group rankings
 * - BadgeGrid: Grid display of badges (earned and locked)
 * - BadgeModal: Modal for detailed badge view
 * - FeaturedBadges: Display 3 featured badges with edit option
 * - PointsDisplay: Large points display with optional breakdown
 */

// Level System
export { default as LevelBadge, LEVEL_CONFIGS } from './LevelBadge'
export type { LevelBadgeProps, LevelConfig } from './LevelBadge'

export { default as LevelProgress, DEFAULT_THRESHOLDS } from './LevelProgress'
export type { LevelProgressProps } from './LevelProgress'

// Ranking System
export { default as RankingCard, getOrdinalSuffix, getRankTier } from './RankingCard'
export type { RankingCardProps } from './RankingCard'

export { default as GroupRanking } from './GroupRanking'
export type { GroupRankingProps, GroupRankingItem } from './GroupRanking'

// Badge System
export { default as BadgeGrid } from './BadgeGrid'
export type { BadgeGridProps, Badge, BadgeType } from './BadgeGrid'

export { default as BadgeModal } from './BadgeModal'
export type { BadgeModalProps } from './BadgeModal'

export { default as FeaturedBadges } from './FeaturedBadges'
export type { FeaturedBadgesProps } from './FeaturedBadges'

// Points Display
export { default as PointsDisplay } from './PointsDisplay'
export type { PointsDisplayProps, PointsBreakdownItem } from './PointsDisplay'
