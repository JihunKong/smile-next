import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

// GET: Validate invite code and return group info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: {
        inviteCode: code,
        isDeleted: false,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            members: true,
            activities: {
              where: { isDeleted: false },
            },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired invite code' },
        { status: 404 }
      )
    }

    // Check if user is already a member (if logged in)
    let alreadyMember = false
    const session = await auth()

    if (session?.user?.id) {
      const membership = await prisma.groupUser.findUnique({
        where: {
          userId_groupId: {
            userId: session.user.id,
            groupId: group.id,
          },
        },
      })
      alreadyMember = !!membership
    }

    return NextResponse.json({
      valid: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: group._count.members,
        activityCount: group._count.activities,
        creator: {
          firstName: group.creator.firstName,
          lastName: group.creator.lastName,
        },
      },
      alreadyMember,
    })
  } catch (error) {
    console.error('Failed to validate invite code:', error)
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invite code' },
      { status: 500 }
    )
  }
}

// POST: Accept invite (join group) - for logged in users
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to join a group' },
        { status: 401 }
      )
    }

    const { code } = await params

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: {
        inviteCode: code,
        isDeleted: false,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Invalid or expired invite code' },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMembership = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: group.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      )
    }

    // Add user to group
    await prisma.groupUser.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: 0, // Member
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully joined group',
      groupId: group.id,
    })
  } catch (error) {
    console.error('Failed to join group:', error)
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    )
  }
}
