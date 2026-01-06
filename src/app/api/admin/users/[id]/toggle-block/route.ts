import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (roleId 0 or 1)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roleId: true },
    })

    if (!currentUser || currentUser.roleId > 1) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { roleId: true, isBlocked: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent blocking admins or super admins (unless you're super admin)
    if (targetUser.roleId <= 1 && currentUser.roleId !== 0) {
      return NextResponse.json(
        { error: 'Cannot block admin users' },
        { status: 403 }
      )
    }

    // Prevent self-block
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      )
    }

    const { block } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isBlocked: block },
      select: {
        id: true,
        isBlocked: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Failed to toggle block:', error)
    return NextResponse.json(
      { error: 'Failed to toggle block status' },
      { status: 500 }
    )
  }
}
