import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { generateScenarios, toBasicScenarios } from '@/lib/services/caseScenarioService'
import type { CaseSettings } from '@/types/activities'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/activities/[id]/case/generate
 *
 * Generate AI scenarios for a Case Mode activity.
 * Only accessible to activity creators and group admins.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: activityId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { chapterContent, count = 8, subject, educationLevel, domain, includeFlaws = true } = body

    if (!chapterContent || typeof chapterContent !== 'string') {
      return NextResponse.json(
        { error: 'chapterContent is required' },
        { status: 400 }
      )
    }

    if (chapterContent.length < 100) {
      return NextResponse.json(
        { error: 'chapterContent must be at least 100 characters' },
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

    // Generate scenarios using AI
    const result = await generateScenarios(chapterContent, {
      count: Math.min(Math.max(1, count), 12),
      subject: subject || activity.schoolSubject || undefined,
      educationLevel: educationLevel || activity.educationLevel || undefined,
      domain,
      includeFlaws,
    })

    // Update activity settings with generated scenarios
    const currentSettings = (activity.openModeSettings as unknown as CaseSettings) || {
      scenarios: [],
      timePerCase: 10,
      totalTimeLimit: 60,
      maxAttempts: 1,
      passThreshold: 6.0,
    }

    const basicScenarios = toBasicScenarios(result.scenarios)

    await prisma.activity.update({
      where: { id: activityId },
      data: {
        openModeSettings: {
          ...currentSettings,
          scenarios: basicScenarios,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      scenarios: result.scenarios,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('[case/generate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scenarios' },
      { status: 500 }
    )
  }
}
