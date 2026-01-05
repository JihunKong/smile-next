import Queue from 'bull'

// Redis connection options
const redisConfig = {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
}

// Queue options with retry logic
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
export const evaluationQueue = new Queue('question-evaluations', redisConfig, {
  defaultJobOptions,
})

/**
 * Response Evaluation Queue
 * Handles async AI evaluation of student responses
 */
export const responseEvaluationQueue = new Queue('response-evaluations', redisConfig, {
  defaultJobOptions,
})

/**
 * Email Queue
 * Handles async email sending
 */
export const emailQueue = new Queue('emails', redisConfig, {
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
  },
})

/**
 * Leaderboard Update Queue
 * Handles async leaderboard recalculations
 */
export const leaderboardQueue = new Queue('leaderboard-updates', redisConfig, {
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
    ragContext?: string
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
