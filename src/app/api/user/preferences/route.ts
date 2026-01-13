import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Validation schema for preferences
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['ko', 'en']).optional(),
  timezone: z.string().optional(),
  emailDigest: z.boolean().optional(),
  emailFrequency: z.enum(['daily', 'weekly', 'never']).optional(),
  showOnlineStatus: z.boolean().optional(),
  showActivityStatus: z.boolean().optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  reduceMotion: z.boolean().optional(),
  additionalSettings: z.record(z.string(), z.any()).optional(),
})

/**
 * GET /api/user/preferences
 * Get user's preferences
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create preferences
    let preferences = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.userPreference.create({
        data: { userId: session.user.id },
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    console.error('[Preferences GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/preferences
 * Update user's preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validation = preferencesSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { additionalSettings, ...restData } = validation.data

    // Prepare data with proper JSON typing
    const updateData = {
      ...restData,
      ...(additionalSettings !== undefined && {
        additionalSettings: additionalSettings as Prisma.InputJsonValue,
      }),
    }

    // Upsert preferences
    const preferences = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    })

    return NextResponse.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    console.error('[Preferences PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/preferences
 * Partially update user's preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input (all fields optional for PATCH)
    const validation = preferencesSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { additionalSettings, ...restData } = validation.data

    // Get existing preferences
    let preferences = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    })

    // Prepare data with proper JSON typing
    const patchData = {
      ...restData,
      ...(additionalSettings !== undefined && {
        additionalSettings: additionalSettings as Prisma.InputJsonValue,
      }),
    }

    if (!preferences) {
      // Create with partial data
      preferences = await prisma.userPreference.create({
        data: {
          userId: session.user.id,
          ...patchData,
        },
      })
    } else {
      // Merge additionalSettings if provided
      let mergedAdditionalSettings: Prisma.InputJsonValue | undefined = undefined
      if (additionalSettings) {
        const existing = (preferences.additionalSettings as Record<string, unknown>) || {}
        mergedAdditionalSettings = {
          ...existing,
          ...additionalSettings,
        } as Prisma.InputJsonValue
      }

      // Update with partial data
      preferences = await prisma.userPreference.update({
        where: { userId: session.user.id },
        data: {
          ...restData,
          ...(mergedAdditionalSettings !== undefined && {
            additionalSettings: mergedAdditionalSettings,
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    })
  } catch (error) {
    console.error('[Preferences PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
