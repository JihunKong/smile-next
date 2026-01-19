// Activity Edit Types
// Extracted from page.tsx for modular architecture

export interface OpenModeSettings {
  is_pass_fail_enabled?: boolean
  required_question_count?: number
  required_avg_level?: number
  required_avg_score?: number
  peer_ratings_required?: number
  peer_responses_required?: number
  instructions?: string
}

export interface ExamSettings {
  time_limit_minutes?: number
  passing_threshold?: number
  max_attempts?: number
  allow_reattempts?: boolean
  show_feedback?: boolean
  show_leaderboard?: boolean
  anonymize_leaderboard?: boolean
  randomize_questions?: boolean
  randomize_answer_choices?: boolean
  exam_question_count?: number
  is_published?: boolean
  instructions?: string
}

export interface InquirySettings {
  show_leaderboard?: boolean
  allow_hints?: boolean
  max_hints?: number
  is_published?: boolean
}

export interface ActivityData {
  id: string
  name: string
  description: string | null
  activityType: string
  mode: number
  level: string | null
  visible: boolean
  educationLevel: string | null
  schoolSubject: string | null
  topic: string | null
  hideUsernames: boolean
  isAnonymousAuthorAllowed: boolean
  openModeSettings: OpenModeSettings | null
  examSettings: ExamSettings | null
  inquirySettings: InquirySettings | null
  owningGroup: {
    id: string
    name: string
  }
  hasQuestions: boolean
  hasAttempts: boolean
}

export const modeLabels: Record<number, string> = {
  0: 'Open Mode',
  1: 'Exam Mode',
  2: 'Inquiry Mode',
  3: 'Case Mode',
}

// Form state types for the hook
export interface BasicInfoState {
  name: string
  description: string
  level: string
  visible: boolean
  educationLevel: string
  schoolSubject: string
  topic: string
  hideUsernames: boolean
  isAnonymousAuthorAllowed: boolean
}

export interface ExamFormState {
  timeLimitMinutes: number
  passingThreshold: number
  maxAttempts: number
  allowReattempts: boolean
  showFeedback: boolean
  showLeaderboard: boolean
  anonymizeLeaderboard: boolean
  randomizeQuestions: boolean
  randomizeAnswerChoices: boolean
  examQuestionCount: number
  isPublished: boolean
  examInstructions: string
  examStartDate: string
  examEndDate: string
  questionPoolSize: number
}

export interface InquiryFormState {
  inquiryShowLeaderboard: boolean
  allowHints: boolean
  maxHints: number
  inquiryIsPublished: boolean
  inquiryTheme: string
  referenceDocument: string
  minWordCount: number
  maxWordCount: number
  qualityThreshold: number
  inquiryMaxAttempts: number
}

export interface OpenModeFormState {
  isPassFailEnabled: boolean
  requiredQuestionCount: number
  requiredAvgLevel: number
  requiredAvgScore: number
  peerRatingsRequired: number
  peerResponsesRequired: number
  openModeInstructions: string
}
