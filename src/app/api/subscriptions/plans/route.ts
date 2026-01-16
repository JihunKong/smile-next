import { NextResponse } from 'next/server'
import { getSubscriptionPlans } from '@/lib/services/subscriptionService'

/**
 * GET: Get all subscription plans
 */
export async function GET() {
  try {
    const plans = await getSubscriptionPlans()

    return NextResponse.json({
      plans,
    })
  } catch (error) {
    console.error('[GET /api/subscriptions/plans] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription plans' },
      { status: 500 }
    )
  }
}
