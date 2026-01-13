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

// Update a scenario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { scenarioId } = await params
    const body = await request.json()
    const { activityId, title, domain, innovation_name, scenario_content, expected_flaws, expected_solutions } = body

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

    // Find and update scenario
    const scenarioIndex = scenarios.findIndex((s) => s.id === scenarioId)
    if (scenarioIndex === -1) {
      return NextResponse.json({ success: false, error: 'Scenario not found' }, { status: 404 })
    }

    scenarios[scenarioIndex] = {
      ...scenarios[scenarioIndex],
      title: title ?? scenarios[scenarioIndex].title,
      domain: domain ?? scenarios[scenarioIndex].domain,
      innovation_name: innovation_name ?? scenarios[scenarioIndex].innovation_name,
      scenario_content: scenario_content ?? scenarios[scenarioIndex].scenario_content,
      expected_flaws: expected_flaws ?? scenarios[scenarioIndex].expected_flaws,
      expected_solutions: expected_solutions ?? scenarios[scenarioIndex].expected_solutions,
      edited_by_creator: true,
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
    console.error('Failed to update scenario:', error)
    return NextResponse.json({ success: false, error: 'Failed to update scenario' }, { status: 500 })
  }
}

// Delete a scenario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { scenarioId } = await params
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activityId')

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
    let scenarios = caseSettings.scenarios || []

    // Remove scenario
    scenarios = scenarios.filter((s) => s.id !== scenarioId)

    // Renumber remaining scenarios
    scenarios = scenarios.map((s, index) => ({
      ...s,
      scenario_number: index + 1,
    }))

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete scenario:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete scenario' }, { status: 500 })
  }
}
