import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import type { CaseSettings, CaseScenario } from '@/types/activities'

interface RouteParams {
  params: Promise<{ id: string; scenarioId: string }>
}

/**
 * GET /api/activities/[id]/case/scenarios/[scenarioId]
 *
 * Get a specific scenario for a Case Mode activity.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: activityId, scenarioId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false, mode: 3 },
      select: {
        openModeSettings: true,
        creatorId: true,
        owningGroup: {
          select: {
            creatorId: true,
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

    // Check membership
    if (activity.owningGroup.members.length === 0) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const caseSettings = (activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
    }

    const scenario = caseSettings.scenarios.find((s) => s.id === scenarioId)

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      scenario,
    })
  } catch (error) {
    console.error('[case/scenarios/[scenarioId] GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get scenario' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/activities/[id]/case/scenarios/[scenarioId]
 *
 * Update a specific scenario for a Case Mode activity.
 * Only accessible to activity creators and group admins.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: activityId, scenarioId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Verify activity exists and user has permission
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false, mode: 3 },
      include: {
        owningGroup: {
          select: {
            creatorId: true,
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

    const isCreator = activity.creatorId === session.user.id
    const isGroupOwner = activity.owningGroup.creatorId === session.user.id
    const membership = activity.owningGroup.members[0]
    const isAdmin = membership?.role && membership.role >= 2

    if (!isCreator && !isGroupOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get current settings
    const currentSettings = (activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      timePerCase: 10,
      totalTimeLimit: 60,
      maxAttempts: 1,
      passThreshold: 6.0,
    }

    // Find and update the scenario
    const scenarioIndex = currentSettings.scenarios.findIndex((s) => s.id === scenarioId)

    if (scenarioIndex === -1) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    const existingScenario = currentSettings.scenarios[scenarioIndex]

    // Update scenario fields
    const updatedScenario: CaseScenario = {
      ...existingScenario,
      title: typeof body.title === 'string' ? body.title.slice(0, 200) : existingScenario.title,
      content: typeof body.content === 'string' ? body.content.slice(0, 5000) : existingScenario.content,
      domain: typeof body.domain === 'string' ? body.domain.slice(0, 100) : existingScenario.domain,
    }

    // Update scenarios array
    const updatedScenarios = [...currentSettings.scenarios]
    updatedScenarios[scenarioIndex] = updatedScenario

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        openModeSettings: {
          ...currentSettings,
          scenarios: updatedScenarios,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      scenario: updatedScenario,
    })
  } catch (error) {
    console.error('[case/scenarios/[scenarioId] PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/activities/[id]/case/scenarios/[scenarioId]
 *
 * Delete a specific scenario from a Case Mode activity.
 * Only accessible to activity creators and group admins.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: activityId, scenarioId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify activity exists and user has permission
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false, mode: 3 },
      include: {
        owningGroup: {
          select: {
            creatorId: true,
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

    const isCreator = activity.creatorId === session.user.id
    const isGroupOwner = activity.owningGroup.creatorId === session.user.id
    const membership = activity.owningGroup.members[0]
    const isAdmin = membership?.role && membership.role >= 2

    if (!isCreator && !isGroupOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get current settings
    const currentSettings = (activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      timePerCase: 10,
      totalTimeLimit: 60,
      maxAttempts: 1,
      passThreshold: 6.0,
    }

    // Find the scenario
    const scenarioIndex = currentSettings.scenarios.findIndex((s) => s.id === scenarioId)

    if (scenarioIndex === -1) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Remove scenario from array
    const updatedScenarios = currentSettings.scenarios.filter((s) => s.id !== scenarioId)

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        openModeSettings: {
          ...currentSettings,
          scenarios: updatedScenarios,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully',
    })
  } catch (error) {
    console.error('[case/scenarios/[scenarioId] DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    )
  }
}
