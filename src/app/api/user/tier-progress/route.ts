import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getTierProgress } from '@/lib/services/levelService'

/**
 * GET: Get current user's tier progress
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progress = await getTierProgress(session.user.id)

    return NextResponse.json({
      tierProgress: progress,
    })
  } catch (error) {
    console.error('[GET /api/user/tier-progress] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get tier progress' },
      { status: 500 }
    )
  }
}
