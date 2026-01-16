import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getAchievementsSummary } from '@/lib/services/levelService'

/**
 * GET: Get user's achievements summary
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const summary = await getAchievementsSummary(session.user.id)

    return NextResponse.json({
      achievements: summary,
    })
  } catch (error) {
    console.error('[GET /api/user/achievements-summary] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get achievements summary' },
      { status: 500 }
    )
  }
}
