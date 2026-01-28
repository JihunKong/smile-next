/**
 * User Feature Types
 *
 * Type definitions for Settings & Profile features.
 * Extracted from existing pages for modular use.
 */

// ============================================================================
// User Profile Types
// ============================================================================

/**
 * Basic user profile information
 */
export interface UserProfile {
  firstName: string | null
  lastName: string | null
  username: string | null
  email: string
  avatarUrl?: string | null
}

/**
 * Account form data for updating profile
 */
export interface AccountFormData {
  firstName: string
  lastName: string
  username: string
}

/**
 * Password change form data
 */
export interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ============================================================================
// User Preferences Types
// ============================================================================

/**
 * Theme options
 */
export type ThemeOption = 'light' | 'dark' | 'system'

/**
 * Language options
 */
export type LanguageOption = 'ko' | 'en'

/**
 * Email frequency options
 */
export type EmailFrequencyOption = 'daily' | 'weekly' | 'never'

/**
 * Font size options
 */
export type FontSizeOption = 'small' | 'medium' | 'large'

/**
 * Items per page options
 */
export type ItemsPerPageOption = 10 | 25 | 50 | 100

/**
 * Additional user preference settings
 */
export interface AdditionalSettings {
  groupUpdates?: boolean
  activityReminders?: boolean
  questionResponses?: boolean
  showRealName?: boolean
  allowDirectMessages?: boolean
  itemsPerPage?: number
}

/**
 * User preferences configuration
 */
export interface UserPreferences {
  theme: ThemeOption
  language: LanguageOption
  emailDigest: boolean
  emailFrequency: EmailFrequencyOption
  showOnlineStatus: boolean
  showActivityStatus: boolean
  fontSize: FontSizeOption
  reduceMotion: boolean
  additionalSettings?: AdditionalSettings
}

/**
 * Notification settings state
 */
export interface NotificationSettings {
  emailNotifications: boolean
  groupUpdates: boolean
  activityReminders: boolean
  questionResponses: boolean
}

/**
 * Privacy settings state
 */
export interface PrivacySettings {
  profileVisible: boolean
  showRealName: boolean
  allowDirectMessages: boolean
}

// ============================================================================
// User Stats & Level Types
// ============================================================================

/**
 * Level tier information
 */
export interface LevelTier {
  name: string
  icon: string
  minPoints: number
  maxPoints: number | null
  color: string
  description: string
}

/**
 * Current level information
 */
export interface CurrentLevel {
  tier: LevelTier
  points: number
}

/**
 * Complete level progression info
 */
export interface LevelInfo {
  current: CurrentLevel
  next: LevelTier | null
  pointsToNext: number
  progressPercent: number
  allTiers: LevelTier[]
}

/**
 * Points breakdown by category
 */
export interface PointsBreakdown {
  questions: number
  highQuality: number
  responses: number
  exams: number
  certificates: number
  badges: number
  total: number
}

/**
 * User statistics
 */
export interface UserStats {
  totalQuestions: number
  totalActivities: number
  totalGroups: number
  totalPoints: number
  levelInfo?: {
    current?: {
      tier: {
        name: string
        icon: string
      }
    }
  }
  memberSince?: string
}

/**
 * Extended profile statistics (for SmileScoreTab)
 */
export interface ProfileStats {
  totalPoints: number
  pointsBreakdown: PointsBreakdown
  levelInfo: LevelInfo
}

/**
 * Group ranking information
 */
export interface GroupRanking {
  groupId: string
  groupName: string
  rank: number
  totalMembers: number
  questionsInGroup: number
  groupPoints: number
}

/**
 * Ranking data
 */
export interface RankingData {
  globalRank: number
  totalUsers: number
  percentile: number
  groupRankings: GroupRanking[]
}

// ============================================================================
// Badge & Achievement Types
// ============================================================================

/**
 * Badge level types
 */
export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum'

/**
 * Badge definition
 */
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  level: BadgeLevel
  points: number
  category: string
}

/**
 * Earned badge with metadata
 */
export interface EarnedBadge {
  id: string
  badge: Badge
  earnedAt: Date
  isFeatured: boolean
}

/**
 * Badge progress tracking
 */
export interface BadgeProgress {
  id: string
  name: string
  description: string
  icon: string
  current: number
  target: number
  category: string
}

/**
 * Badge data from API response
 */
export interface BadgeData {
  earnedBadges: Array<{ id: string }>
}

/**
 * User stats for achievements
 */
export interface AchievementUserStats {
  totalPoints: number
  level: number
  currentStreak: number
}

// ============================================================================
// Timeline Types
// ============================================================================

/**
 * Timeline event types
 */
export type TimelineEventType =
  | 'question'
  | 'response'
  | 'exam'
  | 'inquiry'
  | 'case'
  | 'badge'
  | 'group'
  | 'certificate'

/**
 * Timeline event
 */
export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description: string | null
  timestamp: Date
  icon: string
  color: string
  metadata?: Record<string, unknown>
}

/**
 * Grouped timeline events by date
 */
export interface GroupedEvents {
  [key: string]: TimelineEvent[]
}

/**
 * Timeline pagination info
 */
export interface TimelinePagination {
  page: number
  limit: number
  hasMore: boolean
  total?: number
}

// ============================================================================
// Settings Tab Types
// ============================================================================

/**
 * Settings tab identifiers
 */
export type SettingsTabId =
  | 'account'
  | 'password'
  | 'notifications'
  | 'privacy'
  | 'display'
  | 'danger'

/**
 * Settings tab configuration
 */
export interface SettingsTab {
  id: SettingsTabId
  label: string
  icon: string
}

// ============================================================================
// Profile Tab Types
// ============================================================================

/**
 * Profile tab identifiers
 */
export type ProfileTabId =
  | 'smile-score'
  | 'inquiry-journey'
  | 'career-directions'
  | 'strength-summary'
  | 'achievements'
  | 'stats'
  | 'activity'
  | 'settings'

/**
 * Profile tab configuration
 */
export interface ProfileTab {
  id: ProfileTabId
  label: string
  icon: React.ReactNode
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Profile API response
 */
export interface ProfileApiResponse {
  user: UserProfile
}

/**
 * Preferences API response
 */
export interface PreferencesApiResponse {
  success: boolean
  data: UserPreferences
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Settings form message state
 */
export interface FormMessage {
  type: 'success' | 'error'
  text: string
}

/**
 * Props for settings section components
 */
export interface SettingsSectionProps {
  className?: string
}

/**
 * Props for the embedded SettingsTab in profile page
 */
export interface ProfileSettingsTabProps {
  profile: UserProfile | null
}
