import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const preferences = await prisma.messagePreference.findUnique({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Failed to fetch preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      enableUserMessages,
      enableNotifications,
      allowAnonymousMessages,
      allowMessagesFrom,
      notificationSettings,
    } = await request.json()

    const preferences = await prisma.messagePreference.upsert({
      where: { userId: session.user.id },
      update: {
        enableUserMessages,
        enableNotifications,
        allowAnonymousMessages,
        allowMessagesFrom,
        notificationSettings,
      },
      create: {
        userId: session.user.id,
        enableUserMessages,
        enableNotifications,
        allowAnonymousMessages,
        allowMessagesFrom,
        notificationSettings,
      },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Failed to update preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
