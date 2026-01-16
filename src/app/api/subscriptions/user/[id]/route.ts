import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getUserSubscription } from '@/lib/services/subscriptionService'

/**
 * GET: Get subscription for a specific user
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Users can only view their own subscription unless admin
    const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1
    if (id !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const subscription = await getUserSubscription(id)

    if (!subscription) {
      return NextResponse.json({
        subscription: {
          planName: 'free',
          status: 'active',
          isFreeTier: true,
          limits: {
            maxGroups: 3,
            maxStorage: 100,
            maxMembers: 10,
            aiEvaluations: 10,
          },
          usage: {
            groupsUsed: 0,
            storageUsedMb: 0,
            aiEvaluationsUsed: 0,
          },
        },
      })
    }

    return NextResponse.json({
      subscription,
    })
  } catch (error) {
    console.error('[GET /api/subscriptions/user/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}
