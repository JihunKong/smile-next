import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const bulkDeleteSchema = z.object({
  messageIds: z.array(z.string()).min(1, 'At least one message ID is required'),
  type: z.enum(['inbox', 'sent']).default('inbox'),
})

/**
 * POST /api/messages/bulk-delete
 * Delete multiple messages at once
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = bulkDeleteSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    const { messageIds, type } = result.data

    // Delete messages where user is either sender or receiver based on type
    const deleteResult = await prisma.message.deleteMany({
      where: {
        id: { in: messageIds },
        ...(type === 'inbox'
          ? { receiverId: session.user.id }
          : { senderId: session.user.id }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleteResult.count,
      },
    })
  } catch (error) {
    console.error('Failed to delete messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete messages' },
      { status: 500 }
    )
  }
}
