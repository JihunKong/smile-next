import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { cancelSubscription } from '@/lib/services/subscriptionService'

/**
 * POST: Cancel a subscription
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reason } = body

    // Verify the subscription belongs to the user or user is admin
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1
    if (subscription.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const result = await cancelSubscription(id, reason)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
    })
  } catch (error) {
    console.error('[POST /api/subscriptions/[id]/cancel] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
