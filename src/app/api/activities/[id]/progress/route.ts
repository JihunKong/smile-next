import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { calculateStudentProgress } from '@/lib/services/openModePassService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: activityId } = await params

  try {
    // Verify user is a member of the activity's group
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, isDeleted: false },
      select: {
        owningGroup: {
          select: {
            members: {
              where: { userId: session.user.id },
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    if (activity.owningGroup.members.length === 0) {
      return NextResponse.json({ error: 'Not a member' }, { status: 403 })
    }

    // Calculate student's progress
    const progress = await calculateStudentProgress(activityId, session.user.id)

    if (!progress) {
      // Pass/fail not enabled or not Open Mode
      return NextResponse.json({ enabled: false })
    }

    return NextResponse.json({
      enabled: true,
      ...progress,
    })
  } catch (error) {
    console.error('Failed to calculate progress:', error)
    return NextResponse.json(
      { error: 'Failed to calculate progress' },
      { status: 500 }
    )
  }
}
