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

interface FactCheckWarning {
  scenario_number: number
  claim: string
  issue: string
  suggested_correction: string
  severity: 'high' | 'medium' | 'low'
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
    const { activityId } = body

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'Activity ID is required' }, { status: 400 })
    }

    // Get activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      select: {
        id: true,
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

    if (scenarios.length === 0) {
      return NextResponse.json({
        success: true,
        warnings: [],
        message: 'No scenarios to verify',
      })
    }

    // Verify facts in each scenario
    const allWarnings: FactCheckWarning[] = []

    for (const scenario of scenarios) {
      const prompt = `You are a fact-checker. Analyze the following case study scenario for factual accuracy.

Scenario #${scenario.scenario_number}: ${scenario.title}
Domain: ${scenario.domain}
Content: ${scenario.scenario_content}

Identify any claims that might be:
1. Factually incorrect
2. Misleading or exaggerated
3. Outdated information
4. Logically inconsistent

For each issue found, provide:
- The specific claim
- What's wrong with it
- A suggested correction
- Severity (high = completely false, medium = misleading, low = minor inaccuracy)

Respond in JSON format:
{
  "warnings": [
    {
      "claim": "The specific claim or statement",
      "issue": "What's wrong with it",
      "suggested_correction": "How to fix it",
      "severity": "high|medium|low"
    }
  ]
}

If no issues are found, return: { "warnings": [] }`

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        })

        const result = JSON.parse(completion.choices[0]?.message?.content || '{"warnings": []}')

        if (result.warnings && Array.isArray(result.warnings)) {
          for (const warning of result.warnings) {
            allWarnings.push({
              scenario_number: scenario.scenario_number,
              claim: warning.claim,
              issue: warning.issue,
              suggested_correction: warning.suggested_correction,
              severity: warning.severity as 'high' | 'medium' | 'low',
            })
          }
        }
      } catch (aiError) {
        console.error(`Failed to verify scenario ${scenario.scenario_number}:`, aiError)
      }
    }

    return NextResponse.json({
      success: true,
      warnings: allWarnings,
      scenarios_checked: scenarios.length,
    })
  } catch (error) {
    console.error('Failed to verify facts:', error)
    return NextResponse.json({ success: false, error: 'Failed to verify facts' }, { status: 500 })
  }
}
