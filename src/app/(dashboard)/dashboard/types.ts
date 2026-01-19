/**
 * Dashboard Types
 *
 * Foundational TypeScript interfaces for the dashboard page.
 * Extracted as part of VIBE-0003 refactoring.
 */

// ============================================================================
// Tier & Level Types
// ============================================================================

export interface TierInfo {
  name: string
  minPoints: number
  maxPoints: number
  color: string
  icon: string
  description: string
}

export interface CurrentTierInfo {
  tier: TierInfo
  progress_percentage: number
}

export interface LevelInfo {
  current: CurrentTierInfo
  points_to_next: number
  is_max_tier: boolean
}

// ============================================================================
// Activity Types
// ============================================================================

export interface ProcessedActivity {
  id: string
  title: string
  subtitle: string
  timestamp: Date
  icon: string
  color: string
  badge_progress: boolean | null
}

// ============================================================================
// Certificate Types
// ============================================================================

export type CertificateActivityStatus = 'not_started' | 'in_progress' | 'passed' | 'failed'

export interface CertificateActivity {
  activity_id: string
  activity_name: string
  required: boolean
  status: CertificateActivityStatus
}

export interface ProcessedCertificate {
  id: string
  name: string
  status: 'completed' | 'in_progress'
  enrollment_date: Date
  completion_date: Date | null
  progress_percentage: number
  activities: CertificateActivity[]
}

// ============================================================================
// User Stats Types
// ============================================================================

export interface UserStats {
  total_questions: number
  questions_this_week: number
  week_change: number
  quality_score: number
  day_streak: number
  total_badge_points: number
  badges_earned: number
  badge_names: string[]
  level_info: LevelInfo
  total_groups: number
  activities: ProcessedActivity[]
  user_certificates: ProcessedCertificate[]
  error?: string
}
