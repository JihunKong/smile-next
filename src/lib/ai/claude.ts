import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface BloomsGuidance {
  currentLevel: string
  levelDescription: string
  nextLevelSuggestions: string[]
  pedagogicalTips: string[]
  exampleQuestions: {
    level: string
    question: string
  }[]
}

export interface CoachingResponse {
  feedback: string
  encouragement: string
  nextSteps: string[]
  resources?: string[]
}

/**
 * Generate detailed Bloom's Taxonomy guidance using Claude
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
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: `You are an expert in Bloom's Taxonomy and educational question design.
Provide detailed pedagogical guidance to help students improve their question-asking skills.

Always respond in JSON format.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this question and provide Bloom's Taxonomy guidance:

Question: "${question}"
Current Bloom's Level: ${currentLevel}
Subject: ${context.subject || 'General'}
Topic: ${context.topic || 'Not specified'}
Education Level: ${context.educationLevel || 'Not specified'}

Provide a JSON response with:
{
  "currentLevel": "string",
  "levelDescription": "Explain what this Bloom's level means",
  "nextLevelSuggestions": ["How to elevate to the next level..."],
  "pedagogicalTips": ["Teaching tips..."],
  "exampleQuestions": [
    {"level": "remember", "question": "..."},
    {"level": "understand", "question": "..."},
    {"level": "apply", "question": "..."},
    {"level": "analyze", "question": "..."},
    {"level": "evaluate", "question": "..."},
    {"level": "create", "question": "..."}
  ]
}`,
      },
    ],
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

  return JSON.parse(jsonText) as BloomsGuidance
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
  const response = await anthropic.messages.create({
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
  const response = await anthropic.messages.create({
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

export default anthropic
