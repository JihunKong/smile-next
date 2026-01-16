import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getInsightsSummary } from '@/lib/services/predictiveAnalyticsService'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const insights = await getInsightsSummary(session.user.id)

    if (!insights) {
      return NextResponse.json(
        { error: 'No groups found. Create a group to see insights.' },
        { status: 400 }
      )
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Failed to get insights summary:', error)
    return NextResponse.json({ error: 'Failed to get insights' }, { status: 500 })
  }
}
