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

// Hooks
export { useInquiryAttempt } from './hooks'
export { useInquiryResults } from './hooks'

// Core Components
export { BloomsBadge } from './components'
export { QualityScoreDisplay } from './components'
export { KeywordBadge, KeywordPool } from './components'
export { QuestionSubmissionCard } from './components'
export { InquiryProgress } from './components'
export { InquiryResultCard } from './components'
export { DimensionScoreGrid } from './components'

// Take Page Components
export { InquiryTakeHeader } from './components'
export { KeywordPools } from './components'
export { QuestionInput } from './components'
export { SubmittedQuestionsList } from './components'
export { CompletionPrompt } from './components'
export { InquiryCompletionModal } from './components'

// Leaderboard Components
export { LeaderboardHeader } from './components'
export { PassingCriteriaInfo } from './components'
export { LeaderboardStats } from './components'
export { LeaderboardTable } from './components'
export { UserPerformanceCard } from './components'

// Results Page Components
export { ResultsHeader } from './components'
export { OverallScoreCard } from './components'
export { BloomsDistributionCard } from './components'
export { QuestionResultsList } from './components'
export { ResultsActionButtons } from './components'
