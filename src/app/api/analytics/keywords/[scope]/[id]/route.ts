import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getKeywordAnalytics, AnalyticsFilters } from '@/lib/services/enhancedAnalyticsService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scope: string; id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scope, id } = await params
    const { searchParams } = new URL(request.url)

    if (!['student', 'activity', 'group'].includes(scope)) {
      return NextResponse.json(
        { error: 'Invalid scope. Must be: student, activity, or group' },
        { status: 400 }
      )
    }

    const filters: AnalyticsFilters = {}

    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate

    const analytics = await getKeywordAnalytics(
      scope as 'student' | 'activity' | 'group',
      id,
      filters
    )

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Failed to get keyword analytics:', error)
    return NextResponse.json({ error: 'Failed to get keyword analytics' }, { status: 500 })
  }
}
