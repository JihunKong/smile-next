import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { updateSubscriptionUsage } from '@/lib/services/subscriptionService'

/**
 * POST: Update subscription usage (internal API)
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, aiEvaluations, storageMb } = body

    // Only allow updating own usage or admin updating any user
    const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1
    const targetUserId = userId || session.user.id

    if (targetUserId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const usage: { aiEvaluations?: number; storageMb?: number } = {}

    if (typeof aiEvaluations === 'number') {
      usage.aiEvaluations = aiEvaluations
    }

    if (typeof storageMb === 'number') {
      usage.storageMb = storageMb
    }

    if (Object.keys(usage).length === 0) {
      return NextResponse.json({ error: 'No usage data provided' }, { status: 400 })
    }

    const result = await updateSubscriptionUsage(targetUserId, usage)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/subscriptions/update-usage] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update usage' },
      { status: 500 }
    )
  }
}
