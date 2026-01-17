import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId } = await params
    const body = await request.json()
    const count = Math.min(Math.max(body.count || 5, 1), 10) // 1-10 questions

    // Get activity details
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      select: {
        id: true,
        name: true,
        description: true,
        topic: true,
        schoolSubject: true,
        educationLevel: true,
        level: true,
        creatorId: true,
        owningGroup: {
          select: {
            name: true,
            members: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check permission (creator or group admin)
    const isCreator = activity.creatorId === session.user.id
    const isAdmin = (activity.owningGroup?.members[0]?.role ?? 0) >= 1

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Build prompt for AI question generation
    const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
    const levelIndex = Math.min(Number(activity.level) || 2, 5)

    const prompt = `You are an expert educational question designer following Bloom's Taxonomy principles.

Generate ${count} high-quality student questions for the following activity:

Activity Name: ${activity.name}
Description: ${activity.description || 'Not specified'}
Subject: ${activity.schoolSubject || 'General'}
Topic: ${activity.topic || 'Not specified'}
Education Level: ${activity.educationLevel || 'Not specified'}
Target Bloom's Level: ${bloomLevels[levelIndex]} (and adjacent levels)

Guidelines:
1. Questions should encourage critical thinking and deeper understanding
2. Vary the question types (what, how, why, compare, evaluate, design)
3. Target primarily ${bloomLevels[levelIndex]} level with some ${bloomLevels[Math.max(0, levelIndex - 1)]} and ${bloomLevels[Math.min(5, levelIndex + 1)]} level questions
4. Make questions relevant to the topic and educational context
5. Questions should be open-ended and promote discussion

Return a JSON object with a "questions" array containing exactly ${count} question strings.
Example format:
{
  "questions": [
    "How might the concept of X apply to real-world situation Y?",
    "Compare and contrast the approaches of A and B in solving problem C.",
    "What evidence would you need to evaluate the claim that...?"
  ]
}`

    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
    }

    const parsed = JSON.parse(responseContent)
    const generatedQuestions: string[] = parsed.questions || []

    if (generatedQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions generated' }, { status: 500 })
    }

    // Create questions in database
    const createdQuestions = await prisma.$transaction(
      generatedQuestions.map((questionContent) =>
        prisma.question.create({
          data: {
            content: questionContent,
            creatorId: session.user.id,
            activityId: activityId,
            isAnonymous: false,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      count: createdQuestions.length,
      questions: createdQuestions.map((q) => ({
        id: q.id,
        content: q.content,
      })),
    })
  } catch (error) {
    console.error('Failed to generate questions:', error)
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}
