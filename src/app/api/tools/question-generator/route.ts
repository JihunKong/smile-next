import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { z } from 'zod'
import OpenAI from 'openai'

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const generateSchema = z.object({
  sourceText: z.string().min(100, 'Source text must be at least 100 characters'),
  questionCount: z.number().refine((val) => val === 5 || val === 10, {
    message: 'Question count must be 5 or 10',
  }),
  targetLevel: z.enum(['analyze', 'evaluate', 'create']).default('evaluate'),
})

const BLOOM_LEVELS: Record<string, string> = {
  analyze: "Bloom's Level 4 - Analyze (Breaking down information into parts, finding patterns)",
  evaluate: "Bloom's Level 5 - Evaluate (Making judgments, justifying decisions)",
  create: "Bloom's Level 6 - Create (Producing new ideas, designing solutions)",
}

/**
 * POST /api/tools/question-generator
 * Generate questions from source text using AI
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = generateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { sourceText, questionCount, targetLevel } = result.data
    const levelDescription = BLOOM_LEVELS[targetLevel]

    const systemPrompt = `You are an expert educational content creator specializing in generating high-quality questions based on learning materials.

Your task is to generate ${questionCount} thought-provoking questions that target ${levelDescription}.

Guidelines:
- Questions should be based ONLY on the provided source text
- Generate open-ended questions that require critical thinking
- Ensure questions are clear, specific, and answerable from the text
- Target a quality score of 8.0+ out of 10
- Each question should approach the topic from a different angle

Quality Criteria:
- Relevance: Directly related to the source material
- Clarity: Questions are well-formed and unambiguous
- Cognitive Depth: Require higher-order thinking
- Educational Value: Help students understand the material better

Response Format:
Return a JSON object with a "questions" array. Each question should have:
- content: The question text
- bloomsLevel: "${targetLevel}"
- qualityScore: A number from 8.0 to 10.0`

    const userPrompt = `Generate ${questionCount} high-quality questions from the following text:

---
${sourceText.substring(0, 4000)}
---

Requirements:
1. Each question must target ${levelDescription}
2. Questions should be diverse in approach
3. Maintain a quality score of at least 8.0/10
4. Questions must be answerable using information from the text

Return only the JSON object with the questions array.`

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(content)
    const questions = parsed.questions || []

    return NextResponse.json({
      success: true,
      data: {
        questions,
        count: questions.length,
      },
    })
  } catch (error) {
    console.error('Failed to generate questions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate questions. Please try again.' },
      { status: 500 }
    )
  }
}
