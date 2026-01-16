import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { getUserLevelInfo } from '@/lib/services/levelService'

/**
 * GET: Get current user's level information
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const levelInfo = await getUserLevelInfo(session.user.id)

    return NextResponse.json({
      level: levelInfo,
    })
  } catch (error) {
    console.error('[GET /api/user/level] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get level information' },
      { status: 500 }
    )
  }
}
