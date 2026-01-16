import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/services/subscriptionService'

/**
 * POST: Create a Stripe checkout session for subscription
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, successUrl, cancelUrl } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get base URL for default redirect URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const finalSuccessUrl = successUrl || `${baseUrl}/settings/subscription?success=true`
    const finalCancelUrl = cancelUrl || `${baseUrl}/settings/subscription?cancelled=true`

    const result = await createCheckoutSession(
      session.user.id,
      planId,
      finalSuccessUrl,
      finalCancelUrl
    )

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.url,
    })
  } catch (error) {
    console.error('[POST /api/subscriptions/create-checkout-session] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
