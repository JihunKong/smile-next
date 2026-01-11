/**
 * Inquiry Mode Keyword Extraction Service
 *
 * Extracts educational keywords from chapter text using AI.
 * Uses Claude Sonnet as primary, with OpenAI fallback.
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    })
  }
  return anthropicClient
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
  }
  return openaiClient
}

export interface KeywordExtractionResult {
  pool1: string[] // Concepts, theories, definitions
  pool2: string[] // Verbs, processes, applications
  metadata?: {
    model: string
    processingTimeMs: number
  }
}

export interface KeywordCombination {
  keyword1: string
  keyword2: string
}

/**
 * Extract keywords from educational chapter text
 * Pool 1: Core concepts, theories, definitions
 * Pool 2: Verbs, processes, applications
 */
export async function extractKeywords(
  chapterText: string,
  options?: {
    pool1Count?: number
    pool2Count?: number
    subject?: string
    educationLevel?: string
  }
): Promise<KeywordExtractionResult> {
  const pool1Count = options?.pool1Count || 10
  const pool2Count = options?.pool2Count || 10
  const subject = options?.subject || 'General'
  const educationLevel = options?.educationLevel || 'Not specified'

  const startTime = Date.now()

  const systemPrompt = `You are an expert educational content analyst specializing in extracting key learning concepts from educational materials.

Your task is to analyze the provided text and extract two types of keywords:

## Pool 1: Concept Keywords (${pool1Count} items)
- Core concepts, theories, and definitions
- Key terms that represent important ideas
- Nouns and noun phrases that students should understand
- Examples: "photosynthesis", "democracy", "Newton's Laws", "supply and demand"

## Pool 2: Action Keywords (${pool2Count} items)
- Verbs and action phrases related to the content
- Processes, procedures, and applications
- Skills and competencies students should develop
- Examples: "analyze", "compare", "calculate", "synthesize", "evaluate"

## Guidelines
1. Select keywords that are:
   - Central to understanding the topic
   - Appropriate for the education level: ${educationLevel}
   - Diverse enough to enable varied question creation
   - Not too narrow or too broad

2. Avoid:
   - Very common words (the, is, are)
   - Highly specific jargon that only experts would know
   - Redundant or overlapping terms

## Response Format
Return ONLY a valid JSON object with no additional text:
{
  "pool1": ["keyword1", "keyword2", ...],
  "pool2": ["action1", "action2", ...]
}`

  const userPrompt = `Subject: ${subject}
Education Level: ${educationLevel}

Please extract keywords from the following educational text:

---
${chapterText.slice(0, 8000)}
${chapterText.length > 8000 ? '\n[Text truncated for processing]' : ''}
---

Return ${pool1Count} concept keywords in pool1 and ${pool2Count} action keywords in pool2.`

  try {
    // Try Claude first
    const response = await getAnthropicClient().messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const result = parseKeywordResponse(content.text)
    return {
      ...result,
      metadata: {
        model: 'claude-sonnet',
        processingTimeMs: Date.now() - startTime,
      },
    }
  } catch (claudeError) {
    console.warn('[extractKeywords] Claude failed, trying OpenAI:', claudeError)

    // Fallback to OpenAI
    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const result = parseKeywordResponse(content)
      return {
        ...result,
        metadata: {
          model: 'gpt-4o',
          processingTimeMs: Date.now() - startTime,
        },
      }
    } catch (openaiError) {
      console.error('[extractKeywords] OpenAI also failed:', openaiError)
      throw new Error(
        `Failed to extract keywords: ${claudeError instanceof Error ? claudeError.message : String(claudeError)}`
      )
    }
  }
}

/**
 * Parse AI response to extract keywords
 */
function parseKeywordResponse(text: string): { pool1: string[]; pool2: string[] } {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(text)
    return validateKeywordResult(parsed)
  } catch {
    // Continue
  }

  // Try to extract from code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim())
      return validateKeywordResult(parsed)
    } catch {
      // Continue
    }
  }

  // Try to find JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return validateKeywordResult(parsed)
    } catch {
      // Continue
    }
  }

  // Return empty arrays if all parsing fails
  console.error('[parseKeywordResponse] Failed to parse:', text.slice(0, 200))
  return { pool1: [], pool2: [] }
}

/**
 * Validate and clean keyword result
 */
function validateKeywordResult(data: unknown): { pool1: string[]; pool2: string[] } {
  const result = { pool1: [] as string[], pool2: [] as string[] }

  if (typeof data !== 'object' || data === null) {
    return result
  }

  const obj = data as Record<string, unknown>

  if (Array.isArray(obj.pool1)) {
    result.pool1 = obj.pool1
      .filter((k): k is string => typeof k === 'string')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
  }

  if (Array.isArray(obj.pool2)) {
    result.pool2 = obj.pool2
      .filter((k): k is string => typeof k === 'string')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
  }

  return result
}

/**
 * Assign a random keyword combination to a student
 * Each student gets a unique combination from the pools
 */
export function assignKeywordCombination(
  pool1: string[],
  pool2: string[],
  usedCombinations?: Set<string>
): KeywordCombination | null {
  if (pool1.length === 0 || pool2.length === 0) {
    return null
  }

  // Try to find an unused combination
  const maxAttempts = pool1.length * pool2.length
  let attempts = 0

  while (attempts < maxAttempts) {
    const keyword1 = pool1[Math.floor(Math.random() * pool1.length)]
    const keyword2 = pool2[Math.floor(Math.random() * pool2.length)]
    const combinationKey = `${keyword1}|${keyword2}`

    if (!usedCombinations || !usedCombinations.has(combinationKey)) {
      usedCombinations?.add(combinationKey)
      return { keyword1, keyword2 }
    }

    attempts++
  }

  // If all combinations are used, just return a random one
  return {
    keyword1: pool1[Math.floor(Math.random() * pool1.length)],
    keyword2: pool2[Math.floor(Math.random() * pool2.length)],
  }
}

/**
 * Assign specific keyword combination for each question
 * Ensures variety across questions for the same student
 */
export function assignKeywordsForQuestions(
  pool1: string[],
  pool2: string[],
  questionCount: number
): KeywordCombination[] {
  const combinations: KeywordCombination[] = []
  const usedCombinations = new Set<string>()

  for (let i = 0; i < questionCount; i++) {
    const combo = assignKeywordCombination(pool1, pool2, usedCombinations)
    if (combo) {
      combinations.push(combo)
    } else {
      // Fallback: just pick random if we run out
      combinations.push({
        keyword1: pool1[i % pool1.length],
        keyword2: pool2[i % pool2.length],
      })
    }
  }

  return combinations
}
