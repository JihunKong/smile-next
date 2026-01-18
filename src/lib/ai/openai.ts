import OpenAI from 'openai'

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
  }
  return openaiClient
}

export interface EvaluationResult {
  overallScore: number
  bloomsLevel: string
  bloomsConfidence: number
  creativityScore: number
  clarityScore: number
  relevanceScore: number
  innovationScore: number
  evaluationText: string
  strengths: string[]
  improvements: string[]
  enhancedQuestions: string[]
}

export interface EvaluationContext {
  question: string
  activityName: string
  groupName: string
  educationLevel?: string
  subject?: string
  topic?: string
  ragContext?: string
}

/**
 * Evaluate a student question using OpenAI GPT-4o
 */
export async function evaluateQuestion(
  context: EvaluationContext
): Promise<EvaluationResult> {
  const systemPrompt = buildEvaluationPrompt(context)

  const response = await getOpenAI().chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context.question },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  return JSON.parse(content) as EvaluationResult
}

/**
 * Generate enhanced question alternatives
 */
export async function generateEnhancedQuestions(
  originalQuestion: string,
  targetBloomsLevel: string,
  context: EvaluationContext
): Promise<string[]> {
  const response = await getOpenAI().chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert educational question designer. Generate 4 enhanced versions of the given question that target ${targetBloomsLevel} level in Bloom's Taxonomy.

Context:
- Activity: ${context.activityName}
- Subject: ${context.subject || 'General'}
- Topic: ${context.topic || 'Not specified'}
- Education Level: ${context.educationLevel || 'Not specified'}

Return a JSON object with an "questions" array containing exactly 4 enhanced questions.`,
      },
      { role: 'user', content: originalQuestion },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content
  if (!content) {
    return []
  }

  const parsed = JSON.parse(content)
  return parsed.questions || []
}

/**
 * Build the evaluation prompt based on context
 */
function buildEvaluationPrompt(context: EvaluationContext): string {
  const prompt = `You are an expert educational evaluator specializing in question quality assessment.

Evaluate the student's question based on Bloom's Taxonomy and provide detailed feedback.

## Context
- Activity: ${context.activityName}
- Group: ${context.groupName}
${context.subject ? `- Subject: ${context.subject}` : ''}
${context.topic ? `- Topic: ${context.topic}` : ''}
${context.educationLevel ? `- Education Level: ${context.educationLevel}` : ''}
${context.ragContext ? `\n## Reference Context\n${context.ragContext}` : ''}

## Evaluation Criteria
1. **Bloom's Level** (remember, understand, apply, analyze, evaluate, create)
2. **Overall Score** (0-10): Overall question quality
3. **Creativity Score** (0-10): Originality and creative thinking
4. **Clarity Score** (0-10): How clear and well-formed the question is
5. **Relevance Score** (0-10): How relevant to the topic/subject
6. **Innovation Score** (0-10): Potential for innovative thinking

## Response Format
Return a JSON object with:
{
  "overallScore": number,
  "bloomsLevel": "string",
  "bloomsConfidence": number (0-1),
  "creativityScore": number,
  "clarityScore": number,
  "relevanceScore": number,
  "innovationScore": number,
  "evaluationText": "Brief overall evaluation (2-3 sentences)",
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "enhancedQuestions": ["enhanced version 1", "enhanced version 2", "enhanced version 3", "enhanced version 4"]
}

Be encouraging but honest in your evaluation.`

  return prompt
}

export default getOpenAI
