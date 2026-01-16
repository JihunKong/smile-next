import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getComparativeAnalytics, AnalyticsFilters } from '@/lib/services/enhancedAnalyticsService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, ids, filters = {} } = body

    if (!type || !['activities', 'groups', 'time_periods'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid comparison type. Must be: activities, groups, or time_periods' },
        { status: 400 }
      )
    }

    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 IDs required for comparison' },
        { status: 400 }
      )
    }

    const analytics = await getComparativeAnalytics(type, ids, filters as AnalyticsFilters)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Failed to get comparative analytics:', error)
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 })
  }
}
