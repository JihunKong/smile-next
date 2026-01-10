import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import type { CaseSettings, CaseScenario } from '@/types/activities'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/activities/[id]/case/scenarios
 *
 * Get scenarios for a Case Mode activity.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: activityId } = await params
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

    return NextResponse.json({
      scenarios: caseSettings.scenarios,
    })
  } catch (error) {
    console.error('[case/scenarios GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get scenarios' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/activities/[id]/case/scenarios
 *
 * Update scenarios for a Case Mode activity.
 * Only accessible to activity creators and group admins.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id: activityId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scenarios } = body

    if (!Array.isArray(scenarios)) {
      return NextResponse.json(
        { error: 'scenarios must be an array' },
        { status: 400 }
      )
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

    // Validate scenarios
    const validatedScenarios: CaseScenario[] = scenarios
      .filter(
        (s: unknown): s is Record<string, unknown> =>
          typeof s === 'object' && s !== null
      )
      .map((s, index) => ({
        id: typeof s.id === 'string' ? s.id : `scenario-${index + 1}`,
        title: typeof s.title === 'string' ? s.title.slice(0, 200) : `Scenario ${index + 1}`,
        content: typeof s.content === 'string' ? s.content.slice(0, 3000) : '',
        domain: typeof s.domain === 'string' ? s.domain : undefined,
      }))
      .filter((s) => s.content.length > 0)

    // Update activity settings
    const currentSettings = (activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      timePerCase: 10,
      totalTimeLimit: 60,
      maxAttempts: 1,
      passThreshold: 6.0,
    }

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        openModeSettings: {
          ...currentSettings,
          scenarios: validatedScenarios,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      scenarios: validatedScenarios,
    })
  } catch (error) {
    console.error('[case/scenarios PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update scenarios' },
      { status: 500 }
    )
  }
}
