import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getUserQuestionsJourney } from '@/lib/services/enhancedAnalyticsService'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const journey = await getUserQuestionsJourney(session.user.id, Math.min(limit, 100))

    return NextResponse.json(journey)
  } catch (error) {
    console.error('Failed to get user questions journey:', error)
    return NextResponse.json({ error: 'Failed to get questions' }, { status: 500 })
  }
}
