import { Job } from 'bull'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/prisma'
import { responseEvaluationQueue, ResponseEvaluationJob } from '../bull'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface CaseEvaluationResult {
  overallScore: number
  problemIdentificationScore: number
  solutionQualityScore: number
  clarityScore: number
  rating: 'excellent' | 'good' | 'average' | 'needs_improvement'
  feedback: string
  strengths: string[]
  areasForImprovement: string[]
}

/**
 * Evaluate a case study response using Claude AI
 */
async function evaluateResponse(job: ResponseEvaluationJob): Promise<CaseEvaluationResult> {
  const { responseContent, questionContent } = job

  const systemPrompt = `You are an expert evaluator for case study responses.
Evaluate student responses based on:
- Problem Identification (40%): Did they correctly identify the key issues?
- Solution Quality (40%): Are the proposed solutions practical and well-reasoned?
- Clarity & Organization (20%): Is the response clear and well-structured?

Always respond in JSON format.`

  const userPrompt = `Evaluate this case study response:

Case Scenario: "${questionContent}"

Student Response: "${responseContent}"

Provide an evaluation in JSON format:
{
  "overallScore": 0.0 to 10.0,
  "problemIdentificationScore": 0.0 to 10.0,
  "solutionQualityScore": 0.0 to 10.0,
  "clarityScore": 0.0 to 10.0,
  "rating": "one of: excellent, good, average, needs_improvement",
  "feedback": "Detailed feedback for the student",
  "strengths": ["List of strengths in this response"],
  "areasForImprovement": ["Specific suggestions for improvement"]
}`

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 1536,
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

  return JSON.parse(jsonText) as CaseEvaluationResult
}

/**
 * Process response evaluation job
 */
async function processResponseEvaluationJob(job: Job<ResponseEvaluationJob>): Promise<void> {
  const startTime = Date.now()
  const { responseId } = job.data

  console.log(`[ResponseEvaluationWorker] Processing response ${responseId}`)

  try {
    // Check if response still exists
    const existingResponse = await prisma.response.findUnique({
      where: { id: responseId },
      select: { id: true, aiEvaluationStatus: true },
    })

    if (!existingResponse) {
      console.log(`[ResponseEvaluationWorker] Response ${responseId} not found, skipping`)
      return
    }

    // Evaluate the response
    const evaluation = await evaluateResponse(job.data)
    const processingTime = Date.now() - startTime

    // Update response with evaluation results
    await prisma.response.update({
      where: { id: responseId },
      data: {
        aiEvaluationStatus: 'completed',
        aiEvaluationRating: evaluation.rating,
        aiEvaluationScore: evaluation.overallScore,
        aiEvaluationFeedback: JSON.stringify({
          feedback: evaluation.feedback,
          problemIdentificationScore: evaluation.problemIdentificationScore,
          solutionQualityScore: evaluation.solutionQualityScore,
          clarityScore: evaluation.clarityScore,
          strengths: evaluation.strengths,
          areasForImprovement: evaluation.areasForImprovement,
          processingTimeMs: processingTime,
        }),
        aiEvaluationTimestamp: new Date(),
        score: evaluation.overallScore,
      },
    })

    console.log(
      `[ResponseEvaluationWorker] Completed evaluation for response ${responseId}. ` +
        `Rating: ${evaluation.rating}, Score: ${evaluation.overallScore}`
    )
  } catch (error) {
    console.error(`[ResponseEvaluationWorker] Failed to evaluate response ${responseId}:`, error)

    // Mark as failed in database
    await prisma.response
      .update({
        where: { id: responseId },
        data: {
          aiEvaluationStatus: 'failed',
        },
      })
      .catch(() => {})

    throw error // Will trigger retry
  }
}

/**
 * Start the response evaluation worker
 */
export function startResponseEvaluationWorker(): void {
  responseEvaluationQueue.process('evaluate-response', 3, processResponseEvaluationJob)

  responseEvaluationQueue.on('completed', (job) => {
    console.log(`[ResponseEvaluationWorker] Job ${job.id} completed`)
  })

  responseEvaluationQueue.on('failed', (job, err) => {
    console.error(`[ResponseEvaluationWorker] Job ${job.id} failed:`, err.message)
  })

  responseEvaluationQueue.on('stalled', (job) => {
    console.warn(`[ResponseEvaluationWorker] Job ${job.id} stalled`)
  })

  console.log('[ResponseEvaluationWorker] Started and listening for jobs')
}

export default { startResponseEvaluationWorker, processResponseEvaluationJob }
