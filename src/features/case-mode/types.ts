// Case Mode Types
// Consolidated type definitions for all Case Mode pages
// Re-export existing types from activities for convenience

export type { CaseScenario, CaseSettings } from '@/types/activities'

// ============================================================================
// Scenario Types (used in configure and review pages)
// ============================================================================

/**
 * Expected flaw that students should identify in a case scenario
 */
export interface ExpectedFlaw {
  flaw: string
  explanation: string
  severity: string
}

/**
 * Expected solution for a case scenario
 */
export interface ExpectedSolution {
  solution: string
  details: string
  implementation: string
}

/**
 * Detailed scenario with expected answers (used in review page)
 * This extends the basic CaseScenario with additional AI-evaluation fields
 */
export interface DetailedScenario {
  id: string
  scenario_number: number
  title: string
  domain: string
  innovation_name?: string
  scenario_content: string
  expected_flaws: ExpectedFlaw[]
  expected_solutions: ExpectedSolution[]
  is_active: boolean
  created_by_ai: boolean
  edited_by_creator: boolean
}

// ============================================================================
// Response & Evaluation Types (used in take and results pages)
// ============================================================================

/**
 * Student's response to a case scenario
 */
export interface ScenarioResponse {
  issues: string
  solution: string
}

/**
 * AI evaluation of a student's response to a case scenario
 */
export interface ScenarioEvaluation {
  score: number
  feedback: string
  understanding: number
  ingenuity: number
  criticalThinking: number
  realWorldApplication: number
  strengths?: string[]
  improvements?: string[]
}

// ============================================================================
// Leaderboard Types
// ============================================================================

/**
 * Entry in the case mode leaderboard
 */
export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  qualityScore: number
  qualityPercentage: number
  passed: boolean
  numCasesShown: number
  timeTaken: string
  attemptNumber: number
  submittedAt: Date | null
  filterType: 'best' | 'recent' | 'both'
}

/**
 * Statistics for the case mode leaderboard
 */
export interface LeaderboardStats {
  totalAttempts: number
  uniqueStudents: number
  averageScore: number
  passRate: number
}

/**
 * Summary of a user's performance in case mode
 */
export interface UserSummary {
  bestScore: number
  totalAttempts: number
  passRate: number
  rank: number
}

// ============================================================================
// Review/Configure Page Types
// ============================================================================

/**
 * Warning from fact-checking AI about potential issues in a scenario
 */
export interface FactCheckWarning {
  scenario_number: number
  claim: string
  issue: string
  suggested_correction: string
  severity: 'high' | 'medium' | 'low'
}

/**
 * Basic activity information for display
 */
export interface ActivityInfo {
  id: string
  name: string
  description?: string | null
  owningGroup?: {
    id: string
    name: string
  }
}

/**
 * Case configuration settings (subset used in review page)
 */
export interface CaseConfiguration {
  difficulty_level: string
  num_cases_to_show: number
  max_attempts: number
  pass_threshold: number
}
