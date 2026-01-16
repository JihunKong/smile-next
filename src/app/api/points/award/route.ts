import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { awardPoints, POINT_VALUES, PointType } from '@/lib/services/activityPointsService'

/**
 * POST: Award points to a user (internal/admin API)
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow admin or internal service calls
    const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1
    const apiKey = request.headers.get('x-api-key')
    const isInternalCall = apiKey === process.env.INTERNAL_API_KEY

    if (!isAdmin && !isInternalCall) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, pointType, metadata } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!pointType || !POINT_VALUES[pointType as PointType]) {
      return NextResponse.json({
        error: 'Invalid point type',
        validTypes: Object.keys(POINT_VALUES),
      }, { status: 400 })
    }

    const result = await awardPoints(userId, pointType as PointType, metadata)

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to award points' }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[POST /api/points/award] Error:', error)
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    )
  }
}

/**
 * GET: Get available point types and their values
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      pointTypes: POINT_VALUES,
    })
  } catch (error) {
    console.error('[GET /api/points/award] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get point types' },
      { status: 500 }
    )
  }
}
