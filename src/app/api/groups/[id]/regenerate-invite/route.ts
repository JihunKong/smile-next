import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { type GroupRole } from '@/types/groups'
import { canManageGroup, generateInviteCode } from '@/lib/groups/utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check membership and permissions
    const membership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: id,
        },
      },
    })

    if (!membership || !canManageGroup(membership.role as GroupRole, 'invite')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const newCode = generateInviteCode()

    await prisma.group.update({
      where: { id },
      data: { inviteCode: newCode },
    })

    return NextResponse.json({ success: true, inviteCode: newCode })
  } catch (error) {
    console.error('Failed to regenerate invite code:', error)
    return NextResponse.json({ error: 'Failed to regenerate invite code' }, { status: 500 })
  }
}
