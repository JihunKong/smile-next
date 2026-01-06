import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'inbox'

    let messages

    if (type === 'inbox') {
      messages = await prisma.message.findMany({
        where: {
          receiverId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Get sender names
      const senderIds = [...new Set(messages.map((m) => m.senderId))]
      const senders = await prisma.user.findMany({
        where: { id: { in: senderIds } },
        select: { id: true, firstName: true, lastName: true },
      })
      const senderMap = new Map(senders.map((s) => [s.id, `${s.firstName} ${s.lastName}`]))

      messages = messages.map((m) => ({
        ...m,
        senderName: m.isAnonymous ? 'Anonymous' : senderMap.get(m.senderId) || 'Unknown',
      }))
    } else {
      messages = await prisma.message.findMany({
        where: {
          senderId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Get receiver names
      const receiverIds = [...new Set(messages.map((m) => m.receiverId))]
      const receivers = await prisma.user.findMany({
        where: { id: { in: receiverIds } },
        select: { id: true, firstName: true, lastName: true },
      })
      const receiverMap = new Map(receivers.map((r) => [r.id, `${r.firstName} ${r.lastName}`]))

      messages = messages.map((m) => ({
        ...m,
        senderName: receiverMap.get(m.receiverId) || 'Unknown',
      }))
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { receiverId, content, isAnonymous } = await request.json()

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver and content are required' },
        { status: 400 }
      )
    }

    // Check receiver's preferences
    const receiverPrefs = await prisma.messagePreference.findUnique({
      where: { userId: receiverId },
    })

    if (receiverPrefs) {
      if (!receiverPrefs.enableUserMessages) {
        return NextResponse.json(
          { error: 'This user is not accepting messages' },
          { status: 400 }
        )
      }

      if (isAnonymous && !receiverPrefs.allowAnonymousMessages) {
        return NextResponse.json(
          { error: 'This user does not accept anonymous messages' },
          { status: 400 }
        )
      }

      if (receiverPrefs.allowMessagesFrom === 'none') {
        return NextResponse.json(
          { error: 'This user is not accepting messages' },
          { status: 400 }
        )
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        isAnonymous: isAnonymous || false,
      },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
