/**
 * Inquiry Mode Feature Module
 *
 * Provides functionality for the inquiry learning mode including
 * question generation, AI evaluation, and leaderboard tracking.
 */

// Types
export type {
  BloomsLevel,
  EvaluationStatus,
  SubmittedQuestion,
  EvaluationData,
  EnhancedQuestion,
  QuestionWithEvaluation,
  InquiryTakeClientProps,
  InquiryCompletionResult,
  LeaderboardEntry,
  InquiryStats,
  UserSummary,
  DimensionScores,
  DimensionName,
  ScoreQuality,
  BloomsDistribution,
} from './types'

export {
  BLOOMS_LEVELS,
  BLOOMS_LEVEL_VALUES,
  getScoreQuality,
} from './types'

// Utils
export {
  formatTime,
  getScoreColor,
  getScoreBgColor,
  getBloomsBadgeColor,
  getScoreQualityLabel,
  bloomsLevelToNumber,
  calculateAverageScore,
} from './utils'

// Hooks (to be added in WI-09, WI-10)
// export { useInquiryAttempt } from './hooks'
// export { useInquiryResults } from './hooks'

// Components (to be added in WI-02 through WI-08)
// export { BloomsBadge } from './components'
// export { QualityScoreDisplay } from './components'
// export { KeywordBadge, KeywordInput } from './components'
// export { QuestionSubmissionCard } from './components'
// export { InquiryProgress } from './components'
// export { InquiryResultCard } from './components'
