import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import type { CaseSettings } from '@/types/activities'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/activities/[id]/case/settings
 *
 * Get settings for a Case Mode activity.
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

    // Check permission
    const isCreator = activity.creatorId === session.user.id
    const isGroupOwner = activity.owningGroup.creatorId === session.user.id
    const membership = activity.owningGroup.members[0]
    const isAdmin = membership?.role && membership.role >= 2

    if (!isCreator && !isGroupOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const caseSettings = (activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      timePerCase: 10,
      totalTimeLimit: 60,
      maxAttempts: 1,
      passThreshold: 6.0,
    }

    return NextResponse.json({
      success: true,
      settings: caseSettings,
    })
  } catch (error) {
    console.error('[case/settings GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/activities/[id]/case/settings
 *
 * Update settings for a Case Mode activity.
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

    // Get current settings to preserve scenarios if not provided
    const currentSettings = (activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      timePerCase: 10,
      totalTimeLimit: 60,
      maxAttempts: 1,
      passThreshold: 6.0,
    }

    // Validate and build new settings
    const newSettings: CaseSettings = {
      scenarios: Array.isArray(body.scenarios) ? body.scenarios : currentSettings.scenarios,
      timePerCase: typeof body.timePerCase === 'number'
        ? Math.max(1, Math.min(60, body.timePerCase))
        : currentSettings.timePerCase,
      totalTimeLimit: typeof body.totalTimeLimit === 'number'
        ? Math.max(1, Math.min(180, body.totalTimeLimit))
        : currentSettings.totalTimeLimit,
      maxAttempts: typeof body.maxAttempts === 'number'
        ? Math.max(1, Math.min(10, body.maxAttempts))
        : currentSettings.maxAttempts,
      passThreshold: typeof body.passThreshold === 'number'
        ? Math.max(1, Math.min(10, body.passThreshold))
        : currentSettings.passThreshold,
      is_published: typeof body.is_published === 'boolean'
        ? body.is_published
        : currentSettings.is_published,
      // Optional fields
      source_material: body.source_material || currentSettings.source_material,
      num_cases_to_show: typeof body.num_cases_to_show === 'number'
        ? Math.max(1, Math.min(10, body.num_cases_to_show))
        : currentSettings.num_cases_to_show,
      difficulty_level: body.difficulty_level || currentSettings.difficulty_level,
      anonymize_leaderboard: typeof body.anonymize_leaderboard === 'boolean'
        ? body.anonymize_leaderboard
        : currentSettings.anonymize_leaderboard,
      instructions: body.instructions || currentSettings.instructions,
    }

    // Update activity settings
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        openModeSettings: newSettings as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      settings: newSettings,
    })
  } catch (error) {
    console.error('[case/settings PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
