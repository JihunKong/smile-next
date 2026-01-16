import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { sendStudentWeeklyReportEmail } from '@/lib/services/emailReportsService'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await sendStudentWeeklyReportEmail(session.user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to generate or send report. Make sure you have a valid email.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Weekly report sent to your email',
    })
  } catch (error) {
    console.error('Failed to send student weekly report:', error)
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
  }
}
