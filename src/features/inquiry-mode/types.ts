/**
 * Inquiry Mode Types
 *
 * Type definitions for the inquiry learning mode, including
 * question submission, evaluation, leaderboard, and results.
 */

// Bloom's Taxonomy Levels
export type BloomsLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create'

export const BLOOMS_LEVELS: BloomsLevel[] = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
]

export const BLOOMS_LEVEL_VALUES: Record<BloomsLevel, number> = {
  remember: 1,
  understand: 2,
  apply: 3,
  analyze: 4,
  evaluate: 5,
  create: 6,
}

// Question Submission & Evaluation
export type EvaluationStatus = 'pending' | 'evaluating' | 'completed' | 'error'

export interface SubmittedQuestion {
  id: string
  content: string
  score: number | null
  bloomsLevel: BloomsLevel | string | null
  feedback: string | null
  evaluationStatus?: EvaluationStatus
}

export interface EvaluationData {
  overallScore: number
  creativityScore: number | null
  clarityScore: number | null
  relevanceScore: number | null
  innovationScore: number | null
  complexityScore: number | null
  bloomsLevel: BloomsLevel | string | null
  evaluationText: string | null
  strengths: string[]
  improvements: string[]
  enhancedQuestions: EnhancedQuestion[] | string[]
  nextLevelGuidance?: string
}

export interface EnhancedQuestion {
  level: string
  question: string
}

export interface QuestionWithEvaluation {
  id: string
  content: string
  createdAt: Date
  evaluation: EvaluationData | null
}

// Inquiry Take Props
export interface InquiryTakeClientProps {
  activityId: string
  activityName: string
  attemptId: string
  questionsRequired: number
  timePerQuestion: number
  keywordPool1: string[]
  keywordPool2: string[]
  passThreshold: number
  submittedQuestions: SubmittedQuestion[]
}

// Completion Results
export interface InquiryCompletionResult {
  passed: boolean
  averageScore: number
  questionsGenerated: number
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  qualityScore: number
  qualityPercentage: number
  passed: boolean
  questionsGenerated: number
  questionsRequired: number
  avgBloomLevel: number
  timeTaken: string
  attemptNumber: number
  submittedAt: Date | null
  filterType: 'best' | 'recent' | 'both'
}

export interface InquiryStats {
  totalAttempts: number
  uniqueStudents: number
  averageScore: number
  passRate: number
}

export interface UserSummary {
  bestScore: number
  totalAttempts: number
  passRate: number
  rank: number
}

// Dimension Scores for Results
export interface DimensionScores {
  creativity: number
  clarity: number
  relevance: number
  innovation: number
  complexity: number
}

export type DimensionName = keyof DimensionScores

// Score Quality Classification
export type ScoreQuality = 'excellent' | 'good' | 'needs_improvement'

export function getScoreQuality(score: number): ScoreQuality {
  if (score >= 8) return 'excellent'
  if (score >= 6) return 'good'
  return 'needs_improvement'
}

// Blooms Distribution for Results
export type BloomsDistribution = Record<string, number>
