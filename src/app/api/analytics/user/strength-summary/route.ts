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

    // Get user's questions with quality scores
    const questions = await prisma.question.findMany({
      where: {
        creatorId: session.user.id,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        activity: { select: { name: true, schoolSubject: true } },
        evaluation: { select: { bloomsLevel: true, overallScore: true } },
      },
    })

    if (questions.length < 3) {
      return NextResponse.json(
        { error: 'Insufficient data for analysis. Please create at least 3 questions.' },
        { status: 400 }
      )
    }

    // Calculate quality distribution
    const qualityScores = questions
      .filter((q) => q.evaluation?.overallScore)
      .map((q) => q.evaluation!.overallScore)

    const avgQuality =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0

    // Get subject distribution
    const subjectCounts: Record<string, number> = {}
    questions.forEach((q) => {
      const subject = q.activity.schoolSubject || 'General'
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1
    })

    const topSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([subject]) => subject)

    // Get Bloom's level distribution (bloomsLevel is a string like "1", "2", etc.)
    const bloomsLevels = questions
      .filter((q) => q.evaluation?.bloomsLevel)
      .map((q) => parseInt(q.evaluation!.bloomsLevel || '0') || 0)

    const avgBloomsLevel =
      bloomsLevels.length > 0
        ? bloomsLevels.reduce((a, b) => a + b, 0) / bloomsLevels.length
        : 0

    // Build prompt for AI summary
    const prompt = `Based on the following student data, write a concise 100-word academic profile summary:

Student Statistics:
- Total questions created: ${questions.length}
- Average quality score: ${avgQuality.toFixed(1)}/5
- Average Bloom's level: ${avgBloomsLevel.toFixed(1)}/6
- Top subjects: ${topSubjects.join(', ')}
- High quality questions (4+): ${qualityScores.filter((s) => s >= 4).length}

Sample recent questions:
${questions
  .slice(0, 5)
  .map((q) => `- "${q.content.substring(0, 100)}..." (${q.activity.name})`)
  .join('\n')}

Write a professional, encouraging summary highlighting:
1. Their questioning strengths
2. Areas of academic focus
3. One growth opportunity

Keep it exactly 100 words, professional tone, third person.`

    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    })

    const summary = completion.choices[0]?.message?.content || ''

    return NextResponse.json({
      summary: summary.trim(),
      stats: {
        totalQuestions: questions.length,
        avgQuality: Math.round(avgQuality * 10) / 10,
        avgBloomsLevel: Math.round(avgBloomsLevel * 10) / 10,
        topSubjects,
        highQualityCount: qualityScores.filter((s) => s >= 4).length,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to generate strength summary:', error)
    return NextResponse.json({ error: 'Failed to generate strength summary' }, { status: 500 })
  }
}
