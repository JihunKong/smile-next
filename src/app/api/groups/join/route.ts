import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { GroupRoles } from '@/types/groups'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { inviteCode, passcode } = body

    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    const group = await prisma.group.findUnique({
      where: { inviteCode, isDeleted: false },
      include: {
        members: {
          where: { userId: session.user.id },
          select: { id: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    if (group.members.length > 0) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 })
    }

    if (group.requirePasscode) {
      if (!passcode || passcode !== group.passcode) {
        return NextResponse.json({ error: 'Invalid passcode' }, { status: 400 })
      }
    }

    await prisma.groupUser.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: GroupRoles.MEMBER,
      },
    })

    return NextResponse.json({ success: true, groupId: group.id })
  } catch (error) {
    console.error('Failed to join group:', error)
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
  }
}
