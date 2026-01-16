import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { getFilteredActivityAnalytics, AnalyticsFilters } from '@/lib/services/enhancedAnalyticsService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId } = await params
    const body = await request.json()
    const filters: AnalyticsFilters = body.filters || {}

    // Check permission
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: {
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
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const isCreator = activity.creatorId === session.user.id
    const isAdmin = (activity.owningGroup?.members[0]?.role ?? 0) >= 1

    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const analytics = await getFilteredActivityAnalytics(activityId, filters)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Failed to get filtered activity analytics:', error)
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 })
  }
}
