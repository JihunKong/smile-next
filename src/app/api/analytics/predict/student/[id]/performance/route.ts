import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { getStudentPerformancePrediction } from '@/lib/services/predictiveAnalyticsService'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params

    // Users can view their own predictions, teachers can view their students
    if (studentId !== session.user.id) {
      // Check if requester is a teacher with access
      // For now, allow if not same user (could add group membership check)
    }

    const prediction = await getStudentPerformancePrediction(studentId)

    if (!prediction) {
      return NextResponse.json(
        { error: 'Insufficient data for prediction. At least 3 questions needed.' },
        { status: 400 }
      )
    }

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Failed to get performance prediction:', error)
    return NextResponse.json({ error: 'Failed to get prediction' }, { status: 500 })
  }
}
