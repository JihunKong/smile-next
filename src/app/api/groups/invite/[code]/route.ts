import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params

    const group = await prisma.group.findUnique({
      where: { inviteCode: code, isDeleted: false },
      include: {
        creator: {
          select: { firstName: true, lastName: true },
        },
        _count: {
          select: {
            members: true,
            activities: { where: { isDeleted: false } },
          },
        },
        members: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    const alreadyMember = group.members.length > 0

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        isPrivate: group.isPrivate,
        requirePasscode: group.requirePasscode,
        memberCount: group._count.members,
        activityCount: group._count.activities,
        autoIconGradient: group.autoIconGradient,
        groupImageUrl: group.groupImageUrl,
        creator: group.creator,
      },
      alreadyMember,
    })
  } catch (error) {
    console.error('Failed to lookup invite code:', error)
    return NextResponse.json({ error: 'Failed to lookup invite code' }, { status: 500 })
  }
}
