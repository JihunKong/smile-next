import Queue from 'bull'

// Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Default job options with retry logic
const defaultJobOptions: Queue.JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 60000, // 1 minute initial delay
  },
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50, // Keep last 50 failed jobs
}

/**
 * Question Evaluation Queue
 * Handles async AI evaluation of student questions
 */
export const evaluationQueue = new Queue('question-evaluations', redisUrl, {
  defaultJobOptions,
})

/**
 * Response Evaluation Queue
 * Handles async AI evaluation of student responses
 */
export const responseEvaluationQueue = new Queue('response-evaluations', redisUrl, {
  defaultJobOptions,
})

/**
 * Email Queue
 * Handles async email sending
 */
export const emailQueue = new Queue('emails', redisUrl, {
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
  },
})

/**
 * Leaderboard Update Queue
 * Handles async leaderboard recalculations
 */
export const leaderboardQueue = new Queue('leaderboard-updates', redisUrl, {
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
  },
})

// Job type definitions
export interface EvaluationJob {
  questionId: string
  activityId: string
  userId: string
  questionContent: string
  context: {
    activityName: string
    groupName: string
    educationLevel?: string
    subject?: string
    topic?: string
    targetAudience?: string
    ragContext?: string
    prompterKeywords?: string[]
    previousQuestions?: string[]
    attemptNumber?: number
    questionsRequired?: number
  }
}

export interface ResponseEvaluationJob {
  responseId: string
  questionId: string
  responseContent: string
  questionContent: string
}

export interface EmailJob {
  to: string
  subject: string
  template: string
  data: Record<string, unknown>
}

export interface LeaderboardJob {
  activityId: string
  userId: string
  action: 'question_created' | 'response_created' | 'score_updated'
  score?: number
}

/**
 * Add a question evaluation job
 */
export async function queueQuestionEvaluation(data: EvaluationJob) {
  return evaluationQueue.add('evaluate-question', data, {
    priority: 1,
  })
}

/**
 * Add a response evaluation job
 */
export async function queueResponseEvaluation(data: ResponseEvaluationJob) {
  return responseEvaluationQueue.add('evaluate-response', data, {
    priority: 2,
  })
}

/**
 * Add an email job
 */
export async function queueEmail(data: EmailJob) {
  return emailQueue.add('send-email', data, {
    priority: 3,
  })
}

/**
 * Add a leaderboard update job
 */
export async function queueLeaderboardUpdate(data: LeaderboardJob) {
  return leaderboardQueue.add('update-leaderboard', data, {
    priority: 2,
  })
}

export default {
  evaluationQueue,
  responseEvaluationQueue,
  emailQueue,
  leaderboardQueue,
}
