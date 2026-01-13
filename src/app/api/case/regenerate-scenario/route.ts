import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import OpenAI from 'openai'

interface CaseSettings {
  scenarios?: CaseScenario[]
  configuration?: CaseConfiguration
  is_finalized?: boolean
}

interface CaseScenario {
  id: string
  scenario_number: number
  title: string
  domain: string
  innovation_name?: string
  scenario_content: string
  expected_flaws: Array<{ flaw: string; explanation: string; severity: string }>
  expected_solutions: Array<{ solution: string; details: string; implementation: string }>
  is_active: boolean
  created_by_ai: boolean
  edited_by_creator: boolean
}

interface CaseConfiguration {
  difficulty_level: string
  num_cases_to_show: number
  max_attempts: number
  pass_threshold: number
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { activityId, scenarioId, domain, difficulty } = body

    if (!activityId || !scenarioId) {
      return NextResponse.json({ success: false, error: 'Activity ID and Scenario ID are required' }, { status: 400 })
    }

    // Get activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      select: {
        id: true,
        name: true,
        description: true,
        caseSettings: true,
        creatorId: true,
        owningGroup: {
          select: {
            members: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 })
    }

    // Check permission
    const isCreator = activity.creatorId === session.user.id
    const isAdmin = activity.owningGroup.members[0]?.role >= 1
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 })
    }

    const caseSettings = (activity.caseSettings as CaseSettings) || { scenarios: [], configuration: {} }
    const scenarios = caseSettings.scenarios || []

    // Find the scenario to regenerate
    const scenarioIndex = scenarios.findIndex((s) => s.id === scenarioId)
    if (scenarioIndex === -1) {
      return NextResponse.json({ success: false, error: 'Scenario not found' }, { status: 404 })
    }

    const oldScenario = scenarios[scenarioIndex]
    const scenarioDomain = domain || oldScenario.domain || 'Technology'
    const scenarioDifficulty = difficulty || caseSettings.configuration?.difficulty_level || 'medium'

    // Generate new scenario with AI
    const prompt = `You are an expert at creating educational case studies for critical thinking exercises.

Generate a new case study scenario for the domain: ${scenarioDomain}
Difficulty level: ${scenarioDifficulty}
Activity context: ${activity.name} - ${activity.description || 'No description'}

The scenario should present an innovation or system with intentional flaws that students need to identify.

Respond in JSON format:
{
  "title": "A catchy title for the scenario",
  "innovation_name": "Name of the innovation/system being analyzed",
  "scenario_content": "A detailed 200-300 word description of the innovation with its features and claims",
  "expected_flaws": [
    { "flaw": "Description of the flaw", "explanation": "Why this is problematic", "severity": "high|medium|low" }
  ],
  "expected_solutions": [
    { "solution": "How to fix the flaw", "details": "More specific details", "implementation": "How to implement" }
  ]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const generatedContent = JSON.parse(completion.choices[0]?.message?.content || '{}')

    // Update scenario
    scenarios[scenarioIndex] = {
      ...oldScenario,
      title: generatedContent.title || oldScenario.title,
      innovation_name: generatedContent.innovation_name || '',
      scenario_content: generatedContent.scenario_content || oldScenario.scenario_content,
      expected_flaws: generatedContent.expected_flaws || [],
      expected_solutions: generatedContent.expected_solutions || [],
      domain: scenarioDomain,
      created_by_ai: true,
      edited_by_creator: false,
    }

    // Save updated settings
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        caseSettings: JSON.parse(JSON.stringify({
          ...caseSettings,
          scenarios,
        })),
      },
    })

    return NextResponse.json({
      success: true,
      scenario: scenarios[scenarioIndex],
    })
  } catch (error) {
    console.error('Failed to regenerate scenario:', error)
    return NextResponse.json({ success: false, error: 'Failed to regenerate scenario' }, { status: 500 })
  }
}
