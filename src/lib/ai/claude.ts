import Anthropic from '@anthropic-ai/sdk'
import {
  BLOOMS_TAXONOMY,
  buildTier2GuidancePrompt,
  buildExamEvaluationPrompt,
  buildCaseEvaluationPrompt,
  buildAnswerEvaluationPrompt
} from './prompts'

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

export interface BloomsGuidance {
  currentLevel: string
  levelDescription: string
  nextLevelSuggestions: string[]
  pedagogicalTips: string[]
  exampleQuestions: {
    level: string
    question: string
  }[]
  // Enhanced fields from Flask-style prompts
  currentLevelExplanation?: string
  cognitiveGapAnalysis?: string
  transformationStrategies?: Array<{ strategy: string; example: string }>
  scaffoldedPath?: Array<{ level: string; question: string; thinkingRequired: string }>
  teacherTips?: string[]
}

export interface CoachingResponse {
  feedback: string
  encouragement: string
  nextSteps: string[]
  resources?: string[]
}

export interface ExamGradingResult {
  score: number
  isCorrect: boolean
  feedback: string
  partialCreditReasoning?: string
  conceptualStrengths: string[]
  misconceptions: string[]
  learningTips: string[]
}

export interface CaseEvaluationResult {
  issuesScore: number
  solutionScore: number
  analysisScore: number
  totalScore: number
  identifiedIssues: string[]
  missedIssues: string[]
  solutionStrengths: string[]
  solutionWeaknesses: string[]
  feedback: string
  exemplarResponse?: string
}

/**
 * Generate detailed Bloom's Taxonomy guidance using Claude
 * Enhanced with Flask-style comprehensive prompts
 */
export async function generateBloomsGuidance(
  question: string,
  currentLevel: string,
  context: {
    subject?: string
    topic?: string
    educationLevel?: string
  }
): Promise<BloomsGuidance> {
  // Use the comprehensive Tier 2 guidance prompt from Flask
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

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonText = content.text
  const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/)
  if (jsonMatch) {
    jsonText = jsonMatch[1]
  }

  const result = JSON.parse(jsonText)

  // Transform to BloomsGuidance format for backwards compatibility
  const levelConfig = BLOOMS_TAXONOMY[currentLevel.toLowerCase()]

  return {
    currentLevel: currentLevel,
    levelDescription: levelConfig?.description || result.currentLevelExplanation,
    nextLevelSuggestions: result.transformationStrategies?.map((s: { example: string }) => s.example) || [],
    pedagogicalTips: result.teacherTips || [],
    exampleQuestions: result.scaffoldedPath?.map((p: { level: string; question: string }) => ({
      level: p.level,
      question: p.question
    })) || [],
    // Enhanced fields
    currentLevelExplanation: result.currentLevelExplanation,
    cognitiveGapAnalysis: result.cognitiveGapAnalysis,
    transformationStrategies: result.transformationStrategies,
    scaffoldedPath: result.scaffoldedPath,
    teacherTips: result.teacherTips,
  }
}

/**
 * Grade exam response using comprehensive rubric-based evaluation
 */
export async function gradeExamResponse(context: {
  question: string
  studentAnswer: string
  correctAnswer: string
  rubric?: string
  subject?: string
  maxScore?: number
}): Promise<ExamGradingResult> {
  const { system: systemPrompt, user: userPrompt } = buildExamEvaluationPrompt(context)

  const response = await getAnthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
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

  return JSON.parse(jsonText) as ExamGradingResult
}

/**
 * Evaluate case study response with comprehensive analysis
 */
export async function evaluateCaseResponse(context: {
  scenario: string
  studentIssues: string
  studentSolution: string
  expectedIssues?: string[]
  expectedApproaches?: string[]
  subject?: string
}): Promise<CaseEvaluationResult> {
  const { system: systemPrompt, user: userPrompt } = buildCaseEvaluationPrompt(context)

  const response = await getAnthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 3072,
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

  return JSON.parse(jsonText) as CaseEvaluationResult
}

/**
 * Provide personalized coaching feedback for exam mode
 */
export async function provideExamCoaching(
  question: string,
  studentAnswer: string,
  correctAnswer: string,
  isCorrect: boolean
): Promise<CoachingResponse> {
  const response = await getAnthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: `You are a supportive and encouraging tutor.
Provide constructive feedback that helps students learn from their answers.
Be warm and encouraging while being educational.

Always respond in JSON format.`,
    messages: [
      {
        role: 'user',
        content: `A student answered this question:

Question: "${question}"
Student's Answer: "${studentAnswer}"
Correct Answer: "${correctAnswer}"
Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

Provide coaching feedback in JSON format:
{
  "feedback": "Explain why the answer was correct/incorrect",
  "encouragement": "Motivational message",
  "nextSteps": ["Suggestions for improvement or further learning"],
  "resources": ["Optional: relevant topics to review"]
}`,
      },
    ],
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

  return JSON.parse(jsonText) as CoachingResponse
}

/**
 * Generate case study scenarios using Claude
 */
export async function generateCaseScenario(
  topic: string,
  context: {
    subject: string
    educationLevel: string
    complexity: 'basic' | 'intermediate' | 'advanced'
  }
): Promise<{
  scenario: string
  questions: string[]
  learningObjectives: string[]
}> {
  const response = await getAnthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: `You are an expert case study designer for educational purposes.
Create engaging, realistic case studies that promote critical thinking.

Always respond in JSON format.`,
    messages: [
      {
        role: 'user',
        content: `Create a case study for:

Topic: ${topic}
Subject: ${context.subject}
Education Level: ${context.educationLevel}
Complexity: ${context.complexity}

Provide a JSON response:
{
  "scenario": "Detailed case study scenario (2-3 paragraphs)",
  "questions": ["5-7 discussion questions about the case"],
  "learningObjectives": ["What students should learn from this case"]
}`,
      },
    ],
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

  return JSON.parse(jsonText)
}

export default getAnthropic
