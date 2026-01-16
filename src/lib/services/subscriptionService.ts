import { prisma } from '@/lib/db/prisma'
import Stripe from 'stripe'

// Initialize Stripe if API key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-12-15.clover' })
  : null

// Default subscription plans
export const DEFAULT_PLANS = [
  {
    name: 'Free',
    description: 'Basic access for individual learners',
    price: 0,
    interval: 'monthly',
    features: [
      'Join up to 3 groups',
      'Create up to 50 questions/month',
      '10 AI evaluations/month',
      'Basic analytics',
    ],
    maxGroups: 3,
    maxStorage: 100,
    maxMembers: 10,
    aiEvaluations: 10,
  },
  {
    name: 'Basic',
    description: 'For individual teachers and small groups',
    price: 9.99,
    interval: 'monthly',
    features: [
      'Create up to 5 groups',
      'Unlimited questions',
      '100 AI evaluations/month',
      'Advanced analytics',
      'Export capabilities',
    ],
    maxGroups: 5,
    maxStorage: 500,
    maxMembers: 30,
    aiEvaluations: 100,
  },
  {
    name: 'Professional',
    description: 'For schools and institutions',
    price: 29.99,
    interval: 'monthly',
    features: [
      'Create up to 20 groups',
      'Unlimited questions',
      '500 AI evaluations/month',
      'Full analytics suite',
      'Priority support',
      'Certificate generation',
    ],
    maxGroups: 20,
    maxStorage: 2048,
    maxMembers: 100,
    aiEvaluations: 500,
  },
  {
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: 99.99,
    interval: 'monthly',
    features: [
      'Unlimited groups',
      'Unlimited questions',
      'Unlimited AI evaluations',
      'Full analytics suite',
      'Dedicated support',
      'Custom integrations',
      'White-label options',
    ],
    maxGroups: -1, // -1 means unlimited
    maxStorage: -1,
    maxMembers: -1,
    aiEvaluations: -1,
  },
]

/**
 * Get all active subscription plans
 */
export async function getSubscriptionPlans() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    // If no plans exist, return default plans
    if (plans.length === 0) {
      return DEFAULT_PLANS.map((plan, index) => ({
        id: `default-${plan.name.toLowerCase()}`,
        ...plan,
        features: plan.features,
        isActive: true,
        sortOrder: index,
        stripePriceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    }

    return plans
  } catch (error) {
    console.error('[SubscriptionService] Failed to get plans:', error)
    return []
  }
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: string) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      // Return free tier subscription info
      return {
        id: null,
        planName: 'free',
        status: 'active',
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
        isFreeTier: true,
      }
    }

    // Get actual usage
    const groupsCount = await prisma.group.count({
      where: { creatorId: userId, isDeleted: false },
    })

    return {
      id: subscription.id,
      planId: subscription.planId,
      planName: subscription.plan?.name || subscription.planName,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      limits: {
        maxGroups: subscription.plan?.maxGroups ?? 5,
        maxStorage: subscription.plan?.maxStorage ?? 1024,
        maxMembers: subscription.plan?.maxMembers ?? 50,
        aiEvaluations: subscription.plan?.aiEvaluations ?? 100,
      },
      usage: {
        groupsUsed: groupsCount,
        storageUsedMb: subscription.storageUsedMb,
        aiEvaluationsUsed: subscription.aiEvaluationsUsed,
      },
      isFreeTier: false,
    }
  } catch (error) {
    console.error('[SubscriptionService] Failed to get user subscription:', error)
    return null
  }
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string) {
  if (!stripe) {
    return { error: 'Stripe is not configured' }
  }

  try {
    // Get the plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return { error: 'Plan not found' }
    }

    if (!plan.stripePriceId) {
      return { error: 'Plan does not have a Stripe price configured' }
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { stripeCustomerId: { not: null } },
          take: 1,
        },
      },
    })

    if (!user) {
      return { error: 'User not found' }
    }

    let customerId = user.subscriptions[0]?.stripeCustomerId

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        metadata: { userId },
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
      },
    })

    return { sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('[SubscriptionService] Failed to create checkout session:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, planId } = session.metadata || {}

        if (userId && planId && session.subscription) {
          // Create subscription record
          await prisma.subscription.create({
            data: {
              userId,
              planId,
              stripeSubscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              status: 'active',
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const subData = subscription as { id: string; status: string; cancel_at_period_end: boolean; start_date?: number; ended_at?: number | null }
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subData.id },
          data: {
            status: subData.status,
            cancelAtPeriodEnd: subData.cancel_at_period_end,
            currentPeriodStart: subData.start_date ? new Date(subData.start_date * 1000) : undefined,
            currentPeriodEnd: subData.ended_at ? new Date(subData.ended_at * 1000) : undefined,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as { id: string }
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as { subscription?: string | null }
        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription },
            data: { status: 'past_due' },
          })
        }
        break
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[SubscriptionService] Failed to handle webhook:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, reason?: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!subscription) {
      return { error: 'Subscription not found' }
    }

    // Cancel in Stripe if applicable
    if (stripe && subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })
    }

    // Update local record
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
        cancelReason: reason,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('[SubscriptionService] Failed to cancel subscription:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update subscription usage
 */
export async function updateSubscriptionUsage(
  userId: string,
  usage: { aiEvaluations?: number; storageMb?: number }
) {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] },
      },
    })

    if (!subscription) {
      return { error: 'No active subscription' }
    }

    const updateData: Record<string, number> = {}

    if (usage.aiEvaluations !== undefined) {
      updateData.aiEvaluationsUsed = {
        increment: usage.aiEvaluations,
      } as unknown as number
    }

    if (usage.storageMb !== undefined) {
      updateData.storageUsedMb = {
        increment: usage.storageMb,
      } as unknown as number
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: updateData,
    })

    return { success: true }
  } catch (error) {
    console.error('[SubscriptionService] Failed to update usage:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get expiring subscriptions (for admin notifications)
 */
export async function getExpiringSubscriptions(daysUntilExpiry: number = 7) {
  try {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry)

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          lte: expiryDate,
          gte: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        plan: true,
      },
      orderBy: { currentPeriodEnd: 'asc' },
    })

    return subscriptions
  } catch (error) {
    console.error('[SubscriptionService] Failed to get expiring subscriptions:', error)
    return []
  }
}

/**
 * Get subscription statistics (for admin dashboard)
 */
export async function getSubscriptionStatistics() {
  try {
    const [totalActive, byPlan, revenueData, churnData] = await Promise.all([
      // Total active subscriptions
      prisma.subscription.count({
        where: { status: { in: ['active', 'trialing'] } },
      }),

      // Subscriptions by plan
      prisma.subscription.groupBy({
        by: ['planName'],
        where: { status: { in: ['active', 'trialing'] } },
        _count: true,
      }),

      // Subscriptions created in last 30 days (new subscribers)
      prisma.subscription.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Subscriptions cancelled in last 30 days
      prisma.subscription.count({
        where: {
          status: 'cancelled',
          cancelledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    // Calculate MRR (Monthly Recurring Revenue)
    const plans = await prisma.subscriptionPlan.findMany()
    const planPrices = new Map(plans.map(p => [p.name, Number(p.price)]))

    const mrr = byPlan.reduce((total, group) => {
      const price = planPrices.get(group.planName) || 0
      return total + price * group._count
    }, 0)

    return {
      totalActive,
      byPlan: byPlan.map(g => ({ plan: g.planName, count: g._count })),
      newSubscribers30d: revenueData,
      churn30d: churnData,
      mrr: mrr.toFixed(2),
      churnRate: totalActive > 0 ? ((churnData / totalActive) * 100).toFixed(2) : '0',
    }
  } catch (error) {
    console.error('[SubscriptionService] Failed to get statistics:', error)
    return null
  }
}

/**
 * Check if user has access to a feature based on subscription
 */
export async function checkFeatureAccess(
  userId: string,
  feature: 'groups' | 'storage' | 'ai_evaluations' | 'members'
): Promise<{ allowed: boolean; limit: number; used: number; remaining: number }> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return { allowed: false, limit: 0, used: 0, remaining: 0 }
  }

  const limits = subscription.limits
  const usage = subscription.usage

  switch (feature) {
    case 'groups':
      const groupLimit = limits.maxGroups === -1 ? Infinity : limits.maxGroups
      return {
        allowed: usage.groupsUsed < groupLimit,
        limit: limits.maxGroups,
        used: usage.groupsUsed,
        remaining: Math.max(0, groupLimit - usage.groupsUsed),
      }

    case 'storage':
      const storageLimit = limits.maxStorage === -1 ? Infinity : limits.maxStorage
      return {
        allowed: usage.storageUsedMb < storageLimit,
        limit: limits.maxStorage,
        used: usage.storageUsedMb,
        remaining: Math.max(0, storageLimit - usage.storageUsedMb),
      }

    case 'ai_evaluations':
      const evalLimit = limits.aiEvaluations === -1 ? Infinity : limits.aiEvaluations
      return {
        allowed: usage.aiEvaluationsUsed < evalLimit,
        limit: limits.aiEvaluations,
        used: usage.aiEvaluationsUsed,
        remaining: Math.max(0, evalLimit - usage.aiEvaluationsUsed),
      }

    case 'members':
      return {
        allowed: true, // Member check is per-group
        limit: limits.maxMembers,
        used: 0,
        remaining: limits.maxMembers,
      }

    default:
      return { allowed: false, limit: 0, used: 0, remaining: 0 }
  }
}
