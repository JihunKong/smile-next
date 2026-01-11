import Queue from 'bull'

// Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

// Log Redis connection status
console.log(`[Bull Queue] Initializing with Redis URL: ${redisUrl ? 'configured' : 'using localhost'}`)

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

// Add error handlers to queues
responseEvaluationQueue.on('error', (error) => {
  console.error('[Bull Queue] Response evaluation queue error:', error)
})

responseEvaluationQueue.on('ready', () => {
  console.log('[Bull Queue] Response evaluation queue is ready')
})

evaluationQueue.on('error', (error) => {
  console.error('[Bull Queue] Evaluation queue error:', error)
})

evaluationQueue.on('ready', () => {
  console.log('[Bull Queue] Evaluation queue is ready')
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
  responseContent: string
  questionContent: string
  // Difficulty level for evaluation calibration (Flask-compatible)
  difficultyLevel?: 'basic' | 'intermediate' | 'professional'
  // Optional context fields (passed but not required for evaluation)
  activityId?: string
  userId?: string
  context?: {
    activityName: string
    groupName: string
  }
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
  console.log(`[Bull Queue] Adding question evaluation job for question ${data.questionId}`)
  try {
    const job = await evaluationQueue.add('evaluate-question', data, {
      priority: 1,
    })
    console.log(`[Bull Queue] Job ${job.id} added successfully for question ${data.questionId}`)
    return job
  } catch (error) {
    console.error(`[Bull Queue] Failed to add job for question ${data.questionId}:`, error)
    throw error
  }
}

/**
 * Add a response evaluation job
 */
export async function queueResponseEvaluation(data: ResponseEvaluationJob) {
  console.log(`[Bull Queue] Adding response evaluation job for response ${data.responseId}`)
  try {
    const job = await responseEvaluationQueue.add('evaluate-response', data, {
      priority: 2,
    })
    console.log(`[Bull Queue] Job ${job.id} added successfully for response ${data.responseId}`)
    return job
  } catch (error) {
    console.error(`[Bull Queue] Failed to add job for response ${data.responseId}:`, error)
    throw error
  }
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
