import { Job } from 'bull'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db/prisma'
import { responseEvaluationQueue, ResponseEvaluationJob } from '../bull'

// Lazy initialization to avoid build-time errors
let anthropicClient: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[ResponseEvaluationWorker] WARNING: ANTHROPIC_API_KEY is not set!')
    } else {
      console.log('[ResponseEvaluationWorker] ANTHROPIC_API_KEY is configured')
    }
    anthropicClient = new Anthropic({
      apiKey: apiKey || '',
    })
  }
  return anthropicClient
}

/**
 * Flask-compatible Case Evaluation Result
 * Matches smile-flask-backend/app/services/case_evaluation_service.py
 */
interface CaseEvaluationResult {
  understanding: { score: number; feedback: string }
  ingenuity: { score: number; feedback: string }
  critical_thinking: { score: number; feedback: string }
  real_world: { score: number; feedback: string }
  what_was_done_well: string
  what_could_improve: string
  suggestions: string
  average_score: number
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
  const cleaned = text
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
 * Create evaluation for empty/no response submissions
 * Matches Flask's _create_empty_response_evaluation()
 */
function createEmptyResponseEvaluation(): CaseEvaluationResult {
  return {
    understanding: {
      score: 0.0,
      feedback: 'No response provided. Unable to assess understanding of the case issue.'
    },
    ingenuity: {
      score: 0.0,
      feedback: 'No response provided. Unable to evaluate solution suggestions.'
    },
    critical_thinking: {
      score: 0.0,
      feedback: 'No response provided. Unable to assess critical thinking depth.'
    },
    real_world: {
      score: 0.0,
      feedback: 'No response provided. Unable to evaluate real-world application.'
    },
    what_was_done_well: 'No response was submitted for this case.',
    what_could_improve: 'To receive a score, you must provide a written analysis identifying flaws and proposing solutions.',
    suggestions: 'For future attempts, make sure to complete all case analyses before submitting.',
    average_score: 0.0
  }
}

/**
 * Create evaluation for error cases
 * Matches Flask's _create_error_evaluation()
 */
function createErrorEvaluation(): CaseEvaluationResult {
  return {
    understanding: {
      score: 0.0,
      feedback: 'Evaluation failed due to technical error. Please contact support.'
    },
    ingenuity: {
      score: 0.0,
      feedback: 'Evaluation failed due to technical error. Please contact support.'
    },
    critical_thinking: {
      score: 0.0,
      feedback: 'Evaluation failed due to technical error. Please contact support.'
    },
    real_world: {
      score: 0.0,
      feedback: 'Evaluation failed due to technical error. Please contact support.'
    },
    what_was_done_well: 'Technical error during evaluation.',
    what_could_improve: 'Please contact support for manual review.',
    suggestions: 'This response will be reviewed manually.',
    average_score: 0.0
  }
}

/**
 * Get difficulty-specific guidance for evaluation
 * Matches Flask's difficulty_guidance dict
 */
function getDifficultyGuidance(difficultyLevel: string): Record<string, string> {
  const guidance: Record<string, Record<string, string>> = {
    basic: {
      understanding: '7-8: Identifies main issue; 9-10: Identifies issue with context',
      ingenuity: '7-8: Basic solution; 9-10: Creative approach',
      critical_thinking: '7-8: Basic analysis; 9-10: Shows reasoning',
      real_world: '7-8: Mentions application; 9-10: Practical details'
    },
    intermediate: {
      understanding: '7-8: Multiple issues identified; 9-10: Root causes explained',
      ingenuity: '7-8: Good solutions; 9-10: Innovative approaches',
      critical_thinking: '7-8: Good analysis; 9-10: Deep connections',
      real_world: '7-8: Realistic application; 9-10: Implementation plan'
    },
    professional: {
      understanding: '7-8: Complex issues identified; 9-10: Systemic analysis',
      ingenuity: '7-8: Sophisticated solutions; 9-10: Novel frameworks',
      critical_thinking: '7-8: Multi-level analysis; 9-10: Philosophical depth',
      real_world: '7-8: Strategic application; 9-10: Transformative vision'
    }
  }

  return guidance[difficultyLevel] || guidance['professional']
}

/**
 * Build evaluation prompt - matches Flask's _build_evaluation_prompt()
 */
function buildEvaluationPrompt(
  studentResponse: string,
  scenarioContent: string,
  difficultyLevel: string = 'professional'
): string {
  const guidance = getDifficultyGuidance(difficultyLevel)

  return `Evaluate the following student response to a business case scenario using 4 criteria.

**Difficulty Level**: ${difficultyLevel}

**Case Scenario**:
${scenarioContent}

**Student Response**:
${studentResponse}

---

**EVALUATION CRITERIA** (Each scored 0-10):

**1. Understanding the Case Issue** (0-10)
- Did the student correctly identify the core problems/flaws?
- How well did they understand the implications?
- Did they miss critical issues or identify irrelevant ones?

**Scoring Guide for ${difficultyLevel}**:
- 0-4: Major misunderstanding, missed key issues
- 5-6: Partial understanding, some issues identified
- ${guidance.understanding}

**2. Ingenuity in Solution Suggestion** (0-10)
- How creative/innovative are the proposed solutions?
- Do solutions address root causes?
- Are solutions practical and well-thought-out?

**Scoring Guide for ${difficultyLevel}**:
- 0-4: No solutions or impractical suggestions
- 5-6: Basic solutions, limited creativity
- ${guidance.ingenuity}

**3. Critical Thinking Depth** (0-10)
- How deeply did the student analyze the situation?
- Did they consider multiple perspectives?
- Did they show logical reasoning and evidence-based thinking?

**Scoring Guide for ${difficultyLevel}**:
- 0-4: Superficial analysis, no depth
- 5-6: Some analysis, limited depth
- ${guidance.critical_thinking}

**4. Real-World Application** (0-10)
- How practical/applicable are their suggestions?
- Did they consider implementation challenges?
- Did they connect to real-world contexts?

**Scoring Guide for ${difficultyLevel}**:
- 0-4: Unrealistic or no application mentioned
- 5-6: Some practical elements
- ${guidance.real_world}

---

**Output Format** (JSON):
{
    "understanding": {
        "score": 8.5,
        "feedback": "The student correctly identified [specific strengths]. However, [specific areas to improve]. [Specific examples from their response]."
    },
    "ingenuity": {
        "score": 7.0,
        "feedback": "The solutions proposed show [strengths]. To improve ingenuity, consider [suggestions]. [Specific examples]."
    },
    "critical_thinking": {
        "score": 9.0,
        "feedback": "Excellent critical analysis demonstrated by [specific examples]. The reasoning about [topic] was particularly strong. [Areas for growth if any]."
    },
    "real_world": {
        "score": 7.5,
        "feedback": "The application to real-world contexts was [assessment]. [Specific strengths]. Could be strengthened by [suggestions]."
    },
    "what_was_done_well": "Overall summary of strengths across all criteria. Be specific about what impressed you.",
    "what_could_improve": "Overall summary of areas for growth. Be constructive and specific.",
    "suggestions": "Actionable suggestions for improving future case analyses. Be practical and encouraging."
}

**CRITICAL**:
- Scores must be floats (e.g., 8.5, not 8 or 9)
- Feedback must be specific and reference actual content from student response
- Be fair but rigorous for the difficulty level
- Provide constructive criticism with examples
- Acknowledge strengths before suggesting improvements
- For nonsensical or random text responses, all scores should be 0-2

Return ONLY valid JSON. No additional text.`
}

/**
 * Get system prompt for evaluation
 * Matches Flask's _get_evaluation_system_prompt()
 */
function getEvaluationSystemPrompt(): string {
  return `You are an expert educator specializing in business case analysis, critical thinking, and innovation assessment.

Your role is to:
1. Evaluate student responses fairly and consistently
2. Provide detailed, constructive feedback on 4 criteria
3. Recognize strengths and identify growth areas
4. Calibrate scoring to difficulty level appropriately
5. Give specific examples from student work

Key principles:
- Be rigorous but fair - match expectations to difficulty level
- Provide actionable feedback, not just scores
- Reference specific parts of student responses in feedback
- Balance encouragement with honest assessment
- Focus on learning outcomes, not just error-finding
- Consider that multiple valid approaches may exist

Scoring philosophy:
- 0-2: Nonsensical, random text, or completely off-topic
- 3-4: Below expectations, major gaps
- 5-6: Approaching expectations, needs improvement
- 7-8: Meets expectations, solid work
- 9-10: Exceeds expectations, excellent work

Remember: The goal is to help students learn and improve, not just to judge.

Output ONLY valid JSON. No markdown, no explanations, just the JSON structure.`
}

/**
 * Evaluate a case study response using Claude AI
 * Matches Flask's CaseEvaluationService.evaluate_response()
 */
async function evaluateResponse(job: ResponseEvaluationJob): Promise<CaseEvaluationResult> {
  const { responseContent, questionContent, difficultyLevel } = job

  // Check for empty response
  if (!responseContent || !responseContent.trim()) {
    console.log('[ResponseEvaluationWorker] Empty response detected, returning zero score')
    return createEmptyResponseEvaluation()
  }

  const systemPrompt = getEvaluationSystemPrompt()
  const userPrompt = buildEvaluationPrompt(
    responseContent,
    questionContent,
    difficultyLevel || 'professional'
  )

  const modelId = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'
  console.log(`[ResponseEvaluationWorker] Calling Anthropic API with model: ${modelId}`)

  try {
    const response = await getAnthropic().messages.create({
      model: modelId,
      max_tokens: 2000,
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

    // Validate and fix required fields
    if (!result.understanding?.score) result.understanding = { score: 0, feedback: '' }
    if (!result.ingenuity?.score) result.ingenuity = { score: 0, feedback: '' }
    if (!result.critical_thinking?.score) result.critical_thinking = { score: 0, feedback: '' }
    if (!result.real_world?.score) result.real_world = { score: 0, feedback: '' }

    // Calculate average score from 4 criteria (Flask-style)
    const scores = [
      result.understanding.score,
      result.ingenuity.score,
      result.critical_thinking.score,
      result.real_world.score
    ]
    result.average_score = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10

    console.log(`[ResponseEvaluationWorker] Evaluation scores:`)
    console.log(`  - Understanding: ${result.understanding.score}`)
    console.log(`  - Ingenuity: ${result.ingenuity.score}`)
    console.log(`  - Critical Thinking: ${result.critical_thinking.score}`)
    console.log(`  - Real World: ${result.real_world.score}`)
    console.log(`  - Average: ${result.average_score}`)

    return result
  } catch (error) {
    console.error('[ResponseEvaluationWorker] Anthropic API error:', error)
    throw error
  }
}

/**
 * Convert average score to rating
 * Rating system (0-10 scale):
 * - 8+: thumbs_up (Excellent) - High quality, well-thought response
 * - 5-7.9: thumbs_sideways (Good) - Acceptable, room for improvement
 * - <5: thumbs_down (Try Again) - Needs significant improvement or nonsensical
 */
function scoreToRating(avgScore: number): string {
  if (avgScore >= 8) return 'thumbs_up'
  if (avgScore >= 5) return 'thumbs_sideways'
  return 'thumbs_down'
}

/**
 * Process response evaluation job
 */
async function processResponseEvaluationJob(job: Job<ResponseEvaluationJob>): Promise<void> {
  const startTime = Date.now()
  const { responseId } = job.data

  console.log(`[ResponseEvaluationWorker] ========== START Processing Job ${job.id} ==========`)
  console.log(`[ResponseEvaluationWorker] Response ID: ${responseId}`)

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

    // Convert to frontend rating
    const frontendRating = scoreToRating(evaluation.average_score)
    console.log(`[ResponseEvaluationWorker] Average score: ${evaluation.average_score} -> Rating: ${frontendRating}`)

    // Update response with evaluation results
    console.log(`[ResponseEvaluationWorker] Step 3: Updating database with results...`)
    await prisma.response.update({
      where: { id: responseId },
      data: {
        aiEvaluationStatus: 'completed',
        aiEvaluationRating: frontendRating,
        aiEvaluationScore: evaluation.average_score,
        aiEvaluationFeedback: JSON.stringify({
          // 4 criteria with scores and feedback (Flask-compatible)
          understanding: evaluation.understanding,
          ingenuity: evaluation.ingenuity,
          critical_thinking: evaluation.critical_thinking,
          real_world: evaluation.real_world,
          // Summary fields
          what_was_done_well: evaluation.what_was_done_well,
          what_could_improve: evaluation.what_could_improve,
          suggestions: evaluation.suggestions,
          // Metadata
          average_score: evaluation.average_score,
          processingTimeMs: processingTime,
        }),
        aiEvaluationTimestamp: new Date(),
        score: evaluation.average_score,
      },
    })

    console.log(
      `[ResponseEvaluationWorker] ========== SUCCESS Job ${job.id} ==========\n` +
        `Average Score: ${evaluation.average_score}, Rating: ${frontendRating}, Time: ${processingTime}ms`
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
