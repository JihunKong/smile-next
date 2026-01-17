import { Job } from 'bull'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/prisma'
import { evaluationQueue, EvaluationJob } from '../bull'
import { buildInquiryEvaluationPrompt, buildTier2GuidancePrompt } from '@/lib/ai/prompts'

// Lazy initialization to avoid build-time errors
let anthropicClient: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    })
  }
  return anthropicClient
}

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
 * Extract and parse JSON from a potentially messy AI response
 */
function parseJsonFromResponse(text: string): unknown {
  // First try: direct JSON parse
  try {
    return JSON.parse(text)
  } catch {
    // Continue to other methods
  }

  // Second try: extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch {
      // Continue to other methods
    }
  }

  // Third try: find JSON object in the text
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/)
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0])
    } catch {
      // Continue to other methods
    }
  }

  // Fourth try: clean common issues and retry
  const cleaned = text
    .replace(/^\s*```\s*json?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    console.error('[parseJsonFromResponse] All parsing methods failed')
    console.error('[parseJsonFromResponse] Original text (first 500 chars):', text.slice(0, 500))
    throw new Error(`Failed to parse JSON from AI response: ${e instanceof Error ? e.message : String(e)}`)
  }
}

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

  const response = await getAnthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  // Extract and parse JSON from response using robust parser
  const result = parseJsonFromResponse(content.text) as BloomsEvaluationResult

  // Validate and normalize blooms level
  if (!result.bloomsLevel || !BLOOMS_LEVELS.includes(result.bloomsLevel.toLowerCase())) {
    result.bloomsLevel = 'remember'
  } else {
    result.bloomsLevel = result.bloomsLevel.toLowerCase()
  }

  // Ensure all numeric scores exist with defaults
  if (typeof result.overallScore !== 'number') result.overallScore = 5.0
  if (typeof result.bloomsConfidence !== 'number') result.bloomsConfidence = 0.7
  if (typeof result.creativityScore !== 'number') result.creativityScore = 5.0
  if (typeof result.clarityScore !== 'number') result.clarityScore = 5.0
  if (typeof result.relevanceScore !== 'number') result.relevanceScore = 5.0
  if (typeof result.complexityScore !== 'number') result.complexityScore = 5.0
  if (typeof result.innovationScore !== 'number') {
    result.innovationScore = result.complexityScore || 5.0
  }

  // Ensure arrays exist
  if (!Array.isArray(result.strengths)) result.strengths = []
  if (!Array.isArray(result.improvements)) result.improvements = []
  if (!Array.isArray(result.keywordsFound)) result.keywordsFound = []
  if (!Array.isArray(result.enhancedQuestions)) result.enhancedQuestions = []

  // Ensure evaluation text exists
  if (!result.evaluationText) result.evaluationText = 'Evaluation completed.'

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

  const response = await getAnthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  // Extract and parse JSON from response using robust parser
  return parseJsonFromResponse(content.text) as Tier2Guidance
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
