import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
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

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's authentic questions (filter out AI-generated, limit to 200 chars)
    const questions = await prisma.question.findMany({
      where: {
        creatorId: session.user.id,
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        activity: { select: { name: true, owningGroup: { select: { name: true } } } },
      },
    })

    // Filter for authentic questions (short, non-AI patterns)
    const authenticQuestions = questions
      .filter((q) => q.content.length <= 200 && !q.content.startsWith('AI:'))
      .slice(0, 15)

    if (authenticQuestions.length < 5) {
      return NextResponse.json(
        { error: 'Insufficient questions for analysis. Please create at least 5 questions.' },
        { status: 400 }
      )
    }

    // Build prompt with user's questions
    const questionsList = authenticQuestions
      .map((q, i) => `${i + 1}. "${q.content}" (${q.activity.name})`)
      .join('\n')

    const prompt = `Analyze the following student questions to provide evidence-based career insights.

Student's Questions:
${questionsList}

Based on these questions, provide:
1. A 2-3 paragraph analysis that directly quotes specific questions as evidence for your insights
2. Identify 3+ specific career-relevant insights with direct evidence from the questions
3. Identify growth areas the student should develop
4. Recommend specific fields that align with their demonstrated interests

Format your response as JSON:
{
  "analysis": "2-3 paragraphs with direct quotes...",
  "careerInsights": [
    {
      "insight": "specific insight",
      "evidence": "direct quote from their question",
      "reasoning": "why this indicates career aptitude"
    }
  ],
  "growthAreas": ["area1", "area2", ...],
  "recommendedFields": ["field1", "field2", ...],
  "evidenceSummary": "brief summary of key evidence patterns"
}`

    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 })
    }

    const analysis = JSON.parse(responseContent)

    return NextResponse.json({
      ...analysis,
      questionsAnalyzed: authenticQuestions.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to generate career analysis:', error)
    return NextResponse.json({ error: 'Failed to generate career analysis' }, { status: 500 })
  }
}
