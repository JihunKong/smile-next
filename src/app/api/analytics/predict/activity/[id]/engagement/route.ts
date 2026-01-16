import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { getActivityEngagementPrediction } from '@/lib/services/predictiveAnalyticsService'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId } = await params

    // Verify access to activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { creatorId: true, owningGroupId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user is owner or member
    const isOwner = activity.creatorId === session.user.id
    const isMember = activity.owningGroupId
      ? await prisma.groupUser.findFirst({
          where: { groupId: activity.owningGroupId, userId: session.user.id },
        })
      : null

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const prediction = await getActivityEngagementPrediction(activityId)

    if (!prediction) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Failed to get engagement prediction:', error)
    return NextResponse.json({ error: 'Failed to get prediction' }, { status: 500 })
  }
}
