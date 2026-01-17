import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { generateInviteCode } from '@/lib/groups/utils'
import { GroupRoles } from '@/types/groups'
import { ActivityModes } from '@/types/activities'
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

// Validation schema
const activityMakerSchema = z.object({
  targetAudience: z.string().min(1, 'Target audience is required'),
  primaryLanguage: z.string().min(2, 'Language is required'),
  mainTopic: z.string().min(1, 'Main topic is required'),
  educationLevel: z.enum(['elementary', 'middle', 'high', 'college', 'graduate']),
  subTopics: z.string().optional(),
  questionCount: z.number().refine(val => val === 5 || val === 10, {
    message: 'Question count must be 5 or 10'
  }),
  groupSelection: z.enum(['existing', 'new']),
  groupId: z.string().optional(),
  newGroupName: z.string().optional(),
  groupPrivacy: z.enum(['public', 'private']).optional(),
})

// Supported languages with full names
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  zh: 'Mandarin Chinese',
  yue: 'Cantonese',
  ko: 'Korean',
  ja: 'Japanese',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ar: 'Arabic',
  hi: 'Hindi',
  sw: 'Swahili',
  ur: 'Urdu',
  th: 'Thai',
  ru: 'Russian',
  kk: 'Kazakh',
  ms: 'Malay',
  id: 'Indonesian',
  vi: 'Vietnamese',
  it: 'Italian',
  fi: 'Finnish',
  sv: 'Swedish',
}

// Education level descriptions
const EDUCATION_LEVELS: Record<string, string> = {
  elementary: 'elementary school (ages 6-11)',
  middle: 'middle school (ages 11-14)',
  high: 'high school (ages 14-18)',
  college: 'college/university undergraduate',
  graduate: 'graduate school (masters/PhD)',
}

interface GeneratedQuestion {
  content: string
  bloomsLevel: string
  qualityScore: number
}

/**
 * Generate inquiry-based questions using OpenAI
 */
async function generateQuestions(params: {
  mainTopic: string
  targetAudience: string
  educationLevel: string
  primaryLanguage: string
  subTopics?: string
  questionCount: number
}): Promise<GeneratedQuestion[]> {
  const languageName = LANGUAGE_NAMES[params.primaryLanguage] || params.primaryLanguage
  const levelDescription = EDUCATION_LEVELS[params.educationLevel] || params.educationLevel

  const systemPrompt = `You are an expert educational content creator specializing in inquiry-based learning.
Your task is to generate high-quality, thought-provoking questions that target Bloom's Taxonomy Level 5 (Evaluate) and Level 6 (Create).

Guidelines:
- Generate questions that promote critical thinking, analysis, and creativity
- Questions should be open-ended and encourage deep exploration
- Target quality score of 8.0+ out of 10
- Each question should be unique and approach the topic from different angles
- Questions must be appropriate for ${levelDescription} students
- Output must be in ${languageName}

Quality Criteria:
- Clarity: Questions are clear and well-formed
- Relevance: Directly related to the topic
- Cognitive Depth: Require higher-order thinking
- Creativity: Encourage innovative thinking
- Engagement: Spark curiosity and discussion

Response Format:
Return a JSON object with a "questions" array. Each question should have:
- content: The question text
- bloomsLevel: Either "evaluate" or "create"
- qualityScore: A number from 8.0 to 10.0`

  const userPrompt = `Generate ${params.questionCount} high-quality, inquiry-based questions about "${params.mainTopic}" for ${params.targetAudience}.

Education Level: ${levelDescription}
${params.subTopics ? `Sub-topics to cover: ${params.subTopics}` : ''}

Requirements:
1. Each question must target Bloom's Level 5 (Evaluate) or Level 6 (Create)
2. Questions should be diverse in approach and perspective
3. Maintain a quality score of at least 8.0/10
4. Language: ${languageName}

Return only the JSON object with the questions array.`

  try {
    const response = await getOpenAI().chat.completions.create({
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
    return parsed.questions || []
  } catch (error) {
    console.error('Failed to generate questions:', error)
    // Return fallback template questions
    return generateFallbackQuestions(params)
  }
}

/**
 * Generate fallback questions if AI generation fails
 */
function generateFallbackQuestions(params: {
  mainTopic: string
  questionCount: number
}): GeneratedQuestion[] {
  const templates = [
    `What are the potential long-term implications of ${params.mainTopic}?`,
    `How would you evaluate the effectiveness of current approaches to ${params.mainTopic}?`,
    `If you could redesign one aspect of ${params.mainTopic}, what would it be and why?`,
    `What criteria would you use to assess the success of ${params.mainTopic}?`,
    `How might ${params.mainTopic} evolve in the next decade?`,
    `What are the most significant ethical considerations related to ${params.mainTopic}?`,
    `How would you create a new solution to improve ${params.mainTopic}?`,
    `What evidence would you need to support or refute claims about ${params.mainTopic}?`,
    `How does ${params.mainTopic} compare to similar concepts in other fields?`,
    `What would be the consequences if we approached ${params.mainTopic} differently?`,
  ]

  return templates.slice(0, params.questionCount).map((content, index) => ({
    content,
    bloomsLevel: index % 2 === 0 ? 'evaluate' : 'create',
    qualityScore: 8.0,
  }))
}

/**
 * POST /api/tools/activity-maker
 * Create an activity with AI-generated questions
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = activityMakerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const data = result.data

    // Validate group selection
    if (data.groupSelection === 'existing' && !data.groupId) {
      return NextResponse.json(
        { success: false, error: 'Please select a group' },
        { status: 400 }
      )
    }

    if (data.groupSelection === 'new' && !data.newGroupName) {
      return NextResponse.json(
        { success: false, error: 'Please enter a group name' },
        { status: 400 }
      )
    }

    let groupId: string

    // Handle group selection
    if (data.groupSelection === 'new') {
      // Create new group
      const gradientIndex = Math.floor(Math.random() * 8)
      const newGroup = await prisma.group.create({
        data: {
          name: data.newGroupName!,
          creatorId: session.user.id,
          isPrivate: data.groupPrivacy === 'private',
          inviteCode: generateInviteCode(),
          autoIconGradient: gradientIndex.toString(),
          members: {
            create: {
              userId: session.user.id,
              role: GroupRoles.OWNER,
            },
          },
        },
      })
      groupId = newGroup.id
    } else {
      // Verify existing group membership and permissions
      const membership = await prisma.groupUser.findUnique({
        where: {
          userId_groupId: {
            userId: session.user.id,
            groupId: data.groupId!,
          },
        },
      })

      if (!membership) {
        return NextResponse.json(
          { success: false, error: 'You are not a member of this group' },
          { status: 403 }
        )
      }

      if (membership.role < 1) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to create activities in this group' },
          { status: 403 }
        )
      }

      groupId = data.groupId!
    }

    // Generate AI questions
    const generatedQuestions = await generateQuestions({
      mainTopic: data.mainTopic,
      targetAudience: data.targetAudience,
      educationLevel: data.educationLevel,
      primaryLanguage: data.primaryLanguage,
      subTopics: data.subTopics,
      questionCount: data.questionCount,
    })

    // Create the activity (Inquiry Mode = 2)
    const activity = await prisma.activity.create({
      data: {
        name: data.mainTopic,
        description: `AI-generated inquiry activity for ${data.targetAudience}`,
        creatorId: session.user.id,
        owningGroupId: groupId,
        mode: ActivityModes.INQUIRY,
        activityType: 'Inquiry Mode',
        aiRatingEnabled: true,
        visible: true,
        educationLevel: data.educationLevel,
        topic: data.mainTopic,
        inquirySettings: {
          questionsRequired: data.questionCount,
          targetAudience: data.targetAudience,
          primaryLanguage: data.primaryLanguage,
          subTopics: data.subTopics,
          aiGenerated: true,
          bloomsTarget: 'evaluate/create',
          qualityThreshold: 8.0,
        },
      },
    })

    // Create the seed questions
    const createdQuestions = await prisma.question.createMany({
      data: generatedQuestions.map((q) => ({
        content: q.content,
        creatorId: session.user.id,
        activityId: activity.id,
        isAnonymous: false,
        questionEvaluationScore: q.qualityScore,
        aiGenerated: true,
      })),
    })

    // Update activity question count
    await prisma.activity.update({
      where: { id: activity.id },
      data: { numberOfQuestions: generatedQuestions.length },
    })

    // Fetch the created questions for response
    const questions = await prisma.question.findMany({
      where: { activityId: activity.id },
      select: { id: true, content: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        activityId: activity.id,
        groupId,
        questions: questions.map(q => ({ id: q.id, content: q.content })),
        questionCount: createdQuestions.count,
      },
    })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create activity. Please try again.' },
      { status: 500 }
    )
  }
}
