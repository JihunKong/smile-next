import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { ActivityModes } from '@/types/activities'

// Validation schema for creating an activity
const createActivitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  groupId: z.string().min(1, 'Group is required'),
  mode: z.number().min(0).max(3).default(0),
  aiRatingEnabled: z.boolean().default(true),
  isAnonymousAuthorAllowed: z.boolean().default(false),
  hideUsernames: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  // Mode-specific settings
  examSettings: z.object({
    timeLimit: z.number().min(0).max(180).default(30),
    questionsToShow: z.number().min(1).max(100).default(10),
    passThreshold: z.number().min(0).max(100).default(60),
    shuffleQuestions: z.boolean().default(true),
    shuffleChoices: z.boolean().default(true),
    maxAttempts: z.number().min(1).max(10).default(1),
  }).optional(),
  inquirySettings: z.object({
    questionsRequired: z.number().min(1).max(20).default(5),
    timePerQuestion: z.number().min(60).max(600).default(240),
    keywordPool1: z.array(z.string()).default([]),
    keywordPool2: z.array(z.string()).default([]),
    passThreshold: z.number().min(0).max(10).default(6),
  }).optional(),
  caseSettings: z.object({
    scenarios: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      domain: z.string().optional(),
      innovationName: z.string().optional(),
    })).default([]),
    timePerCase: z.number().min(1).max(60).default(10),
    totalTimeLimit: z.number().min(10).max(180).default(60),
    maxAttempts: z.number().min(1).max(10).default(1),
    passThreshold: z.number().min(0).max(10).default(6),
    instructions: z.string().optional(),
    is_published: z.boolean().optional(),
  }).optional(),
})

/**
 * POST /api/activities
 * Create a new activity
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = createActivitySchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const data = result.data

    // Check if user is a member of the group with sufficient permissions
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: data.groupId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    // Only admins and above can create activities (role >= 1: Admin, Co-Owner, Owner)
    if (membership.role < 1) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to create activities in this group' },
        { status: 403 }
      )
    }

    // Prepare mode-specific settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let examSettingsJson: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let inquirySettingsJson: any = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let openModeSettingsJson: any = null

    if (data.mode === ActivityModes.EXAM && data.examSettings) {
      examSettingsJson = {
        ...data.examSettings,
        is_published: data.isPublished,
      }
    } else if (data.mode === ActivityModes.INQUIRY && data.inquirySettings) {
      inquirySettingsJson = {
        ...data.inquirySettings,
        is_published: data.isPublished,
      }
    } else if (data.mode === ActivityModes.CASE && data.caseSettings) {
      // Case settings are stored in openModeSettings column
      openModeSettingsJson = {
        ...data.caseSettings,
        is_published: data.isPublished,
      }
    }

    // Determine activity type string for backwards compatibility
    const activityTypeMap: Record<number, string> = {
      0: 'Open Mode',
      1: 'Exam Mode',
      2: 'Inquiry Mode',
      3: 'Case Mode',
    }

    const activity = await prisma.activity.create({
      data: {
        name: data.name,
        description: data.description || null,
        creatorId: session.user.id,
        owningGroupId: data.groupId,
        mode: data.mode,
        activityType: activityTypeMap[data.mode] || 'Open Mode',
        aiRatingEnabled: data.aiRatingEnabled,
        isAnonymousAuthorAllowed: data.isAnonymousAuthorAllowed,
        hideUsernames: data.hideUsernames,
        visible: data.isPublished,
        examSettings: examSettingsJson,
        inquirySettings: inquirySettingsJson,
        openModeSettings: openModeSettingsJson,
      },
    })

    return NextResponse.json({
      success: true,
      data: { activityId: activity.id },
    })
  } catch (error) {
    console.error('Failed to create activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create activity. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/activities
 * Get activities for the current user's groups
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
      owningGroup: {
        members: { some: { userId: session.user.id } },
      },
    }

    if (groupId) {
      whereClause.owningGroupId = groupId
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where: whereClause,
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, username: true, avatarUrl: true },
          },
          owningGroup: {
            select: { id: true, name: true, creatorId: true },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activity.count({ where: whereClause }),
    ])

    return NextResponse.json({
      activities,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Failed to get activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
