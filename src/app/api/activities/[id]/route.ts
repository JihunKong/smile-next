import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const activity = await prisma.activity.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        name: true,
        isAnonymousAuthorAllowed: true,
        owningGroup: {
          select: {
            id: true,
            name: true,
            members: {
              where: { userId: session.user.id },
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user is a member of the group
    if (activity.owningGroup.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      id: activity.id,
      name: activity.name,
      isAnonymousAuthorAllowed: activity.isAnonymousAuthorAllowed,
      owningGroup: {
        id: activity.owningGroup.id,
        name: activity.owningGroup.name,
      },
    })
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}
