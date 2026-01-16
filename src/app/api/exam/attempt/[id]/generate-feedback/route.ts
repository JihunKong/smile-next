import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { generateExamCoachingFeedback } from '@/lib/services/examCoachingService'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: attemptId } = await params

    const feedback = await generateExamCoachingFeedback(attemptId, session.user.id)

    if (!feedback) {
      return NextResponse.json(
        { error: 'Exam attempt not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Failed to generate exam feedback:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
