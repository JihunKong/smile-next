import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getExpiringSubscriptions } from '@/lib/services/subscriptionService'

/**
 * GET: Get subscriptions expiring soon (admin only)
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only
    if (session.user.roleId === undefined || session.user.roleId > 1) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const subscriptions = await getExpiringSubscriptions(days)

    return NextResponse.json({
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        user: {
          email: sub.user.email,
          name: `${sub.user.firstName || ''} ${sub.user.lastName || ''}`.trim(),
        },
        plan: sub.plan?.name || sub.planName,
        currentPeriodEnd: sub.currentPeriodEnd,
        daysUntilExpiry: sub.currentPeriodEnd
          ? Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          : null,
      })),
      total: subscriptions.length,
    })
  } catch (error) {
    console.error('[GET /api/subscriptions/expiring] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get expiring subscriptions' },
      { status: 500 }
    )
  }
}
