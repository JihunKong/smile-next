import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
} from '@/lib/services/notificationService'

/**
 * GET: Get notifications for the current user
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const countOnly = searchParams.get('countOnly') === 'true'

    if (countOnly) {
      const unreadCount = await getUnreadCount(session.user.id)
      return NextResponse.json({ unreadCount })
    }

    const result = await getNotifications(session.user.id, page, limit)
    const unreadCount = await getUnreadCount(session.user.id)

    return NextResponse.json({
      ...result,
      unreadCount,
    })
  } catch (error) {
    console.error('[GET /api/notifications] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}

/**
 * POST: Mark all notifications as read
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, notificationId } = await request.json()

    if (action === 'mark_all_read') {
      const success = await markAllAsRead(session.user.id)
      return NextResponse.json({ success })
    }

    if (action === 'mark_read' && notificationId) {
      const { markAsRead } = await import('@/lib/services/notificationService')
      const success = await markAsRead(notificationId, session.user.id)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/notifications] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process notification action' },
      { status: 500 }
    )
  }
}
