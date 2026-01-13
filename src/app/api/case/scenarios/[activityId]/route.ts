import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { activityId } = await params
    const { searchParams } = new URL(request.url)
    const includeAnswers = searchParams.get('include_answers') === 'true'

    // Get activity with case settings
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      select: {
        id: true,
        name: true,
        mode: true,
        caseSettings: true,
        creatorId: true,
        owningGroup: {
          select: {
            id: true,
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

    if (activity.mode !== 3) {
      return NextResponse.json({ success: false, error: 'This is not a Case mode activity' }, { status: 400 })
    }

    // Check access
    const isCreator = activity.creatorId === session.user.id
    const membership = activity.owningGroup.members[0]
    const isAdmin = membership?.role >= 1

    if (!isCreator && !isAdmin && !membership) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const caseSettings = (activity.caseSettings as CaseSettings) || {
      scenarios: [],
      configuration: {
        difficulty_level: 'medium',
        num_cases_to_show: 3,
        max_attempts: 3,
        pass_threshold: 6.0,
      },
      is_finalized: false,
    }

    // If not creator/admin and not include_answers, hide expected flaws/solutions
    let scenarios = caseSettings.scenarios || []
    if (!includeAnswers && !isCreator && !isAdmin) {
      scenarios = scenarios.map((s) => ({
        ...s,
        expected_flaws: [],
        expected_solutions: [],
      }))
    }

    return NextResponse.json({
      success: true,
      scenarios,
      configuration: caseSettings.configuration,
      is_finalized: caseSettings.is_finalized || false,
    })
  } catch (error) {
    console.error('Failed to get scenarios:', error)
    return NextResponse.json({ success: false, error: 'Failed to get scenarios' }, { status: 500 })
  }
}
