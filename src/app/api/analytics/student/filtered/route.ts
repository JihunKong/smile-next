import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getFilteredStudentAnalytics, AnalyticsFilters } from '@/lib/services/enhancedAnalyticsService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const filters: AnalyticsFilters = body.filters || {}

    const analytics = await getFilteredStudentAnalytics(session.user.id, filters)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Failed to get filtered student analytics:', error)
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 })
  }
}
