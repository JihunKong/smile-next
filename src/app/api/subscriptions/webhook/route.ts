import { NextResponse } from 'next/server'
import { handleStripeWebhook } from '@/lib/services/subscriptionService'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * POST: Handle Stripe webhook events
 */
export async function POST(request: Request) {
  try {
    if (!stripe) {
      console.warn('[Stripe Webhook] Stripe is not configured')
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } else {
        // In development, parse without verification
        console.warn('[Stripe Webhook] No webhook secret configured, parsing without verification')
        event = JSON.parse(body) as Stripe.Event
      }
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    const result = await handleStripeWebhook(event)

    if (result.error) {
      console.error('[Stripe Webhook] Error handling event:', result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[POST /api/subscriptions/webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// In App Router, route handlers automatically get raw body access via request.text()
// No need for bodyParser config (that was Pages Router only)
