import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getOptimalTiming } from '@/lib/services/predictiveAnalyticsService'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const timingData = await getOptimalTiming(session.user.id)

    if (timingData.length === 0) {
      return NextResponse.json(
        { error: 'No activity data available for timing analysis' },
        { status: 400 }
      )
    }

    // Group by day for easier consumption
    const byDay = new Map<string, typeof timingData>()
    timingData.forEach((t) => {
      const existing = byDay.get(t.dayOfWeek) || []
      existing.push(t)
      byDay.set(t.dayOfWeek, existing)
    })

    // Find best overall times
    const bestTimes = timingData.slice(0, 5).map((t) => ({
      day: t.dayOfWeek,
      hour: t.hour,
      formatted: `${t.dayOfWeek} ${t.hour}:00`,
      questionCount: t.questionCount,
    }))

    return NextResponse.json({
      optimalTimes: bestTimes,
      detailedAnalysis: Object.fromEntries(byDay),
      recommendation:
        bestTimes.length > 0
          ? `Best engagement time: ${bestTimes[0].formatted}`
          : 'Not enough data for recommendation',
    })
  } catch (error) {
    console.error('Failed to get optimal timing:', error)
    return NextResponse.json({ error: 'Failed to get timing analysis' }, { status: 500 })
  }
}
