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

// Types
export interface Tier2Guidance {
  questionId: string
  bloomsDeepDive: string // 80-100 words
  teachingStrategies: string // 60-80 words
  learningActivities: string // 40-60 words
  standardsAndSkills: string // 20-40 words
  metadata: {
    inputTokens: number
    outputTokens: number
    processingTimeMs: number
    generatedAt: string
  }
}

// Bloom's Level Names for reference
const BLOOMS_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

// Get existing Tier 2 guidance or null
export async function getTier2Guidance(questionId: string): Promise<Tier2Guidance | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      evaluation: true,
    },
  })

  if (!question || !question.evaluation) return null

  // Check if tier2 guidance already exists in evaluation's strengths/improvements as a workaround
  // Since there's no metadata field, we'll store it differently or regenerate each time
  const strengths = question.evaluation.strengths as unknown[] | null
  if (
    Array.isArray(strengths) &&
    strengths.length > 0 &&
    typeof strengths[0] === 'object' &&
    strengths[0] !== null &&
    'tier2Guidance' in (strengths[0] as Record<string, unknown>)
  ) {
    return (strengths[0] as { tier2Guidance: Tier2Guidance }).tier2Guidance
  }

  return null
}

// Generate new Tier 2 guidance
export async function generateTier2Guidance(
  questionId: string,
  userId: string
): Promise<Tier2Guidance | null> {
  const startTime = Date.now()

  // Get question with evaluation and activity
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      evaluation: true,
      activity: { select: { name: true, schoolSubject: true } },
    },
  })

  if (!question) return null

  // Verify access - creator or has teacher role
  // For now, allow the question creator
  if (question.creatorId !== userId) {
    // Could add additional role checks here
  }

  const bloomsLevelStr = question.evaluation?.bloomsLevel || '3'
  const bloomsLevel = parseInt(bloomsLevelStr) || 3
  const bloomsName = BLOOMS_LEVELS[bloomsLevel - 1] || 'Apply'
  const overallScore = question.evaluation?.overallScore || 3

  // Build AI prompt for Tier 2 analysis
  const prompt = `You are an educational expert providing Tier 2 (deeper) analysis of a student question for teachers.

Question: "${question.content}"
Subject: ${question.activity?.schoolSubject || 'General'}
Activity: ${question.activity?.name || 'Unknown'}
Current Bloom's Level: ${bloomsLevel} (${bloomsName})
Quality Score: ${overallScore}/5

Provide detailed analysis in exactly this JSON format:
{
  "bloomsDeepDive": "80-100 words analyzing WHY this question is at the ${bloomsName} level. Reference specific words/phrases that indicate this level. Explain what cognitive processes the question requires.",
  "teachingStrategies": "60-80 words with concrete teaching strategies for building on this question. Include specific prompts teachers can use.",
  "learningActivities": "40-60 words suggesting 2-3 specific learning activities that could stem from this question.",
  "standardsAndSkills": "20-40 words identifying relevant academic standards or 21st century skills this question addresses."
}

Be specific and actionable. Reference the actual question content.`

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const aiResponse = JSON.parse(completion.choices[0]?.message?.content || '{}')
    const usage = completion.usage

    const processingTimeMs = Date.now() - startTime

    const guidance: Tier2Guidance = {
      questionId,
      bloomsDeepDive: aiResponse.bloomsDeepDive || '',
      teachingStrategies: aiResponse.teachingStrategies || '',
      learningActivities: aiResponse.learningActivities || '',
      standardsAndSkills: aiResponse.standardsAndSkills || '',
      metadata: {
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        processingTimeMs,
        generatedAt: new Date().toISOString(),
      },
    }

    // Store in evaluation strengths for caching (workaround since no metadata field)
    if (question.evaluation) {
      await prisma.questionEvaluation.update({
        where: { id: question.evaluation.id },
        data: {
          strengths: [{ tier2Guidance: JSON.parse(JSON.stringify(guidance)) }],
        },
      })
    }

    return guidance
  } catch (error) {
    console.error('Failed to generate Tier 2 guidance:', error)

    // Return basic guidance without AI
    const processingTimeMs = Date.now() - startTime
    const subject = question.activity?.schoolSubject || 'the subject'

    return {
      questionId,
      bloomsDeepDive: `This question operates at the ${bloomsName} level of Bloom's Taxonomy. At this level, students are expected to demonstrate their ability to ${bloomsName.toLowerCase()} information. The specific wording and structure of the question indicate this cognitive demand.`,
      teachingStrategies: `Consider using scaffolding techniques to help students engage with this question. Ask follow-up questions that probe deeper understanding. Encourage students to explain their reasoning.`,
      learningActivities: `Students could work in pairs to discuss their answers. A class debate on different perspectives could deepen understanding.`,
      standardsAndSkills: `This question addresses critical thinking and communication skills relevant to the ${subject} area.`,
      metadata: {
        inputTokens: 0,
        outputTokens: 0,
        processingTimeMs,
        generatedAt: new Date().toISOString(),
      },
    }
  }
}
