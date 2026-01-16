import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getSubscriptionStatistics } from '@/lib/services/subscriptionService'

/**
 * GET: Get subscription statistics (admin only)
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only
    if (session.user.roleId === undefined || session.user.roleId > 1) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const statistics = await getSubscriptionStatistics()

    if (!statistics) {
      return NextResponse.json(
        { error: 'Failed to get statistics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      statistics,
    })
  } catch (error) {
    console.error('[GET /api/subscriptions/statistics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription statistics' },
      { status: 500 }
    )
  }
}
