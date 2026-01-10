import type { Response, User } from '@prisma/client'

// AI Evaluation Types
export const AIEvaluationStatuses = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const

export type AIEvaluationStatus = (typeof AIEvaluationStatuses)[keyof typeof AIEvaluationStatuses]

export const AIEvaluationRatings = {
  THUMBS_UP: 'thumbs_up',
  THUMBS_SIDEWAYS: 'thumbs_sideways',
  THUMBS_DOWN: 'thumbs_down',
} as const

export type AIEvaluationRating = (typeof AIEvaluationRatings)[keyof typeof AIEvaluationRatings]

// User subset for display
export interface ResponseUserBasic {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
  avatarUrl: string | null
}

// Response with creator relation
export interface ResponseWithCreator extends Response {
  creator: ResponseUserBasic
}

// Action Results
export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export interface CreateResponseResult extends ActionResult<{ responseId: string }> {}
export interface UpdateResponseResult extends ActionResult {}
export interface DeleteResponseResult extends ActionResult {}
export interface ToggleLikeResult extends ActionResult<{ liked: boolean; count: number }> {}

// Form Data
export interface CreateResponseFormData {
  content: string
  questionId: string
  isAnonymous?: boolean
}

export interface UpdateResponseFormData {
  content: string
}

// Question with responses and likes
export interface QuestionWithResponses {
  id: string
  content: string
  creatorId: string
  activityId: string
  isAnonymous: boolean
  createdAt: Date
  creator: ResponseUserBasic
  evaluation: {
    id: string
    bloomsLevel: string | null
    overallScore: number
    clarityScore: number | null
    relevanceScore: number | null
    creativityScore: number | null
    evaluationText: string | null
  } | null
  responses: ResponseWithCreator[]
  likes: { id: string }[]
  _count: {
    responses: number
    likes: number
  }
  activity: {
    id: string
    name: string
    creatorId: string
    isAnonymousAuthorAllowed: boolean
    owningGroupId: string
    owningGroup: {
      id: string
      name: string
      creatorId: string
    }
  }
}
