import type { Activity, Question, QuestionEvaluation, User, Group } from '@prisma/client'

// Activity Modes
export const ActivityModes = {
  OPEN: 0,
  EXAM: 1,
  INQUIRY: 2,
  CASE: 3,
} as const

export type ActivityMode = (typeof ActivityModes)[keyof typeof ActivityModes]

// Bloom's Taxonomy Levels
export const BloomLevels = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const

export type BloomLevel = (typeof BloomLevels)[number]

// Action Results
export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export interface CreateActivityResult extends ActionResult<{ activityId: string }> {}
export interface CreateQuestionResult extends ActionResult<{ questionId: string }> {}

// User subset for display
export interface UserBasic {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  avatarUrl: string | null
}

// Group subset for display
export interface GroupBasic {
  id: string
  name: string
  creatorId: string
}

// Question Evaluation subset
export interface EvaluationBasic {
  id: string
  bloomsLevel: string | null
  overallScore: number
  clarityScore: number | null
  relevanceScore: number | null
  creativityScore: number | null
  evaluationText: string | null
}

// Activity with relations
export interface ActivityWithGroup extends Activity {
  creator: UserBasic
  owningGroup: GroupBasic
  _count: {
    questions: number
  }
}

// Question with relations
export interface QuestionWithEvaluation extends Question {
  creator: UserBasic
  evaluation: EvaluationBasic | null
  _count: {
    responses: number
    likes: number
  }
}

// Full activity detail with questions
export interface ActivityDetail extends Activity {
  creator: UserBasic
  owningGroup: GroupBasic & {
    members: Array<{
      userId: string
      role: number
    }>
  }
  questions: QuestionWithEvaluation[]
  _count: {
    questions: number
  }
}

// Create activity form data
export interface CreateActivityFormData {
  name: string
  description?: string
  groupId: string
  mode?: ActivityMode
  aiRatingEnabled?: boolean
  isAnonymousAuthorAllowed?: boolean
  hideUsernames?: boolean
}

// Create question form data
export interface CreateQuestionFormData {
  content: string
  activityId: string
  isAnonymous?: boolean
}

// ============================================================================
// Learning Mode Settings
// ============================================================================

// Exam Mode Settings
export interface ExamSettings {
  timeLimit: number // in minutes
  questionsToShow: number
  passThreshold: number // percentage (0-100)
  shuffleQuestions: boolean
  shuffleChoices: boolean
  maxAttempts: number
}

export const defaultExamSettings: ExamSettings = {
  timeLimit: 30,
  questionsToShow: 10,
  passThreshold: 60,
  shuffleQuestions: true,
  shuffleChoices: true,
  maxAttempts: 1,
}

// Inquiry Mode Settings
export interface InquirySettings {
  questionsRequired: number
  timePerQuestion: number // in seconds
  keywordPool1: string[]
  keywordPool2: string[]
  passThreshold: number // score 0-10
}

export const defaultInquirySettings: InquirySettings = {
  questionsRequired: 5,
  timePerQuestion: 240, // 4 minutes
  keywordPool1: [],
  keywordPool2: [],
  passThreshold: 6.0,
}

// Case Mode Settings
export interface CaseScenario {
  id: string
  title: string
  content: string
  domain?: string // e.g., "Technology", "Finance", "Healthcare"
  innovationName?: string // For Flask compatibility
}

export interface CaseSettings {
  scenarios: CaseScenario[]
  timePerCase: number // in minutes
  totalTimeLimit: number // in minutes
  maxAttempts: number
  passThreshold: number // score 0-10
  instructions?: string // Teacher's custom instructions (Flask compatibility)
}

export const defaultCaseSettings: CaseSettings = {
  scenarios: [],
  timePerCase: 10,
  totalTimeLimit: 60,
  maxAttempts: 1,
  passThreshold: 6.0,
  instructions: '',
}

// Mode metadata for UI
export interface ModeInfo {
  id: ActivityMode
  name: string
  description: string
  icon: string
  color: string
}

export const modeInfoList: ModeInfo[] = [
  {
    id: ActivityModes.OPEN,
    name: 'Open Mode',
    description: 'Free discussion and question posting',
    icon: 'chat',
    color: 'blue',
  },
  {
    id: ActivityModes.EXAM,
    name: 'Exam Mode',
    description: 'Timed multiple choice assessment',
    icon: 'clipboard',
    color: 'red',
  },
  {
    id: ActivityModes.INQUIRY,
    name: 'Inquiry Mode',
    description: 'Generate questions using keyword pairs',
    icon: 'lightbulb',
    color: 'yellow',
  },
  {
    id: ActivityModes.CASE,
    name: 'Case Study',
    description: 'Analyze business scenarios',
    icon: 'briefcase',
    color: 'green',
  },
]

// Attempt result types
export interface ExamAttemptResult {
  attemptId: string
  score: number
  passed: boolean
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
}

export interface InquiryAttemptResult {
  attemptId: string
  questionsGenerated: number
  averageScore: number
  passed: boolean
  evaluations: Array<{
    questionId: string
    score: number
    bloomsLevel: string
  }>
}

export interface CaseAttemptResult {
  attemptId: string
  totalScore: number
  passed: boolean
  scenarioScores: Array<{
    scenarioId: string
    score: number
    feedback: string
  }>
}
