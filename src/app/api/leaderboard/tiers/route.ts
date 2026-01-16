import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getTierLeaderboard, TierId } from '@/lib/services/levelService'

/**
 * GET: Get leaderboard by tier
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') as TierId | null
    const limit = parseInt(searchParams.get('limit') || '20')

    const leaderboard = await getTierLeaderboard(tier || undefined, Math.min(limit, 100))

    return NextResponse.json({
      leaderboard,
      tier: tier || 'all',
      count: leaderboard.length,
    })
  } catch (error) {
    console.error('[GET /api/leaderboard/tiers] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get tier leaderboard' },
      { status: 500 }
    )
  }
}
