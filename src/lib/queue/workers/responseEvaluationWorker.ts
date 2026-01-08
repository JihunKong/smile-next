import { Job } from 'bull'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/prisma'
import { responseEvaluationQueue, ResponseEvaluationJob } from '../bull'

// Check for API key at module load
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('[ResponseEvaluationWorker] WARNING: ANTHROPIC_API_KEY is not set!')
} else {
  console.log('[ResponseEvaluationWorker] ANTHROPIC_API_KEY is configured')
}

const anthropic = new Anthropic({
  apiKey: apiKey,
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
  let cleaned = text
    .replace(/^\s*```\s*json?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
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

  const modelId = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'
  console.log(`[ResponseEvaluationWorker] Calling Anthropic API with model: ${modelId}`)

  try {
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 1536,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    console.log(`[ResponseEvaluationWorker] Anthropic API response received, stop_reason: ${response.stop_reason}`)

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract and parse JSON from response using robust parser
    const result = parseJsonFromResponse(content.text) as CaseEvaluationResult

    // Validate required fields and provide defaults
    if (typeof result.overallScore !== 'number') {
      result.overallScore = 5.0
    }
    if (!['excellent', 'good', 'average', 'needs_improvement'].includes(result.rating)) {
      result.rating = result.overallScore >= 8 ? 'excellent' :
                     result.overallScore >= 6 ? 'good' :
                     result.overallScore >= 4 ? 'average' : 'needs_improvement'
    }
    if (!result.feedback) {
      result.feedback = 'Evaluation completed.'
    }
    if (!Array.isArray(result.strengths)) {
      result.strengths = []
    }
    if (!Array.isArray(result.areasForImprovement)) {
      result.areasForImprovement = []
    }

    console.log(`[ResponseEvaluationWorker] Parsed evaluation result: rating=${result.rating}, score=${result.overallScore}`)
    return result
  } catch (error) {
    console.error('[ResponseEvaluationWorker] Anthropic API error:', error)
    throw error
  }
}

/**
 * Process response evaluation job
 */
async function processResponseEvaluationJob(job: Job<ResponseEvaluationJob>): Promise<void> {
  const startTime = Date.now()
  const { responseId } = job.data

  console.log(`[ResponseEvaluationWorker] ========== START Processing Job ${job.id} ==========`)
  console.log(`[ResponseEvaluationWorker] Response ID: ${responseId}`)
  console.log(`[ResponseEvaluationWorker] Job data keys: ${Object.keys(job.data).join(', ')}`)

  try {
    // Check if response still exists
    console.log(`[ResponseEvaluationWorker] Step 1: Checking if response exists in DB...`)
    const existingResponse = await prisma.response.findUnique({
      where: { id: responseId },
      select: { id: true, aiEvaluationStatus: true },
    })

    if (!existingResponse) {
      console.log(`[ResponseEvaluationWorker] Response ${responseId} not found, skipping`)
      return
    }
    console.log(`[ResponseEvaluationWorker] Response found, current status: ${existingResponse.aiEvaluationStatus}`)

    // Evaluate the response
    console.log(`[ResponseEvaluationWorker] Step 2: Calling AI evaluation...`)
    const evaluation = await evaluateResponse(job.data)
    const processingTime = Date.now() - startTime
    console.log(`[ResponseEvaluationWorker] AI evaluation completed in ${processingTime}ms`)

    // Update response with evaluation results
    console.log(`[ResponseEvaluationWorker] Step 3: Updating database with results...`)
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
      `[ResponseEvaluationWorker] ========== SUCCESS Job ${job.id} ==========\n` +
        `Rating: ${evaluation.rating}, Score: ${evaluation.overallScore}, Time: ${processingTime}ms`
    )
  } catch (error) {
    console.error(`[ResponseEvaluationWorker] ========== FAILED Job ${job.id} ==========`)
    console.error(`[ResponseEvaluationWorker] Error:`, error)

    // Mark as failed in database
    await prisma.response
      .update({
        where: { id: responseId },
        data: {
          aiEvaluationStatus: 'failed',
        },
      })
      .catch((dbError) => {
        console.error(`[ResponseEvaluationWorker] Failed to update DB status to failed:`, dbError)
      })

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
