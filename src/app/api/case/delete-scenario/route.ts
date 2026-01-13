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
    const { activityId, scenarioId, scenarioIds } = body

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

    // Determine which scenarios to delete
    const idsToDelete = scenarioIds || (scenarioId ? [scenarioId] : [])

    if (idsToDelete.length === 0) {
      return NextResponse.json({ success: false, error: 'No scenario IDs provided' }, { status: 400 })
    }

    // Remove scenarios
    scenarios = scenarios.filter((s) => !idsToDelete.includes(s.id))

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

    return NextResponse.json({
      success: true,
      deleted_count: idsToDelete.length,
      remaining_count: scenarios.length,
    })
  } catch (error) {
    console.error('Failed to delete scenarios:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete scenarios' }, { status: 500 })
  }
}
