/**
 * Case Mode Scenario Generation Service
 *
 * Generates educational case study scenarios from chapter content.
 * Each scenario includes an embedded flaw for students to identify.
 *
 * Uses Claude Sonnet as primary, with OpenAI fallback.
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { CaseScenario } from '@/types/activities'

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

export interface GeneratedScenario extends CaseScenario {
  embeddedFlaw: string
  flawType: 'factual' | 'logical' | 'ethical' | 'procedural'
  difficulty: 1 | 2 | 3
  correctIdentification: string
  teacherNotes: string
}

export interface ScenarioGenerationResult {
  scenarios: GeneratedScenario[]
  metadata?: {
    model: string
    processingTimeMs: number
  }
}

/**
 * Generate case study scenarios from educational content
 */
export async function generateScenarios(
  chapterContent: string,
  options?: {
    count?: number
    subject?: string
    educationLevel?: string
    domain?: string
    includeFlaws?: boolean
  }
): Promise<ScenarioGenerationResult> {
  const startTime = Date.now()
  const count = options?.count || 8
  const includeFlaws = options?.includeFlaws !== false

  const systemPrompt = `You are an expert educational content creator specializing in case study scenarios for problem-based learning.

## Your Task
Create ${count} realistic case study scenarios based on the provided educational content. Each scenario should:

1. **Be realistic and engaging** - Present authentic situations students might encounter
2. **Test comprehension and application** - Require understanding of the source material
3. **Encourage critical thinking** - Have multiple valid approaches to analysis
4. **Be appropriately complex** - Match the education level

${includeFlaws ? `
## Embedded Flaws
Each scenario MUST contain ONE subtle flaw that students should identify:

**Flaw Types:**
- **factual**: Incorrect information, wrong numbers, misattributed facts
- **logical**: Flawed reasoning, unsupported conclusions, false causation
- **ethical**: Unethical practices, conflicts of interest, regulatory violations
- **procedural**: Skipped steps, wrong order, missing approvals

**Flaw Guidelines:**
- Make flaws subtle but identifiable with careful reading
- Flaws should relate to the educational content
- Vary flaw types across scenarios
- Include a hint of why this is problematic
` : ''}

## Scenario Structure
Each scenario should be 150-300 words and include:
- A clear title
- Context/background
- The situation/problem
- Key stakeholders mentioned
- Enough detail for meaningful analysis

## Difficulty Levels
- **1 (Easy)**: Single issue, clear problem
- **2 (Medium)**: Multiple issues, some ambiguity
- **3 (Hard)**: Complex interrelated issues, significant ambiguity

## Response Format
Return ONLY a valid JSON array:
[
  {
    "id": "unique-id-1",
    "title": "Scenario Title",
    "content": "Full scenario text (150-300 words)",
    "domain": "Business/Healthcare/Technology/Education/etc",
    ${includeFlaws ? `"embeddedFlaw": "Description of the flaw",
    "flawType": "factual|logical|ethical|procedural",
    "correctIdentification": "What students should notice about this flaw",
    "teacherNotes": "Notes for instructor about this scenario",` : ''}
    "difficulty": 1-3
  }
]`

  const userPrompt = `Create ${count} case study scenarios based on this educational content:

## Subject: ${options?.subject || 'General'}
## Education Level: ${options?.educationLevel || 'Not specified'}
${options?.domain ? `## Domain Focus: ${options.domain}` : ''}

## Source Content:
---
${chapterContent.slice(0, 10000)}
${chapterContent.length > 10000 ? '\n[Content truncated for processing]' : ''}
---

Generate ${count} diverse scenarios with varying difficulty levels.
${includeFlaws ? 'Each must have a unique embedded flaw.' : ''}
Ensure scenarios cover different aspects of the content.`

  try {
    // Try Claude first
    const claudeResponse = await getAnthropicClient().messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = claudeResponse.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const scenarios = parseScenarioResponse(content.text, includeFlaws)
    return {
      scenarios,
      metadata: {
        model: 'claude-sonnet',
        processingTimeMs: Date.now() - startTime,
      },
    }
  } catch (claudeError) {
    console.warn('[generateScenarios] Claude failed, trying OpenAI:', claudeError)

    try {
      const openaiResponse = await getOpenAIClient().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 8192,
      })

      const content = openaiResponse.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const scenarios = parseScenarioResponse(content, includeFlaws)
      return {
        scenarios,
        metadata: {
          model: 'gpt-4o',
          processingTimeMs: Date.now() - startTime,
        },
      }
    } catch (openaiError) {
      console.error('[generateScenarios] OpenAI also failed:', openaiError)
      throw new Error(
        `Failed to generate scenarios: ${claudeError instanceof Error ? claudeError.message : String(claudeError)}`
      )
    }
  }
}

/**
 * Parse AI response to extract scenarios
 */
function parseScenarioResponse(text: string, includeFlaws: boolean): GeneratedScenario[] {
  let parsed: unknown[] = []

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

  // Try to find JSON array
  if (!Array.isArray(parsed) || parsed.length === 0) {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch {
        // Continue
      }
    }
  }

  if (!Array.isArray(parsed)) {
    console.error('[parseScenarioResponse] Failed to parse:', text.slice(0, 500))
    return []
  }

  // Validate and clean scenarios
  return parsed
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, index) => {
      const scenario: GeneratedScenario = {
        id: typeof item.id === 'string' ? item.id : `scenario-${index + 1}`,
        title: typeof item.title === 'string' ? item.title : `Scenario ${index + 1}`,
        content: typeof item.content === 'string' ? item.content : '',
        domain: typeof item.domain === 'string' ? item.domain : undefined,
        embeddedFlaw: includeFlaws && typeof item.embeddedFlaw === 'string'
          ? item.embeddedFlaw
          : '',
        flawType: isValidFlawType(item.flawType) ? item.flawType : 'logical',
        difficulty: isValidDifficulty(item.difficulty) ? item.difficulty : 2,
        correctIdentification: typeof item.correctIdentification === 'string'
          ? item.correctIdentification
          : '',
        teacherNotes: typeof item.teacherNotes === 'string' ? item.teacherNotes : '',
      }
      return scenario
    })
    .filter((s) => s.content.length > 0)
}

function isValidFlawType(value: unknown): value is 'factual' | 'logical' | 'ethical' | 'procedural' {
  return ['factual', 'logical', 'ethical', 'procedural'].includes(value as string)
}

function isValidDifficulty(value: unknown): value is 1 | 2 | 3 {
  return [1, 2, 3].includes(value as number)
}

/**
 * Update scenario with teacher edits
 */
export function updateScenario(
  existing: GeneratedScenario,
  updates: Partial<GeneratedScenario>
): GeneratedScenario {
  return {
    ...existing,
    ...updates,
    id: existing.id, // Never change ID
  }
}

/**
 * Validate a set of scenarios for publishing
 */
export function validateScenarios(scenarios: GeneratedScenario[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (scenarios.length === 0) {
    errors.push('At least one scenario is required')
  }

  scenarios.forEach((s, i) => {
    if (!s.title.trim()) {
      errors.push(`Scenario ${i + 1}: Title is required`)
    }
    if (s.content.length < 50) {
      errors.push(`Scenario ${i + 1}: Content must be at least 50 characters`)
    }
    if (s.content.length > 2000) {
      errors.push(`Scenario ${i + 1}: Content exceeds 2000 characters`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Convert GeneratedScenario to CaseScenario (for saving to settings)
 */
export function toBasicScenario(scenario: GeneratedScenario): CaseScenario {
  return {
    id: scenario.id,
    title: scenario.title,
    content: scenario.content,
    domain: scenario.domain,
  }
}

/**
 * Convert array of GeneratedScenario to CaseScenario array
 */
export function toBasicScenarios(scenarios: GeneratedScenario[]): CaseScenario[] {
  return scenarios.map(toBasicScenario)
}
