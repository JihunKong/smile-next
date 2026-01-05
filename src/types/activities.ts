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
