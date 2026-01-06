import { Job } from 'bull'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/prisma'
import { evaluationQueue, EvaluationJob } from '../bull'
import { buildInquiryEvaluationPrompt, buildTier2GuidancePrompt } from '@/lib/ai/prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface BloomsEvaluationResult {
  bloomsLevel: string
  bloomsConfidence: number
  overallScore: number
  creativityScore: number
  clarityScore: number
  relevanceScore: number
  complexityScore: number
  innovationScore: number
  evaluationText: string
  strengths: string[]
  improvements: string[]
  keywordsFound: string[]
  enhancedQuestions: Array<{ level: string; question: string }> | string[]
  pedagogicalNotes?: string
  nextLevelGuidance?: string
}

interface Tier2Guidance {
  currentLevelExplanation: string
  cognitiveGapAnalysis: string
  transformationStrategies: Array<{ strategy: string; example: string }>
  scaffoldedPath: Array<{ level: string; question: string; thinkingRequired: string }>
  teacherTips: string[]
  resourceSuggestions: string[]
}

const BLOOMS_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']

/**
 * Evaluate a question using Claude AI with comprehensive Flask-style prompts
 */
async function evaluateQuestion(job: EvaluationJob): Promise<BloomsEvaluationResult> {
  const { questionContent, context } = job

  // Build comprehensive prompt using Flask-style prompt builder
  const { system: systemPrompt, user: userPrompt } = buildInquiryEvaluationPrompt({
    questionContent,
    activityName: context.activityName,
    groupName: context.groupName,
    subject: context.subject,
    topic: context.topic,
    educationLevel: context.educationLevel,
    targetAudience: context.targetAudience,
    ragContext: context.ragContext,
    prompterKeywords: context.prompterKeywords,
    previousQuestions: context.previousQuestions,
    attemptNumber: context.attemptNumber,
    questionsRequired: context.questionsRequired,
  })

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  // Extract JSON from response
  let jsonText = content.text
  const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1]
  }

  const result = JSON.parse(jsonText) as BloomsEvaluationResult

  // Validate blooms level
  if (!BLOOMS_LEVELS.includes(result.bloomsLevel.toLowerCase())) {
    result.bloomsLevel = 'remember'
  } else {
    result.bloomsLevel = result.bloomsLevel.toLowerCase()
  }

  // Ensure innovationScore exists (new field)
  if (typeof result.innovationScore !== 'number') {
    result.innovationScore = result.complexityScore || 5
  }

  return result
}

/**
 * Generate Tier 2 Bloom's guidance for helping students improve
 */
async function generateTier2Guidance(
  question: string,
  currentLevel: string,
  context: { subject?: string; educationLevel?: string }
): Promise<Tier2Guidance> {
  const { system: systemPrompt, user: userPrompt } = buildTier2GuidancePrompt({
    question,
    currentLevel,
    subject: context.subject,
    educationLevel: context.educationLevel,
  })

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  let jsonText = content.text
  const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1]
  }

  return JSON.parse(jsonText) as Tier2Guidance
}

/**
 * Process question evaluation job
 */
async function processEvaluationJob(job: Job<EvaluationJob>): Promise<void> {
  const startTime = Date.now()
  const { questionId, activityId } = job.data

  console.log(`[EvaluationWorker] Processing question ${questionId}`)

  try {
    // Check if question still exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, questionEvaluationId: true },
    })

    if (!question) {
      console.log(`[EvaluationWorker] Question ${questionId} not found, skipping`)
      return
    }

    // Evaluate the question
    const evaluation = await evaluateQuestion(job.data)
    const processingTime = Date.now() - startTime

    // Create or update question evaluation
    const evaluationRecord = await prisma.questionEvaluation.upsert({
      where: {
        id: question.questionEvaluationId || 'new-evaluation',
      },
      create: {
        questionId,
        activityId,
        aiModel: 'claude-sonnet-4-5-20250929',
        evaluationType: 'inquiry',
        bloomsLevel: evaluation.bloomsLevel,
        bloomsConfidence: evaluation.bloomsConfidence,
        overallScore: evaluation.overallScore,
        creativityScore: evaluation.creativityScore,
        clarityScore: evaluation.clarityScore,
        relevanceScore: evaluation.relevanceScore,
        complexityScore: evaluation.complexityScore,
        evaluationText: evaluation.evaluationText,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        keywordsFound: evaluation.keywordsFound,
        enhancedQuestions: evaluation.enhancedQuestions,
        processingTimeMs: processingTime,
        evaluationStatus: 'completed',
      },
      update: {
        aiModel: 'claude-sonnet-4-5-20250929',
        bloomsLevel: evaluation.bloomsLevel,
        bloomsConfidence: evaluation.bloomsConfidence,
        overallScore: evaluation.overallScore,
        creativityScore: evaluation.creativityScore,
        clarityScore: evaluation.clarityScore,
        relevanceScore: evaluation.relevanceScore,
        complexityScore: evaluation.complexityScore,
        evaluationText: evaluation.evaluationText,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        keywordsFound: evaluation.keywordsFound,
        enhancedQuestions: evaluation.enhancedQuestions,
        processingTimeMs: processingTime,
        evaluationStatus: 'completed',
      },
    })

    // Update question with evaluation reference and score
    await prisma.question.update({
      where: { id: questionId },
      data: {
        questionEvaluationId: evaluationRecord.id,
        questionEvaluationScore: evaluation.overallScore,
      },
    })

    console.log(
      `[EvaluationWorker] Completed evaluation for question ${questionId}. ` +
        `Bloom's: ${evaluation.bloomsLevel}, Score: ${evaluation.overallScore}`
    )
  } catch (error) {
    console.error(`[EvaluationWorker] Failed to evaluate question ${questionId}:`, error)
    throw error // Will trigger retry
  }
}

/**
 * Start the evaluation worker
 */
export function startEvaluationWorker(): void {
  evaluationQueue.process('evaluate-question', 3, processEvaluationJob)

  evaluationQueue.on('completed', (job) => {
    console.log(`[EvaluationWorker] Job ${job.id} completed`)
  })

  evaluationQueue.on('failed', (job, err) => {
    console.error(`[EvaluationWorker] Job ${job.id} failed:`, err.message)
  })

  evaluationQueue.on('stalled', (job) => {
    console.warn(`[EvaluationWorker] Job ${job.id} stalled`)
  })

  console.log('[EvaluationWorker] Started and listening for jobs')
}

export default { startEvaluationWorker, processEvaluationJob }
