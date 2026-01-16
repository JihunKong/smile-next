import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { sendActivityReportEmail } from '@/lib/services/emailReportsService'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: activityId } = await params
    const body = await request.json()
    const { recipientEmail, startDate, endDate } = body

    // Verify ownership or admin access
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { creatorId: true, owningGroupId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user is owner or group owner
    const isOwner = activity.creatorId === session.user.id
    const isGroupOwner = activity.owningGroupId
      ? await prisma.group.findFirst({
          where: {
            id: activity.owningGroupId,
            creatorId: session.user.id,
          },
        })
      : null

    if (!isOwner && !isGroupOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const email = recipientEmail || session.user.email
    if (!email) {
      return NextResponse.json({ error: 'No email address provided' }, { status: 400 })
    }

    const success = await sendActivityReportEmail(activityId, email, startDate, endDate)

    if (!success) {
      return NextResponse.json({ error: 'Failed to generate or send report' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Activity report sent to ${email}`,
    })
  } catch (error) {
    console.error('Failed to send activity report:', error)
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
  }
}
