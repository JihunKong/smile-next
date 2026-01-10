import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// GET: Fetch single message with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find message where user is either sender or receiver
    const message = await prisma.message.findFirst({
      where: {
        id,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Get sender and receiver details
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: message.senderId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: message.receiverId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      }),
    ])

    const senderName = sender
      ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unknown'
      : 'Unknown'

    const receiverName = receiver
      ? `${receiver.firstName || ''} ${receiver.lastName || ''}`.trim() || 'Unknown'
      : 'Unknown'

    return NextResponse.json({
      message: {
        id: message.id,
        senderId: message.senderId,
        senderName: message.isAnonymous ? 'Anonymous' : senderName,
        senderAvatar: message.isAnonymous ? null : sender?.avatarUrl || null,
        receiverId: message.receiverId,
        receiverName,
        content: message.content,
        isRead: message.isRead,
        isAnonymous: message.isAnonymous,
        createdAt: message.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to fetch message:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    )
  }
}

// PUT: Update message (mark as read)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Only allow marking as read by the receiver
    const message = await prisma.message.updateMany({
      where: {
        id,
        receiverId: session.user.id,
      },
      data: {
        isRead: true,
      },
    })

    if (message.count === 0) {
      return NextResponse.json(
        { error: 'Message not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}

// DELETE: Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find the message first to check ownership
    const message = await prisma.message.findFirst({
      where: {
        id,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete the message
    await prisma.message.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
