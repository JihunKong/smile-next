import { Job } from 'bull'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/prisma'
import { evaluationQueue, EvaluationJob } from '../bull'

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
  evaluationText: string
  strengths: string[]
  improvements: string[]
  keywordsFound: string[]
  enhancedQuestions: string[]
}

const BLOOMS_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']

/**
 * Evaluate a question using Claude AI
 */
async function evaluateQuestion(job: EvaluationJob): Promise<BloomsEvaluationResult> {
  const { questionContent, context } = job

  const systemPrompt = `You are an expert in educational assessment and Bloom's Taxonomy.
Evaluate student-generated questions for their cognitive complexity, clarity, and educational value.

Bloom's Taxonomy Levels (from lowest to highest):
1. Remember - Recall facts and basic concepts
2. Understand - Explain ideas or concepts
3. Apply - Use information in new situations
4. Analyze - Draw connections among ideas
5. Evaluate - Justify a decision or course of action
6. Create - Produce new or original work

Always respond in JSON format.`

  const userPrompt = `Evaluate this student-generated question:

Question: "${questionContent}"

Context:
- Activity: ${context.activityName}
- Group: ${context.groupName}
- Subject: ${context.subject || 'Not specified'}
- Topic: ${context.topic || 'Not specified'}
- Education Level: ${context.educationLevel || 'Not specified'}
${context.ragContext ? `- Additional Context: ${context.ragContext}` : ''}

Provide a comprehensive evaluation in JSON format:
{
  "bloomsLevel": "one of: remember, understand, apply, analyze, evaluate, create",
  "bloomsConfidence": 0.0 to 1.0,
  "overallScore": 0.0 to 10.0,
  "creativityScore": 0.0 to 10.0,
  "clarityScore": 0.0 to 10.0,
  "relevanceScore": 0.0 to 10.0,
  "complexityScore": 0.0 to 10.0,
  "evaluationText": "Detailed feedback explaining the evaluation",
  "strengths": ["List of strengths in this question"],
  "improvements": ["Suggestions for improvement"],
  "keywordsFound": ["Key concepts/keywords found in the question"],
  "enhancedQuestions": ["2-3 improved versions of this question at higher Bloom's levels"]
}`

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
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

  return result
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
