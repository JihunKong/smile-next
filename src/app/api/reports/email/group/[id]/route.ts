import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { sendGroupReportEmail } from '@/lib/services/emailReportsService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const body = await request.json()
    const { recipientEmail, startDate, endDate } = body

    // Verify ownership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { creatorId: true },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const email = recipientEmail || session.user.email
    if (!email) {
      return NextResponse.json({ error: 'No email address provided' }, { status: 400 })
    }

    const success = await sendGroupReportEmail(groupId, email, startDate, endDate)

    if (!success) {
      return NextResponse.json({ error: 'Failed to generate or send report' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Group report sent to ${email}`,
    })
  } catch (error) {
    console.error('Failed to send group report:', error)
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
  }
}
