import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { sendInquiryResultNotification } from '@/lib/services/inquiryNotificationService'

/**
 * POST: Send inquiry result notification for a specific attempt
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attemptId } = await params
    const body = await request.json().catch(() => ({}))
    const { recipientEmail, includeOwner = true } = body

    // Verify the attempt exists and user has permission
    const attempt = await prisma.inquiryAttempt.findUnique({
      where: { id: attemptId },
      include: {
        activity: {
          include: {
            owningGroup: {
              select: {
                creatorId: true,
              },
            },
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Inquiry attempt not found' }, { status: 404 })
    }

    // Check permission: user must be the student, group owner, or admin
    const isStudent = attempt.userId === session.user.id
    const isOwner = attempt.activity.owningGroup.creatorId === session.user.id
    const isAdmin = session.user.roleId !== undefined && session.user.roleId <= 1

    if (!isStudent && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const result = await sendInquiryResultNotification({
      attemptId,
      recipientEmail,
      includeOwner,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send notification' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[POST /api/notifications/inquiry/[attemptId]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send inquiry notification' },
      { status: 500 }
    )
  }
}
