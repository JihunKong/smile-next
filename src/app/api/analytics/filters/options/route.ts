import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getFilterOptions } from '@/lib/services/enhancedAnalyticsService'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const options = await getFilterOptions(session.user.id)

    return NextResponse.json(options)
  } catch (error) {
    console.error('Failed to get filter options:', error)
    return NextResponse.json({ error: 'Failed to get filter options' }, { status: 500 })
  }
}
