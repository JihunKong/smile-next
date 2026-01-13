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

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { activityId, configuration } = body

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

    // Validate we have scenarios
    if (!caseSettings.scenarios || caseSettings.scenarios.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot finalize without any scenarios',
      }, { status: 400 })
    }

    // Validate configuration
    const finalConfig: CaseConfiguration = {
      difficulty_level: configuration?.difficulty_level || caseSettings.configuration?.difficulty_level || 'medium',
      num_cases_to_show: configuration?.num_cases_to_show || caseSettings.configuration?.num_cases_to_show || 3,
      max_attempts: configuration?.max_attempts || caseSettings.configuration?.max_attempts || 3,
      pass_threshold: configuration?.pass_threshold || caseSettings.configuration?.pass_threshold || 6.0,
    }

    // Ensure num_cases_to_show doesn't exceed available scenarios
    if (finalConfig.num_cases_to_show > caseSettings.scenarios.length) {
      finalConfig.num_cases_to_show = caseSettings.scenarios.length
    }

    // Save finalized settings
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        caseSettings: JSON.parse(JSON.stringify({
          ...caseSettings,
          configuration: finalConfig,
          is_finalized: true,
        })),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Case activity finalized successfully',
      configuration: finalConfig,
      scenario_count: caseSettings.scenarios.length,
    })
  } catch (error) {
    console.error('Failed to finalize case:', error)
    return NextResponse.json({ success: false, error: 'Failed to finalize case activity' }, { status: 500 })
  }
}
