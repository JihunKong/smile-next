import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import {
  getUserStreak,
  recordActivity,
  checkMilestoneBadges,
} from '@/lib/services/streakService'

/**
 * GET /api/user/streak
 * Get user's current streak and badge info
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const streakInfo = await getUserStreak(session.user.id)

    return NextResponse.json({
      success: true,
      data: streakInfo,
    })
  } catch (error) {
    console.error('[Streak GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get streak info' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/streak
 * Record activity and update streak
 */
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Record the activity
    const result = await recordActivity(session.user.id)

    // Check for any milestone badges
    const milestoneBadges = await checkMilestoneBadges(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        currentStreak: result.streak,
        isNewDay: result.isNewDay,
        earnedBadges: [...result.earnedBadges, ...milestoneBadges],
      },
    })
  } catch (error) {
    console.error('[Streak POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record activity' },
      { status: 500 }
    )
  }
}
