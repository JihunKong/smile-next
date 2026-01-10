/**
 * Case Mode AI Evaluation Service
 *
 * Evaluates student responses to case study scenarios using 4-dimensional scoring:
 * 1. Understanding - Grasps the scenario context and identifies core issues
 * 2. Ingenuity - Creative and practical problem-solving
 * 3. Critical Thinking - Multiple perspectives and logical reasoning
 * 4. Real-World Application - Practical and implementable suggestions
 *
 * Uses Claude Sonnet as primary, with OpenAI fallback.
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { CaseScenario } from '@/types/activities'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CaseEvaluationResult {
  // 4-dimensional scores (0-10)
  understanding: number
  ingenuity: number
  criticalThinking: number
  realWorldApplication: number
  // Overall score (average of dimensions)
  overallScore: number
  // Flaw detection (if scenario has embedded flaw)
  flawIdentified: boolean
  flawAnalysis?: string
  // Detailed feedback
  feedback: string
  // Strengths and improvements
  strengths: string[]
  improvements: string[]
  // Processing metadata
  metadata?: {
    model: string
    processingTimeMs: number
  }
}

export interface ScenarioResponse {
  issues: string
  solution: string
}

/**
 * Evaluate a single case study response
 */
export async function evaluateCaseResponse(
  scenario: CaseScenario,
  response: ScenarioResponse,
  options?: {
    subject?: string
    educationLevel?: string
    embeddedFlaw?: string
    expectedIssues?: string[]
  }
): Promise<CaseEvaluationResult> {
  const startTime = Date.now()

  const systemPrompt = `You are an expert case study evaluator specializing in problem-based learning assessment.

## Evaluation Framework

You will evaluate a student's response to a case study scenario using a 4-dimensional framework:

### 1. Understanding (0-10)
- Does the student grasp the scenario context?
- Are the core problems correctly identified?
- Are the implications of issues understood?
- Is there awareness of stakeholder perspectives?

### 2. Ingenuity (0-10)
- Are the proposed solutions creative?
- Are solutions practical and feasible?
- Is there evidence of innovative thinking?
- Are multiple solution options considered?

### 3. Critical Thinking (0-10)
- Is the reasoning logical and well-structured?
- Are multiple perspectives considered?
- Are trade-offs and limitations acknowledged?
- Is there evidence of deep analysis?

### 4. Real-World Application (0-10)
- Are suggestions implementable in practice?
- Are resources and constraints considered?
- Is there a realistic implementation plan?
- Are potential challenges addressed?

## Scoring Guidelines
- 9-10: Exceptional - Goes above and beyond expectations
- 7-8: Good - Solid analysis with minor gaps
- 5-6: Adequate - Meets basic requirements
- 3-4: Developing - Significant gaps but shows some understanding
- 1-2: Beginning - Major issues, minimal understanding
- 0: No response or completely off-topic

${options?.embeddedFlaw ? `
## Flaw Detection
This scenario contains an embedded flaw that students should identify:
"${options.embeddedFlaw}"

Award bonus points if the student identifies this flaw, even partially.
Note whether the student recognized this issue in your analysis.
` : ''}

## Response Format
Return ONLY a valid JSON object:
{
  "understanding": 0-10,
  "ingenuity": 0-10,
  "criticalThinking": 0-10,
  "realWorldApplication": 0-10,
  "flawIdentified": boolean,
  "flawAnalysis": "Brief analysis of whether/how student identified the embedded flaw (if applicable)",
  "feedback": "200-300 word comprehensive feedback paragraph",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"]
}`

  const userPrompt = `Evaluate this student's case study response:

## Scenario
**Title:** ${scenario.title}
${scenario.domain ? `**Domain:** ${scenario.domain}` : ''}

${scenario.content}

${options?.expectedIssues?.length ? `
## Expected Issues to Identify
${options.expectedIssues.map((i) => `- ${i}`).join('\n')}
` : ''}

## Student's Issue Identification
${response.issues || '(No response provided)'}

## Student's Proposed Solution
${response.solution || '(No response provided)'}

## Context
- Subject: ${options?.subject || 'General'}
- Education Level: ${options?.educationLevel || 'Not specified'}

Provide comprehensive evaluation as JSON.`

  try {
    // Try Claude first
    const claudeResponse = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = claudeResponse.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const result = parseEvaluationResponse(content.text)
    return {
      ...result,
      metadata: {
        model: 'claude-sonnet',
        processingTimeMs: Date.now() - startTime,
      },
    }
  } catch (claudeError) {
    console.warn('[evaluateCaseResponse] Claude failed, trying OpenAI:', claudeError)

    try {
      const openaiResponse = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      })

      const content = openaiResponse.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const result = parseEvaluationResponse(content)
      return {
        ...result,
        metadata: {
          model: 'gpt-4o',
          processingTimeMs: Date.now() - startTime,
        },
      }
    } catch (openaiError) {
      console.error('[evaluateCaseResponse] OpenAI also failed:', openaiError)

      // Return minimal evaluation if both fail
      return createFallbackEvaluation(response, Date.now() - startTime)
    }
  }
}

/**
 * Parse AI response to extract evaluation
 */
function parseEvaluationResponse(text: string): Omit<CaseEvaluationResult, 'metadata'> {
  let parsed: Record<string, unknown> = {}

  // Try direct JSON parse
  try {
    parsed = JSON.parse(text)
  } catch {
    // Try to extract from code block
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (codeBlockMatch) {
      try {
        parsed = JSON.parse(codeBlockMatch[1].trim())
      } catch {
        // Continue
      }
    }
  }

  // Try to find JSON object
  if (Object.keys(parsed).length === 0) {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        // Continue
      }
    }
  }

  // Extract and validate scores
  const understanding = normalizeScore(parsed.understanding)
  const ingenuity = normalizeScore(parsed.ingenuity)
  const criticalThinking = normalizeScore(parsed.criticalThinking)
  const realWorldApplication = normalizeScore(parsed.realWorldApplication)

  const overallScore = (understanding + ingenuity + criticalThinking + realWorldApplication) / 4

  return {
    understanding,
    ingenuity,
    criticalThinking,
    realWorldApplication,
    overallScore: Math.round(overallScore * 10) / 10,
    flawIdentified: parsed.flawIdentified === true,
    flawAnalysis: typeof parsed.flawAnalysis === 'string' ? parsed.flawAnalysis : undefined,
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback : 'Evaluation completed.',
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.filter((s): s is string => typeof s === 'string')
      : [],
    improvements: Array.isArray(parsed.improvements)
      ? parsed.improvements.filter((s): s is string => typeof s === 'string')
      : [],
  }
}

/**
 * Normalize score to 0-10 range
 */
function normalizeScore(value: unknown): number {
  if (typeof value === 'number') {
    return Math.min(10, Math.max(0, Math.round(value * 10) / 10))
  }
  return 5.0 // Default neutral score
}

/**
 * Create fallback evaluation when AI fails
 */
function createFallbackEvaluation(
  response: ScenarioResponse,
  processingTimeMs: number
): CaseEvaluationResult {
  // Basic heuristic scoring based on response length
  const issuesLength = response.issues?.length || 0
  const solutionLength = response.solution?.length || 0
  const totalLength = issuesLength + solutionLength

  let baseScore: number
  if (totalLength > 400) {
    baseScore = 6.5
  } else if (totalLength > 200) {
    baseScore = 5.0
  } else if (totalLength > 50) {
    baseScore = 3.5
  } else {
    baseScore = 1.5
  }

  return {
    understanding: baseScore,
    ingenuity: baseScore,
    criticalThinking: baseScore,
    realWorldApplication: baseScore,
    overallScore: baseScore,
    flawIdentified: false,
    feedback:
      'Your response has been recorded. Due to a temporary issue, detailed AI feedback is unavailable. Your score is based on response completeness.',
    strengths: totalLength > 200 ? ['Provided detailed response'] : [],
    improvements:
      totalLength < 200
        ? ['Consider providing more detailed analysis']
        : [],
    metadata: {
      model: 'fallback-heuristic',
      processingTimeMs,
    },
  }
}

/**
 * Evaluate all responses for a case attempt
 */
export async function evaluateCaseAttempt(
  scenarios: CaseScenario[],
  responses: Record<string, ScenarioResponse>,
  options?: {
    subject?: string
    educationLevel?: string
  }
): Promise<{
  scenarioResults: Array<{
    scenarioId: string
    title: string
    evaluation: CaseEvaluationResult
  }>
  overallScore: number
  passed: boolean
  passThreshold: number
}> {
  const passThreshold = 6.0
  const scenarioResults: Array<{
    scenarioId: string
    title: string
    evaluation: CaseEvaluationResult
  }> = []

  // Evaluate each scenario in parallel (with concurrency limit)
  const BATCH_SIZE = 3
  for (let i = 0; i < scenarios.length; i += BATCH_SIZE) {
    const batch = scenarios.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (scenario) => {
        const response = responses[scenario.id] || { issues: '', solution: '' }
        const evaluation = await evaluateCaseResponse(scenario, response, options)
        return {
          scenarioId: scenario.id,
          title: scenario.title,
          evaluation,
        }
      })
    )
    scenarioResults.push(...batchResults)
  }

  // Calculate overall score
  const scores = scenarioResults.map((r) => r.evaluation.overallScore)
  const overallScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0

  return {
    scenarioResults,
    overallScore,
    passed: overallScore >= passThreshold,
    passThreshold,
  }
}
